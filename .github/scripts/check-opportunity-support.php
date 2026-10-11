<?php

declare(strict_types=1);

use App\Actions\Audit\AuditRecorder;
use App\Actions\Campus\OpportunityJourneySummary;
use App\Actions\Consent\ConsentRecorder;
use App\Actions\OpportunitySupport\ManageOpportunitySupport;
use App\Actions\OpportunitySupport\OpportunitySupportQuery;
use App\Actions\Project\ProjectRequirements;
use App\Enums\InstitutionMembershipStatus;
use App\Models\AuditLog;
use App\Models\ConsentRecord;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\OpportunitySupportEvent;
use App\Models\OpportunitySupportRequest;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Task;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use Database\Seeders\OpportunitySupportSeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

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
config()->set('database.default', 'support_check');
config()->set('database.connections.support_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
if (DB::connection()->getName() !== 'support_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian hanya boleh memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-11 09:00:00');
$checks = 0;
function expectSupport(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function deniesSupport(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectSupport($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}
$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data synthetic']);
$other = Institution::factory()->active()->create(['name' => 'Kampus B. Data synthetic']);
$student = User::factory()->create(['name' => 'Mahasiswa baru. Data synthetic']);
$owner = User::factory()->create();
$peer = User::factory()->create();
$admin = User::factory()->create();
$unassigned = User::factory()->create();
$foreignAdmin = User::factory()->create();
foreach ([$student, $owner, $peer] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->id, 'institution_id' => $campus->id]);
}
foreach ([[$admin, $campus], [$unassigned, $campus], [$foreignAdmin, $other]] as [$user, $institution]) {
    InstitutionMembership::factory()->campusAdmin()->verifiedByRosterExactMatch()->create(['user_id' => $user->id, 'institution_id' => $institution->id]);
}
Http::preventStrayRequests();
Notification::fake();
Event::fake();
$governance = app(OpportunitySupportGovernance::class);
$manage = app(ManageOpportunitySupport::class);
$query = app(OpportunitySupportQuery::class);
$summary = app(OpportunityJourneySummary::class);
$payload = ['command_key' => (string) Str::uuid(), 'need' => 'beginner_path', 'explanation' => 'Saya ingin belajar desain.', 'consent' => true, 'notice_version' => 'support-v1'];
expectSupport(! $governance->enabled($campus), 'Gate bantuan default tertutup.');
deniesSupport(fn () => $manage->create($student, $campus, $payload), AuthorizationException::class, 'Gate tertutup menolak mutasi.');
expectSupport($query->page($student, $campus, false)['data'] === [], 'GET kosong tidak membuat default.');
$settings = ['purpose' => 'Membantu menemukan peran sesuai kebutuhan yang dipilih.', 'notice_version' => 'support-v1', 'approval_reference' => 'SYNTHETIC-TEST-ONLY', 'dataset_kind' => 'synthetic', 'dataset_manifest' => 'sqlite-memory-support-fixture', 'access_days' => 7, 'reviewer_ids' => [$admin->id]];
config()->set('opportunity_support.enabled', true);
config()->set('opportunity_support.institutions.'.$campus->id, $settings);
expectSupport($governance->enabled($campus), 'Fixture synthetic hanya aktif pada testing SQLite memori.');
config()->set('opportunity_support.institutions.'.$campus->id.'.reviewer_ids', 'invalid');
expectSupport(! $governance->enabled($campus) && ! Gate::forUser($admin)->allows('reviewAny', [OpportunitySupportRequest::class, $campus]), 'Konfigurasi peninjau invalid gagal tertutup, bukan error server.');
config()->set('opportunity_support.institutions.'.$campus->id, $settings);
deniesSupport(fn () => $manage->create($student, $campus, array_replace($payload, ['consent' => false])), ValidationException::class, 'Permintaan memerlukan consent eksplisit.');
deniesSupport(fn () => $manage->create($student, $campus, array_replace($payload, ['notice_version' => 'old'])), ConflictHttpException::class, 'Notice berubah tidak diluluskan diam-diam.');
deniesSupport(fn () => $manage->create($student, $campus, array_replace($payload, ['need' => 'personality'])), ValidationException::class, 'Kategori di luar kebutuhan yang diizinkan ditolak.');
$request = $manage->create($student, $campus, array_replace($payload, ['owner_id' => $peer->id, 'institution_id' => $other->id]));
expectSupport($request->owner_id === $student->id && $request->institution_id === $campus->id, 'ID pemilik dan tenant kiriman tidak mengubah ownership.');
expectSupport($request->status === 'requested' && OpportunitySupportEvent::count() === 1 && ConsentRecord::count() === 1, 'Pengajuan tanpa karya atau XP menyimpan consent dan event atomik.');
expectSupport($manage->create($student, $campus, $payload)->id === $request->id && OpportunitySupportEvent::count() === 1, 'Command key identik idempoten.');
expectSupport($manage->create($student, $campus, array_replace($payload, ['command_key' => strtoupper($payload['command_key'])]))->id === $request->id, 'UUID dinormalisasi agar huruf besar tidak menggandakan permintaan atau membuat consent invalid.');
deniesSupport(fn () => $manage->create($student, $campus, array_replace($payload, ['explanation' => 'Isi berbeda'])), ConflictHttpException::class, 'Command key tidak bisa dipakai untuk isi berbeda.');
expectSupport(Gate::forUser($admin)->allows('view', $request) && ! Gate::forUser($unassigned)->allows('view', $request), 'Hanya peninjau yang ditunjuk membaca berkas kampus.');
expectSupport(! Gate::forUser($foreignAdmin)->allows('view', $request) && ! Gate::forUser($peer)->allows('view', $request), 'Tenant lain dan rekan tidak membaca kebutuhan privat.');
$serialized = $query->serialize($admin, $request);
expectSupport(! str_contains(json_encode($serialized), $student->username) && ! array_key_exists('actor_id', $serialized['events'][0]), 'Proyeksi tidak memuat username, kontak atau ID peninjau.');
$project = Project::factory()->open()->create(['institution_id' => $campus->id, 'owner_id' => $owner->id, 'capacity' => 4, 'deadline' => now()->addDays(4)]);
$role = ProjectRole::factory()->create(['project_id' => $project->id, 'capacity' => 2, 'accepts_beginners' => true]);
$foreignProject = Project::factory()->open()->create(['institution_id' => $other->id, 'deadline' => now()->addDays(4)]);
$foreignRole = ProjectRole::factory()->create(['project_id' => $foreignProject->id]);
$command = fn (string $action, array $extra = []) => array_replace(['action' => $action, 'expected_revision' => $request->fresh()->revision], $extra);
$role->forceFill(['accepts_beginners' => null])->save();
deniesSupport(fn () => $manage->transition($admin, $request, $command('offer', ['project_role_id' => $role->id, 'reason' => 'Belum menyatakan menerima pemula.'])), ValidationException::class, 'Kebutuhan pemula memerlukan peran yang eksplisit menerima pemula.');
$role->forceFill(['accepts_beginners' => true])->save();
deniesSupport(fn () => $manage->transition($admin, $request, $command('offer', ['project_role_id' => $role->id])), ValidationException::class, 'Tawaran memerlukan alasan manusia.');
deniesSupport(fn () => $manage->transition($admin, $request, $command('offer', ['project_role_id' => $foreignRole->id, 'reason' => 'Bukan kampus ini.'])), ValidationException::class, 'Tawaran lintas tenant ditolak.');
deniesSupport(fn () => $manage->transition($peer, $request, $command('offer', ['project_role_id' => $role->id, 'reason' => 'Tidak berwenang.'])), AuthorizationException::class, 'Action tetap memeriksa kewenangan peninjau.');
$request = $manage->transition($admin, $request, $command('offer', ['project_role_id' => $role->id, 'reason' => 'Peran menerima pemula dengan minat desain.']));
expectSupport($request->status === 'offered' && $request->revision === 2, 'Tawaran menyimpan peran aktual dan revisi.');
deniesSupport(fn () => app(ProjectRequirements::class)->persist($project, []), ValidationException::class, 'Peran dengan riwayat tawaran tidak dihapus dan tidak menjadi error FK.');
expectSupport($query->page($admin, $campus, true)['total'] === 1 && count($query->opportunities($admin, $campus)) === 1, 'Antrean dan pilihan berasal dari peluang kampus yang tersedia.');
deniesSupport(fn () => $manage->transition($student, $request, ['action' => 'accept', 'expected_revision' => 1]), ConflictHttpException::class, 'Keputusan stale ditolak, termasuk dalam detik yang sama.');
TeamMembership::factory()->create(['project_id' => $project->id, 'project_role_id' => $role->id, 'user_id' => $owner->id]);
TeamMembership::factory()->create(['project_id' => $project->id, 'project_role_id' => $role->id, 'user_id' => $peer->id]);
deniesSupport(fn () => $manage->transition($student, $request, $command('accept')), ValidationException::class, 'Penerimaan memeriksa kapasitas terbaru tanpa memesan tempat.');
$request = $manage->transition($student, $request, $command('decline'));
expectSupport($request->status === 'declined', 'Mahasiswa bebas menolak tanpa alasan.');
TeamMembership::query()->where('user_id', $peer->id)->delete();
$request = $manage->transition($admin, $request, $command('offer', ['project_role_id' => $role->id, 'reason' => 'Kapasitas tersedia kembali.']));
$before = TeamMembership::count();
$request = $manage->transition($student, $request, $command('accept'));
expectSupport($request->status === 'accepted' && TeamMembership::count() === $before && TeamJoinRequest::count() === 0, 'Menerima tawaran tidak bergabung atau mengajukan otomatis.');
$request = $manage->transition($admin, $request, $command('note', ['reason' => 'Menjelaskan cara mengajukan, belum ada hasil yang diketahui.']));
expectSupport($request->status === 'accepted' && $request->events()->where('action', 'note')->count() === 1, 'Catatan manusia bukan status achieved.');
expectSupport($summary->handle($admin, $campus)['state'] === 'not_configured', 'Evaluasi membutuhkan approval dan minimum khusus.');
config()->set('opportunity_support.institutions.'.$campus->id.'.evaluation_approval', 'SYNTHETIC-EVALUATION');
config()->set('opportunity_support.institutions.'.$campus->id.'.minimum_cohort', 2);
$snapshot = $summary->handle($admin, $campus);
expectSupport($snapshot['denominator'] === 3 && $snapshot['metrics'][5]['value'] === 0, 'Denominator menyertakan mahasiswa baru tanpa karya atau XP.');
expectSupport($snapshot['metrics'][7]['value'] === null && $snapshot['metrics'][6]['value'] === null, 'Data hubungan kerja dan view tidak tersedia, bukan nol.');
$membership = TeamMembership::query()->where('user_id', $owner->id)->firstOrFail();
TeamMembershipEvent::query()->forceCreate(['team_membership_id' => $membership->id, 'actor_id' => $admin->id, 'event' => 'joined', 'created_at' => now()]);
$membership->forceFill(['joined_at' => now()->subYears(2)])->save();
expectSupport($summary->handle($admin, $campus)['metrics'][3]['state'] === 'suppressed', 'Event bergabung tercatat, tetapi sel kecil disembunyikan.');
$task = Task::factory()->create(['project_id' => $project->id]);
$contribution = Contribution::factory()->create(['institution_id' => $campus->id, 'project_id' => $project->id, 'owner_id' => $owner->id]);
$version = ContributionVersion::factory()->forContribution($contribution)->create(['task_id' => $task->id, 'created_by_id' => $owner->id]);
$contribution->forceFill(['status' => 'approved', 'current_version_id' => $version->id])->save();
$entry = PortfolioEntry::factory()->create(['institution_id' => $campus->id, 'user_id' => $owner->id, 'contribution_id' => $contribution->id, 'contribution_version_id' => $version->id]);
expectSupport($summary->handle($admin, $campus)['metrics'][5]['value'] === 0, 'Entry tanpa keputusan approved tidak dihitung sebagai pengakuan.');
ContributionReview::factory()->create(['contribution_version_id' => $version->id, 'reviewer_id' => $admin->id, 'decision' => 'approved']);
app(AuditRecorder::class)->record(operation: 'contribution.submitted', auditable: $contribution, actor: $owner, institution: $campus);
$snapshot = $summary->handle($admin, $campus);
expectSupport($snapshot['metrics'][4]['state'] === 'suppressed' && $snapshot['metrics'][5]['state'] === 'suppressed', 'Pengiriman dan pengakuan sah tersedia secara internal; sel kecil tidak diekspos.');
$entry->forceFill(['user_id' => $peer->id])->save();
expectSupport($summary->handle($admin, $campus)['metrics'][5]['value'] === 0, 'Pengakuan pemilik tidak konsisten dikeluarkan.');
config()->set('opportunity_support.institutions.'.$campus->id.'.minimum_cohort', 4);
$snapshot = $summary->handle($admin, $campus);
expectSupport($snapshot['state'] === 'suppressed' && $snapshot['denominator'] === null && $snapshot['metrics'] === [], 'Kelompok kecil menyembunyikan angka dan denominator.');
deniesSupport(fn () => $summary->handle($student, $campus), AuthorizationException::class, 'Mahasiswa tidak membaca agregat restricted.');
$counts = [OpportunitySupportRequest::count(), OpportunitySupportEvent::count(), ConsentRecord::count(), AuditLog::count()];
$audit = AuditLog::query()->where('operation', 'opportunity.support.note')->firstOrFail();
expectSupport(! str_contains(json_encode($audit->after_summary), 'Menjelaskan cara') && $audit->reason === null, 'Audit tidak menggandakan kebutuhan atau catatan privat.');
DB::enableQueryLog();
$query->page($student, $campus, false);
$query->page($admin, $campus, true);
$summary->handle($admin, $campus);
$writes = array_filter(DB::getQueryLog(), fn (array $row) => preg_match('/^\s*(insert|update|delete)/i', $row['query']) === 1);
DB::disableQueryLog();
expectSupport($writes === [] && $counts === [OpportunitySupportRequest::count(), OpportunitySupportEvent::count(), ConsentRecord::count(), AuditLog::count()], 'Seluruh pembacaan read-only.');
$request = $manage->transition($student, $request, $command('withdraw'));
expectSupport($request->status === 'withdrawn' && ! Gate::forUser($admin)->allows('view', $request), 'Pencabutan langsung menolak pembacaan kampus berikutnya.');
expectSupport($query->page($admin, $campus, true)['total'] === 0 && $query->page($student, $campus, false)['total'] === 1, 'Antrean hilang setelah pencabutan; riwayat pemilik tetap tersedia.');
expectSupport(! app(ConsentRecorder::class)->current($student, $request->consentPurpose())->isGrant(), 'Withdrawal menjadi event consent baru.');
$event = $request->events()->firstOrFail();
deniesSupport(fn () => $event->forceFill(['reason' => 'Ubah sejarah'])->save(), LogicException::class, 'Riwayat tidak dapat ditimpa.');
deniesSupport(fn () => $event->delete(), LogicException::class, 'Riwayat tidak dapat dihapus melalui model.');
$new = $manage->create($student, $campus, array_replace($payload, ['command_key' => (string) Str::uuid()]));
Carbon::setTestNow(now()->addDays(8));
expectSupport(! Gate::forUser($admin)->allows('view', $new) && $query->page($admin, $campus, true)['total'] === 0, 'Expiry menutup exposure kampus.');
config()->set('opportunity_support.enabled', false);
InstitutionMembership::query()->where('user_id', $student->id)->update(['status' => InstitutionMembershipStatus::Suspended->value]);
expectSupport(Gate::forUser($student)->allows('viewAny', [OpportunitySupportRequest::class, $campus]), 'Mahasiswa ditangguhkan tetap dapat membuka riwayat untuk pencabutan.');
$new = $manage->transition($student, $new, ['action' => 'withdraw', 'expected_revision' => $new->revision]);
expectSupport($new->status === 'withdrawn', 'Withdrawal tetap tersedia saat gate mati, expiry dan afiliasi ditangguhkan.');
config()->set('opportunity_support.enabled', true);
config()->set('opportunity_support.institutions.'.$campus->id.'.dataset_kind', 'real');
expectSupport(! $governance->enabled($campus), 'Dataset real tidak aktif tanpa persetujuan khusus.');
config()->set('opportunity_support.institutions.'.$campus->id, $settings);
InstitutionMembership::query()->where('user_id', $student->id)->update(['status' => 'verified']);
Carbon::setTestNow('2026-10-11 09:00:00');
$count = OpportunitySupportRequest::count();
DB::beginTransaction();
$manage->create($student, $campus, array_replace($payload, ['command_key' => (string) Str::uuid()]));
DB::rollBack();
expectSupport(OpportunitySupportRequest::count() === $count, 'Rollback tidak menyisakan permintaan, consent atau event baru.');
expectSupport(Notification::getFacadeRoot()->sentNotifications() === [] && Http::recorded()->isEmpty(), 'Tidak ada auto-contact atau notifikasi eksternal.');
$another = $manage->create($student, $campus, array_replace($payload, ['command_key' => (string) Str::uuid()]));
config()->set('opportunity_support.institutions.'.$campus->id.'.dataset_manifest', 'manifest-berbeda');
expectSupport(! Gate::forUser($admin)->allows('view', $another) && $query->page($admin, $campus, true)['total'] === 0, 'Manifest berubah tidak mencampur dataset lama dengan dataset baru.');
config()->set('opportunity_support.institutions.'.$campus->id, $settings);
config()->set('opportunity_support.institutions.'.$campus->id.'.notice_version', 'support-v2');
expectSupport(! Gate::forUser($admin)->allows('view', $another), 'Notice baru tidak memakai izin versi lama.');
config()->set('opportunity_support.institutions.'.$campus->id, $settings);
app(ConsentRecorder::class)->withdraw($student, $another->consentPurpose(), 'support-v1', 'opportunity.support');
expectSupport(! Gate::forUser($admin)->allows('view', $another) && $query->page($admin, $campus, true)['total'] === 0, 'Withdrawal consent di luar command juga menutup antrean.');
$requestHttp = Request::create('/institutions/'.$other->id.'/opportunity-support/'.$another->id.'/transition', 'POST');
$boundRoute = app('router')->getRoutes()->match($requestHttp);
$boundRoute->bind($requestHttp);
$requestHttp->setRouteResolver(fn () => $boundRoute);
deniesSupport(function () use ($boundRoute): void {
    app('router')->substituteBindings($boundRoute);
    app('router')->substituteImplicitBindings($boundRoute);
}, ModelNotFoundException::class, 'Scoped binding menolak berkas dari institusi berbeda.');
$forged = $another->fresh();
$forged->owner_id = $peer->id;
expectSupport(! Gate::forUser($peer)->allows('view', $forged), 'Dirty ownership tidak dapat memalsukan izin pemilik.');
config()->set('opportunity_support.institutions.'.$campus->id.'.evaluation_approval', 'SYNTHETIC-EVALUATION');
config()->set('opportunity_support.institutions.'.$campus->id.'.minimum_cohort', 2);
DB::beginTransaction();
InstitutionMembership::query()->where('role', 'student')->update(['status' => 'suspended']);
expectSupport($summary->handle($admin, $campus)['state'] === 'suppressed', 'Denominator kosong tidak menjadi persentase nol.');
DB::rollBack();

$newcomer = User::factory()->create();
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $newcomer->id, 'institution_id' => $campus->id]);
$studentMember = TeamMembership::factory()->create(['project_id' => $project->id, 'user_id' => $student->id]);
TeamMembershipEvent::query()->forceCreate(['team_membership_id' => $studentMember->id, 'actor_id' => $admin->id, 'event' => 'joined', 'created_at' => now()]);
TeamMembershipEvent::query()->forceCreate(['team_membership_id' => $membership->id, 'actor_id' => $admin->id, 'event' => 'rejoined', 'created_at' => now()]);
$snapshot = $summary->handle($admin, $campus);
expectSupport($snapshot['denominator'] === 4 && $snapshot['metrics'][3]['value'] === 2, 'Populasi snapshot mengikuti mahasiswa baru, dan beberapa event satu pemilik tetap dihitung satu pengguna.');
expectSupport($snapshot['metrics'][7]['value'] === null, 'Dua mahasiswa masuk tim tetap tidak diklaim sebagai hubungan kerja baru.');
$peerMember = TeamMembership::factory()->create(['project_id' => $project->id, 'user_id' => $peer->id]);
TeamMembershipEvent::query()->forceCreate(['team_membership_id' => $peerMember->id, 'actor_id' => $admin->id, 'event' => 'joined', 'created_at' => now()]);
expectSupport($summary->handle($admin, $campus)['metrics'][3]['state'] === 'suppressed', 'Sel komplemen kecil juga disembunyikan untuk mencegah pengenalan individu.');
$historyCount = OpportunitySupportEvent::count();
$peerRequest = $manage->create($peer, $campus, $payload);
expectSupport($peerRequest->id !== $request->id && $peerRequest->consentPurpose() !== $request->consentPurpose(), 'Command key yang sama pada pemilik berbeda tidak bertabrakan atau berbagi consent.');
$historyCount = OpportunitySupportEvent::count();
(require $app->databasePath('migrations/2026_10_11_113123_create_opportunity_support_events_table.php'))->up();
expectSupport(OpportunitySupportEvent::count() === $historyCount, 'Migration berjalan ulang tanpa menghapus riwayat.');

