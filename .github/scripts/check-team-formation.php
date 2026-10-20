<?php

declare(strict_types=1);

use App\Actions\Project\CreateProject;
use App\Actions\Team\AcceptTeamInvitation;
use App\Actions\Team\AcceptTeamJoinRequest;
use App\Actions\Team\RejectTeamJoinRequest;
use App\Actions\Team\RequestToJoinTeam;
use App\Actions\Team\WithdrawTeamJoinRequest;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TeamJoinRequestStatus;
use App\Events\MatchingInputsChanged;
use App\Http\Controllers\TeamTransitionController;
use App\Http\Requests\Team\RequestToJoinTeamRequest;
use App\Http\Requests\Team\TeamDecisionRequest;
use App\Http\Requests\Team\WithdrawTeamJoinRequestRequest;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Task;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use App\Notifications\TeamJoinRequestReceivedNotification;
use App\Notifications\TeamJoinRequestRespondedNotification;
use App\Support\Team\TeamDecisionSnapshot;
use App\Support\Team\TeamFormationSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
foreach (['APP_ENV' => 'testing', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'FAIL '.$error->getMessage().' at '.$error->getFile().':'.$error->getLine().PHP_EOL);
    exit(1);
});
config()->set('database.default', 'team_check');
config()->set('database.connections.team_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
config()->set('matching.enabled', false);
if (DB::connection()->getName() !== 'team_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian hanya boleh berjalan pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-10 09:00:00');
$checks = 0;
function expectTeam(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function failTeam(callable $operation, string $exception, string $message, ?int $status = null): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectTeam($error instanceof $exception && ($status === null || ($error instanceof HttpException && $error->getStatusCode() === $status)), $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}
function teamRevision(TeamJoinRequest $request): string
{
    return TeamDecisionSnapshot::revision($request->fresh(), TeamDecisionSnapshot::context($request->project->fresh()));
}
function teamRequest(string $class, string $name, User $user, Project|TeamJoinRequest $model, array $data = []): Request
{
    $parameter = $model instanceof Project ? 'project' : 'teamJoinRequest';
    $route = new Route('POST', 'test/{'.$parameter.'}', fn () => null);
    $route->name($name);
    $route->bind(Request::create('/test/'.$model->getKey(), 'POST'));
    $route->setParameter($parameter, $model);
    $request = $class::create('/test/'.$model->getKey(), 'POST', $data);
    $request->setRouteResolver(fn () => $route);
    $request->setUserResolver(fn () => $user);
    $request->setContainer(app());
    $request->setRedirector(app('redirect'));

    return $request;
}
$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data sintetis']);
config()->set('university.slug', $campus->slug);
$otherCampus = Institution::factory()->active()->create(['name' => 'Kampus B. Data sintetis']);
$owner = User::factory()->create();
$student = User::factory()->create();
$peer = User::factory()->create();
$outsider = User::factory()->create();
$campusAdmin = User::factory()->create();
foreach ([$owner, $student, $peer] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->getKey(), 'institution_id' => $campus->getKey()]);
}
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $outsider->getKey(), 'institution_id' => $otherCampus->getKey()]);
InstitutionMembership::factory()->campusAdmin()->verifiedByRosterExactMatch()->create(['user_id' => $campusAdmin->getKey(), 'institution_id' => $campus->getKey()]);
$realNotifications = Notification::getFacadeRoot();
Notification::fake();
Event::fake([MatchingInputsChanged::class]);
$creator = $app->make(CreateProject::class);
$requester = $app->make(RequestToJoinTeam::class);
$accept = $app->make(AcceptTeamJoinRequest::class);
$reject = $app->make(RejectTeamJoinRequest::class);
$withdraw = $app->make(WithdrawTeamJoinRequest::class);
$serializer = $app->make(TeamFormationSerializer::class);
$make = function (int $capacity = 3, int $roleCapacity = 2) use ($creator, $owner, $campus): Project {
    $project = $creator->handle($owner, $campus, ['title' => 'Kolaborasi. Data sintetis', 'description' => 'Tujuan belajar dan menyusun karya.', 'capacity' => $capacity, 'deadline' => now()->addWeek(), 'roles' => [['title' => 'Perancang', 'capacity' => $roleCapacity, 'selection_criteria' => 'Minat belajar desain dan waktu diskusi terjadwal.', 'accepts_beginners' => true]]]);
    $project->forceFill(['status' => ProjectStatus::Open])->save();

    return $project->refresh()->load('roles.skills');
};
$project = $make();
$role = $project->roles[0];
Auth::setUser($student);
$form = teamRequest(RequestToJoinTeamRequest::class, 'projects.join-requests.store', $student, $project, ['project_role_id' => $role->getKey(), 'interest' => ' Belajar desain ', 'skills' => 'Dasar Figma. Belum memiliki karya.', 'availability' => 'Selasa sore.']);
$form->validateResolved();
$response = $app->make(TeamTransitionController::class)->requestJoin($form, $project, $requester);
$join = TeamJoinRequest::query()->findOrFail($response->getData(true)['data']['id']);
expectTeam($response->getStatusCode() === 201 && str_contains($join->message, "\nKetersediaan: Selasa sore."), 'Pengajuan tiga jawaban dinormalisasi dan disimpan dalam pesan existing, tanpa schema baru.');
expectTeam(! Gate::forUser($student)->allows('viewAny', [Task::class, $project]), 'Pengajuan pending belum membuka workspace.');
expectTeam(TeamMembership::query()->whereBelongsTo($project)->count() === 0, 'Pengajuan pending tidak membentuk membership atau memakai kapasitas.');
expectTeam(Notification::sent($owner, TeamJoinRequestReceivedNotification::class)->count() === 1, 'Pengajuan diarahkan ke notifikasi pemilik yang tepat.');
failTeam(fn () => $requester->handle($student, $project, $role->getKey()), HttpException::class, 'Pengajuan ganda ditolak dengan konflik, tidak membuat record kedua.', 409);
foreach (['interest', 'skills', 'availability'] as $key) {
    $data = ['interest' => 'Minat', 'skills' => 'Belajar', 'availability' => 'Selasa'];
    unset($data[$key]);
    failTeam(fn () => teamRequest(RequestToJoinTeamRequest::class, 'projects.join-requests.store', $student, $project, $data)->validateResolved(), ValidationException::class, 'Jawaban '.$key.' wajib pada endpoint baru.');
}
failTeam(fn () => teamRequest(RequestToJoinTeamRequest::class, 'projects.join-requests.store', $student, $project, ['interest' => ' ', 'skills' => 'Belajar', 'availability' => 'Selasa'])->validateResolved(), ValidationException::class, 'Jawaban whitespace tidak lolos validasi.');
$foreignRole = ProjectRole::factory()->create();
expectTeam(! Validator::make(['project_role_id' => $foreignRole->getKey(), 'interest' => 'Minat', 'skills' => 'Belajar', 'availability' => 'Selasa'], $form->rules())->passes(), 'Peran dari proyek lain ditolak pada Form Request.');
$self = $serializer->serialize($project->fresh(), $student);
$owned = $serializer->serialize($project->fresh(), $owner);
expectTeam(count($owned['join_requests']) === 1 && $owned['join_requests'][0]['revision'] === teamRevision($join), 'Pemilik mendapat ringkasan, kriteria dan revisi sumber yang benar.');
expectTeam($self['join_requests'] === [] && $self['pending_join_request']['id'] === $join->getKey(), 'Pemohon hanya melihat pengajuan sendiri, bukan antrean pelamar.');
expectTeam($serializer->serialize($project->fresh(), $peer)['pending_join_request'] === null, 'Mahasiswa lain tidak menerima jawaban pemohon.');
expectTeam($serializer->serialize($project->fresh(), $campusAdmin)['join_requests'] === [], 'Operator tidak otomatis mendapat data pelamar.');
failTeam(fn () => $serializer->serialize($project->fresh(), $outsider), AuthorizationException::class, 'GET serializer menolak lintas institusi sebelum membaca data tim.');
failTeam(fn () => $accept->handle($peer, $join, 'Minat relevan.', teamRevision($join)), AuthorizationException::class, 'Anggota bukan pemilik tidak dapat memutuskan.');
failTeam(fn () => $accept->handle($outsider, $join, 'Minat relevan.', teamRevision($join)), AuthorizationException::class, 'Keputusan lintas tenant ditolak.');
failTeam(fn () => $accept->handle($owner, $join, ' ', teamRevision($join)), ValidationException::class, 'Penerimaan wajib alasan pada Action, bukan hanya UI.');
failTeam(fn () => $reject->handle($owner, $join, '', teamRevision($join)), ValidationException::class, 'Penolakan wajib alasan pada Action.');
$old = teamRevision($join);
$role->forceFill(['selection_criteria' => 'Kriteria berubah dalam detik yang sama.'])->save();
failTeam(fn () => $accept->handle($owner, $join, 'Minat relevan.', $old), HttpException::class, 'Perubahan kriteria presisi detik sama menghasilkan konflik.', 409);
expectTeam($join->fresh()->status === TeamJoinRequestStatus::Pending && TeamMembership::query()->whereBelongsTo($project)->count() === 0, 'Konflik tidak mengubah pengajuan atau membership.');
$old = teamRevision($join);
$project->forceFill(['deadline' => now()->subMinute()])->save();
failTeam(fn () => $accept->handle($owner, $join, 'Minat relevan.', $old), HttpException::class, 'Perubahan lifecycle/tenggat membatalkan snapshot keputusan.', 409);
failTeam(fn () => $accept->handle($owner, $join, 'Minat relevan.', teamRevision($join)), ValidationException::class, 'Snapshot terbaru tidak mengizinkan penerimaan setelah tenggat.');
$project->forceFill(['deadline' => now()->addWeek()])->save();
$snapshot = teamRevision($join);
$accepted = $accept->handle($owner, $join, 'Minat desain sesuai dan jadwal memungkinkan diskusi.', $snapshot);
expectTeam($accepted->status === TeamJoinRequestStatus::Accepted && $accepted->response_reason !== null && $accepted->pending_key === null, 'Keputusan penerimaan menyimpan alasan, waktu dan terminal state.');
expectTeam(Gate::forUser($student)->allows('viewAny', [Task::class, $project->fresh()]), 'Workspace terbuka hanya sesudah membership aktif yang sah.');
expectTeam(TeamMembership::query()->whereBelongsTo($project)->active()->count() === 1 && $project->fresh()->status === ProjectStatus::Forming, 'Membership dan kapasitas/lifecycle tersinkron dalam satu transaksi.');
expectTeam(TeamMembershipEvent::query()->count() === 1 && AuditLog::query()->where('operation', 'team.join_request.accepted')->count() === 1, 'Peristiwa membership dan audit keputusan dapat ditelusuri tanpa follower.');
expectTeam(Notification::sent($student, TeamJoinRequestRespondedNotification::class)->count() === 1, 'Pemohon menerima notifikasi keputusan satu kali.');
failTeam(fn () => $accept->handle($owner, $join, 'Duplikat.', $snapshot), HttpException::class, 'Keputusan ganda atau replay tidak menggandakan membership.', 409);
failTeam(fn () => $withdraw->handle($student, $join, TeamDecisionSnapshot::revision($join->fresh())), HttpException::class, 'Keputusan yang sudah diterima tidak dapat ditarik.', 409);
$history = $serializer->serialize($project->fresh(), $student)['request_history'];
expectTeam($history['data'][0]['response_reason'] === $accepted->response_reason, 'Pemohon dapat membaca alasan dan riwayat penerimaan.');
expectTeam($serializer->serialize($project->fresh(), $peer)['request_history']['data'] === [], 'Riwayat dan alasan pemohon tidak bocor kepada mahasiswa lain.');
$second = $requester->handle($peer, $project->fresh(), $role->getKey(), 'Minat: Belajar. Kemampuan: Dasar. Ketersediaan: Rabu.');
$rejected = $reject->handle($owner, $second, 'Jadwal diskusi peran belum sesuai. Pertimbangkan peran lain.', teamRevision($second));
expectTeam($rejected->status === TeamJoinRequestStatus::Rejected && $rejected->response_reason !== null && TeamMembership::query()->whereBelongsTo($project)->active()->count() === 1, 'Penolakan menyimpan alasan tanpa membuat anggota baru.');
$new = $requester->handle($peer, $project->fresh(), null, 'Minat diperbarui.');
expectTeam($new->getKey() !== $second->getKey() && $second->fresh()->response_reason === $rejected->response_reason, 'Pengajuan ulang membuat record baru dan mempertahankan keputusan lama.');
$withdrawSnapshot = TeamDecisionSnapshot::revision($new);
$project->forceFill(['status' => ProjectStatus::Closed])->save();
failTeam(fn () => $withdraw->handle($owner, $new, $withdrawSnapshot), AuthorizationException::class, 'Pemilik tidak dapat menarik pengajuan atas nama pemohon.');
expectTeam($withdraw->handle($peer, $new, $withdrawSnapshot)->status === TeamJoinRequestStatus::Withdrawn, 'Pemohon dapat menarik pending meski lifecycle ditutup, tanpa perubahan kapasitas.');
failTeam(fn () => $withdraw->handle($peer, $new, $withdrawSnapshot), HttpException::class, 'Penarikan ganda tidak menulis ulang riwayat.', 409);
$fullProject = $make(1, 1);
$p1 = $requester->handle($student, $fullProject);
$p2 = $requester->handle($peer, $fullProject);
$staleP2 = teamRevision($p2);
$accept->handle($owner, $p1, 'Kebutuhan sesuai.', teamRevision($p1));
failTeam(fn () => $accept->handle($owner, $p2, 'Kebutuhan sesuai.', $staleP2), HttpException::class, 'Dua keputusan pada tempat terakhir: keputusan kedua stale ditolak.', 409);
failTeam(fn () => $accept->handle($owner, $p2, 'Kebutuhan sesuai.', teamRevision($p2)), ValidationException::class, 'Kapasitas global tetap diperiksa meski snapshot diperbarui.');
expectTeam(TeamMembership::query()->whereBelongsTo($fullProject)->active()->count() === 1, 'Tempat terakhir tidak terisi dua anggota.');
$reject->handle($owner, $p2, 'Tempat tim telah penuh. Cari peran lain.', teamRevision($p2));
expectTeam($p2->fresh()->status === TeamJoinRequestStatus::Rejected, 'Pengajuan menunggu tetap dapat ditolak beralasan saat penuh.');
$roleProject = $make(3, 1);
$r1 = $requester->handle($student, $roleProject, $roleProject->roles[0]->getKey());
$r2 = $requester->handle($peer, $roleProject, $roleProject->roles[0]->getKey());
$accept->handle($owner, $r1, 'Kebutuhan sesuai.', teamRevision($r1));
failTeam(fn () => $accept->handle($owner, $r2, 'Kebutuhan sesuai.', teamRevision($r2)), ValidationException::class, 'Kapasitas peran diperiksa meski tim secara global belum penuh.');
$suspended = InstitutionMembership::query()->whereBelongsTo($peer)->whereBelongsTo($campus)->firstOrFail();
$suspended->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
failTeam(fn () => $accept->handle($owner, $r2, 'Kebutuhan sesuai.', teamRevision($r2)), AuthorizationException::class, 'Afiliasi pemohon diperiksa ulang saat menerima.');
$suspended->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
$rollbackProject = $make();
$rollback = $requester->handle($peer, $rollbackProject);
$eventCount = TeamMembershipEvent::query()->count();
$auditCount = AuditLog::query()->count();
$notificationCount = Notification::sent($peer, TeamJoinRequestRespondedNotification::class)->count();
$failAudit = true;
DB::listen(function ($query) use (&$failAudit): void {
    if ($failAudit && str_contains($query->sql, 'insert into "audit_logs"') && in_array('team.join_request.accepted', $query->bindings, true)) {
        throw new RuntimeException('Synthetic audit failure');
    }
});
failTeam(fn () => $accept->handle($owner, $rollback, 'Kebutuhan sesuai.', teamRevision($rollback)), RuntimeException::class, 'Kegagalan audit menggagalkan seluruh transaksi penerimaan.');
$failAudit = false;
expectTeam($rollback->fresh()->status === TeamJoinRequestStatus::Pending && TeamMembership::query()->whereBelongsTo($rollbackProject)->count() === 0 && $rollbackProject->fresh()->status === ProjectStatus::Open, 'Rollback menjaga status pengajuan, membership, serta kapasitas/lifecycle semula.');
expectTeam(TeamMembershipEvent::query()->count() === $eventCount && AuditLog::query()->count() === $auditCount && Notification::sent($peer, TeamJoinRequestRespondedNotification::class)->count() === $notificationCount, 'Rollback tidak meninggalkan event/audit parsial atau notifikasi keputusan.');
Auth::setUser($owner);
$decisionRequest = teamRequest(TeamDecisionRequest::class, 'team.join-requests.accept', $owner, $rollback);
expectTeam(! Validator::make([], $decisionRequest->rules())->passes(), 'Endpoint keputusan mewajibkan alasan dan revisi.');
expectTeam(! teamRequest(WithdrawTeamJoinRequestRequest::class, 'team.join-requests.withdraw', $owner, $rollback)->authorize(), 'Endpoint penarikan tidak mengizinkan pemilik.');
for ($index = 0; $index < 23; $index++) {
    TeamJoinRequest::factory()->create(['project_id' => $rollbackProject->getKey(), 'requester_id' => $peer->getKey(), 'status' => TeamJoinRequestStatus::Rejected, 'pending_key' => null, 'responded_at' => now(), 'response_reason' => null]);
}
DB::flushQueryLog();
DB::enableQueryLog();
$paginated = $serializer->serialize($rollbackProject->fresh(), $peer);
$reads = DB::getQueryLog();
DB::disableQueryLog();
expectTeam(count($paginated['request_history']['data']) === 20 && $paginated['request_history']['last_page'] === 2, 'Riwayat dipaginasi, bukan hilang setelah batas tampilan.');
expectTeam(collect($reads)->every(fn (array $entry): bool => str_starts_with(strtolower(ltrim($entry['query'])), 'select')), 'GET tim dan riwayat baca-saja, tidak membuat data default.');
$projection = json_encode($paginated, JSON_THROW_ON_ERROR);
expectTeam(! str_contains($projection, $peer->username) && ! str_contains($projection, 'evidence_metadata') && ! str_contains($projection, 'inclusion'), 'Allowlist tim tidak membawa username, bukti profil atau sinyal inklusi.');
$audit = AuditLog::query()->where('operation', 'team.join_request.accepted')->firstOrFail();
expectTeam(isset($audit->after_summary['selection_criteria']) && ! str_contains(json_encode($audit->after_summary, JSON_THROW_ON_ERROR), 'Ketersediaan'), 'Audit menyimpan kriteria keputusan, bukan jawaban privat pemohon.');
failTeam(fn () => $audit->forceFill(['reason' => 'Diubah'])->save(), LogicException::class, 'Riwayat audit append-only tidak dapat diubah.');