$fixtureSeeder = new OpportunitySupportSeeder;
deniesSupport(fn () => $app->call([$fixtureSeeder, 'run']), LogicException::class, 'Seeder tidak memilih institusi atau pemilik secara diam-diam.');
config()->set('opportunity_support.fixture', ['institution_id' => $campus->id, 'owner_id' => $student->id]);
$beforeSeed = OpportunitySupportRequest::count();
$app->call([$fixtureSeeder, 'run']);
$app->call([$fixtureSeeder, 'run']);
expectSupport(OpportunitySupportRequest::count() === $beforeSeed + 1, 'Seeder synthetic terisolasi idempoten dan tidak membuka gate.');
$made = OpportunitySupportRequest::factory()->make(['institution_id' => $campus->id, 'owner_id' => $student->id]);
expectSupport(! $made->exists && $made->dataset_kind === 'synthetic' && ! Gate::forUser($admin)->allows('view', $made), 'Factory tanpa consent tidak membuka exposure kampus.');
$noteRequest = $manage->transition($admin, $peerRequest, ['action' => 'note', 'expected_revision' => $peerRequest->revision, 'reason' => 'Membaca kebutuhan, peluang masih dicari.']);
expectSupport($noteRequest->status === 'requested', 'Catatan awal dapat disimpan tanpa tawaran dan tanpa klaim berhasil.');

echo 'Selesai: '.$checks.' pemeriksaan T09 lulus pada database synthetic di memori.'.PHP_EOL;