$both = $make();
$bothRequest = $requester->handle($student, $both);
$bothInvitation = TeamInvitation::factory()->create(['project_id' => $both->getKey(), 'invitee_id' => $student->getKey(), 'inviter_id' => $owner->getKey()]);
$app->make(AcceptTeamInvitation::class)->handle($student, $bothInvitation);
expectTeam($bothRequest->fresh()->status === TeamJoinRequestStatus::Expired && $bothRequest->fresh()->response_reason !== null, 'Penerimaan undangan menyelesaikan pengajuan pending lain dalam transaksi yang sama.');
expectTeam($serializer->serialize($both->fresh(), $student)['pending_join_request'] === null && TeamMembership::query()->whereBelongsTo($both)->active()->count() === 1, 'Anggota aktif tidak mendapat status masih menunggu atau membership ganda.');
$otherBoth = $make();
$otherRequest = $requester->handle($student, $otherBoth);
$otherInvitation = TeamInvitation::factory()->create(['project_id' => $otherBoth->getKey(), 'invitee_id' => $student->getKey(), 'inviter_id' => $owner->getKey()]);
$accept->handle($owner, $otherRequest, 'Kebutuhan sesuai.', teamRevision($otherRequest));
expectTeam($otherInvitation->fresh()->status->value === 'expired' && $serializer->serialize($otherBoth->fresh(), $student)['pending_invitations'] === [], 'Penerimaan pengajuan menyelesaikan undangan pending lain tanpa tawaran aktif tersisa.');
$sourceEvents = TeamMembershipEvent::query()->latest('id')->take(2)->get();
expectTeam($sourceEvents[0]->metadata['source_type'] === 'join_request' && $sourceEvents[1]->metadata['source_type'] === 'invitation', 'Event membedakan ID sumber invitation dan join request untuk evaluasi.');
$roleFullState = $serializer->serialize($roleProject->fresh(), $owner);
expectTeam($roleFullState['join_requests'][0]['can_accept'] === false, 'Projection tidak menawarkan penerimaan peran penuh seolah tersedia.');
$suspended->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
failTeam(fn () => $serializer->serialize($rollbackProject->fresh(), $peer), AuthorizationException::class, 'Afiliasi ditangguhkan tidak mendapat riwayat pribadi lewat GET.');
$suspended->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
$app->instance('request', Request::create('/projects/'.$rollbackProject->getKey(), 'GET', ['team_history_page' => 2]));
$pageTwo = $serializer->serialize($rollbackProject->fresh(), $peer)['request_history'];
expectTeam($pageTwo['current_page'] === 2 && count($pageTwo['data']) === 3, 'Halaman kedua riwayat dapat dibaca tanpa mutasi atau kehilangan record.');
$app->instance('request', Request::create('/'));
$proofProject = $make();
$proofRequest = $requester->handle($student, $proofProject);
\App\Models\StudentProfile::factory()->create(['user_id' => $student->id, 'institution_id' => $campus->id, 'portfolio_visibility' => 'public']);
$makeProof = function (string $visibility, ?Institution $sourceCampus = null) use ($student, $campus, $proofProject): PortfolioEntry {
    $source = Contribution::factory()->approved()->create(['owner_id' => $student->getKey(), 'institution_id' => ($sourceCampus ?? $campus)->getKey(), 'project_id' => $proofProject->getKey()]);

    $entry = PortfolioEntry::factory()->create(['contribution_id' => $source->getKey(), 'institution_id' => $campus->getKey(), 'user_id' => $student->getKey(), 'visibility' => $visibility, 'title' => 'Karya '.$visibility.'. Data sintetis']);
    \App\Models\ContributionReview::factory()->approved()->create(['contribution_version_id' => $entry->contribution_version_id]);
    return $entry;
};
$institutionProof = $makeProof('institution');
$publicProof = $makeProof('public');
$makeProof('private');
$makeProof('recruiter');
$withdrawnProof = $makeProof('public');
$withdrawnProof->forceFill(['withdrawn_at' => now()])->save();
$staleProof = $makeProof('public');
$staleProof->contribution->forceFill(['status' => 'revision'])->save();
$makeProof('public', $otherCampus);
$ownerProofs = $serializer->serialize($proofProject->fresh(), $owner)['join_requests'][0]['shared_work'];
expectTeam(array_column($ownerProofs, 'id') === [$publicProof->getKey()], 'Pemilik hanya membaca karya dan profil publik yang approved aktual, bukan jangkauan lama, privat, ditarik, stale atau sumber lintas tenant.');
expectTeam(! Gate::forUser($owner)->allows('view', $institutionProof) && Gate::forUser($owner)->allows('view', $publicProof), 'Tautan karya tidak membuka jangkauan kampus lama.');
expectTeam(array_keys($ownerProofs[0]) === ['id', 'title', 'summary', 'verification_label'], 'Ringkasan karya allowlist tanpa bukti, catatan reviewer, source ID atau kontak.');
$institutionProof->forceFill(['visibility' => 'private'])->save();
$publicProof->forceFill(['visibility' => 'private'])->save();
expectTeam($serializer->serialize($proofProject->fresh(), $owner)['join_requests'][0]['shared_work'] === [], 'Pencabutan visibility menghentikan exposure pada pembacaan berikutnya.');
for ($index = 0; $index < 4; $index++) {
    $makeProof('public');
}
expectTeam(count($serializer->serialize($proofProject->fresh(), $owner)['join_requests'][0]['shared_work']) === 3, 'Jumlah karya dibatasi tiga per pemohon, bukan seluruh bukti.');
$peerProofRequest = $requester->handle($peer, $proofProject);
$peerSource = Contribution::factory()->approved()->create(['owner_id' => $peer->getKey(), 'institution_id' => $campus->getKey(), 'project_id' => $proofProject->getKey()]);
\App\Models\StudentProfile::factory()->create(['user_id' => $peer->id, 'institution_id' => $campus->id, 'portfolio_visibility' => 'public']);
$peerEntry = PortfolioEntry::factory()->create(['contribution_id' => $peerSource->getKey(), 'visibility' => 'public']);
\App\Models\ContributionReview::factory()->approved()->create(['contribution_version_id' => $peerEntry->contribution_version_id]);
$ownerTwo = $serializer->serialize($proofProject->fresh(), $owner)['join_requests'];
expectTeam(count($ownerTwo[0]['shared_work']) === 1 && count($ownerTwo[1]['shared_work']) === 3, 'Eager limit diterapkan per pemohon, tidak membuat pemohon lain kehilangan karya.');
DB::flushQueryLog();
DB::enableQueryLog();
$serializer->serialize($proofProject->fresh(), $student);
$studentReads = DB::getQueryLog();
DB::disableQueryLog();
expectTeam(collect($studentReads)->every(fn (array $entry): bool => ! str_contains($entry['query'], 'portfolio_entries') && ! str_contains($entry['query'], 'profile_skills')), 'Pembaca bukan pemilik tidak mengquery karya pelamar atau bukti profil.');
$privateProject = $make();
$privateProject->forceFill(['visibility' => 'private'])->save();
$privateInvite = TeamInvitation::factory()->create(['project_id' => $privateProject->getKey(), 'invitee_id' => $student->getKey(), 'inviter_id' => $owner->getKey(), 'expires_at' => now()->addDay()]);
expectTeam(Gate::forUser($student)->allows('view', $privateProject->fresh()) && ! Gate::forUser($student)->allows('viewAny', [Task::class, $privateProject->fresh()]), 'Undangan privat memberi preview detail, bukan akses workspace sebelum bergabung.');
expectTeam(count($serializer->serialize($privateProject->fresh(), $student)['pending_invitations']) === 1, 'Penerima dapat membaca peran undangan privat sebelum mengambil keputusan.');
expectTeam(! Gate::forUser($peer)->allows('view', $privateProject->fresh()), 'Preview undangan privat tidak dibuka kepada mahasiswa lain.');
$privateInvite->forceFill(['expires_at' => now()->subMinute()])->save();
expectTeam(! Gate::forUser($student)->allows('view', $privateProject->fresh()), 'Undangan kedaluwarsa tidak memberi preview proyek privat.');
$privateInvite->forceFill(['expires_at' => now()->addDay(), 'status' => 'revoked', 'pending_key' => null])->save();
expectTeam(! Gate::forUser($student)->allows('view', $privateProject->fresh()), 'Undangan dicabut tidak memberi preview proyek privat.');
$privateInvite->forceFill(['status' => 'pending', 'pending_key' => 'pending'])->save();
$app->make(AcceptTeamInvitation::class)->handle($student, $privateInvite->fresh());
expectTeam(Gate::forUser($student)->allows('viewAny', [Task::class, $privateProject->fresh()]), 'Penerimaan undangan privat membuka workspace setelah membership sah terbentuk.');
Notification::swap($realNotifications);
config()->set('queue.default', 'database');
config()->set('queue.connections.database.connection', 'team_check');
$notifyProject = $make();
$notifyRequest = $requester->handle($student, $notifyProject);
expectTeam(DB::table('jobs')->count() === 1, 'Notifikasi aplikasi nyata masuk antrean database setelah pengajuan commit.');
DB::table('jobs')->delete();
DB::beginTransaction();
$reject->handle($owner, $notifyRequest, 'Jadwal belum sesuai.', teamRevision($notifyRequest));
expectTeam(DB::table('jobs')->count() === 0, 'Notifikasi keputusan tidak diantrekan sebelum transaksi luar commit.');
DB::rollBack();
expectTeam(DB::table('jobs')->count() === 0 && $notifyRequest->fresh()->status === TeamJoinRequestStatus::Pending, 'Rollback transaksi luar membatalkan status serta delivery notifikasi.');
DB::beginTransaction();
$reject->handle($owner, $notifyRequest->fresh(), 'Jadwal belum sesuai.', teamRevision($notifyRequest));
DB::commit();
expectTeam(DB::table('jobs')->count() === 1, 'Commit keputusan hanya mengantrekan satu delivery database.');
$notification = new TeamJoinRequestRespondedNotification($notifyRequest->fresh(), $owner, 'rejected');
$safeNotification = $notification->toArray($student);
expectTeam(! array_key_exists('response_reason', $safeNotification) && ! array_key_exists('message_content', $safeNotification) && $safeNotification['action_label'] === 'Baca keputusan', 'Payload notifikasi tidak menyalin alasan sensitif; tautan menuju sumber berizin.');
Http::preventStrayRequests();
Artisan::call('queue:work', ['connection' => 'database', '--once' => true, '--stop-when-empty' => true, '--tries' => 1]);
expectTeam(DB::table('notifications')->where('notifiable_id', $student->getKey())->count() === 1 && DB::table('jobs')->count() === 0, 'Worker memproses job menjadi notifikasi canonical tersimpan, tanpa panggilan eksternal.');
echo 'PASS '.$checks.' team formation checks. SQLite memory only; no application records created.'.PHP_EOL;
