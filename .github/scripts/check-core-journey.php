<?php

declare(strict_types=1);

use App\Actions\Affiliations\AcquireAffiliationReviewLock;
use App\Actions\Affiliations\ReviewAffiliationRequest;
use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Attachment\UploadAttachment;
use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Actions\Institution\ApproveInstitution;
use App\Actions\Matching\CreateMatchScoreVersion;
use App\Actions\Matching\RebuildCandidateRecommendations;
use App\Actions\Matching\RequestMatchingRefresh;
use App\Actions\OpportunitySupport\ManageOpportunitySupport;
use App\Actions\Portfolio\BuildPublicPortfolioProjection;
use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Actions\Profile\CreateStudentProfile;
use App\Actions\Profile\UpdateStudentProfileVisibility;
use App\Actions\Project\CreateProject;
use App\Actions\Project\OpenProject;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Actions\Roster\ImportRoster;
use App\Actions\Task\AssignTask;
use App\Actions\Task\CreateTask;
use App\Actions\Task\TransitionTaskStatus;
use App\Actions\Team\AcceptTeamJoinRequest;
use App\Actions\Team\RequestToJoinTeam;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Enums\AttachmentPurpose;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionStatus;
use App\Enums\TaskStatus;
use App\Events\ContributionApproved;
use App\Events\InstitutionMembershipRequested;
use App\Events\InstitutionMembershipReviewed;
use App\Events\MatchingInputsChanged;
use App\Events\WorkspaceTaskChanged;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\OpportunitySupportRequest;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\SkillTaxonomy;
use App\Models\Task;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Contribution\ContributionSnapshot;
use App\Support\Matching\MatchingAvailability;
use App\Support\Notification\FonnteGateway;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Task\TaskSnapshot;
use App\Support\Team\TeamDecisionSnapshot;
use Database\Seeders\CoreJourneyDemoSeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Psr\Log\NullLogger;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
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
config()->set('database.default', 'core_journey_check');
config()->set('database.connections.core_journey_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('broadcasting.default', 'null');
config()->set('queue.default', 'database');
config()->set('queue.connections.database.connection', 'core_journey_check');
config()->set('queue.failed.driver', 'null');
config()->set('matching.enabled', false);
config()->set('demo.core_journey_manifest', CoreJourneyDemoSeeder::DATASET);
config()->set('filesystems.disks.private', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-t10-'.Str::uuid(), 'throw' => true]);
Storage::forgetDisk('private');
config()->set('filesystems.disks.local', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-t10-roster-'.Str::uuid(), 'throw' => true]);
Storage::forgetDisk('local');
Log::swap(new NullLogger);
Http::preventStrayRequests();
Carbon::setTestNow('2026-10-11 10:00:00');
$checks = 0;
function expectJourney(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function rejectsJourney(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectJourney($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}
function journeyUser(string $role): User
{
    return User::query()->where('username', 'demo_t10_'.$role)->firstOrFail();
}
function journeyRevision(TeamJoinRequest $request): string
{
    return TeamDecisionSnapshot::revision($request->fresh(), TeamDecisionSnapshot::context($request->project->fresh()));
}

for ($round = 1; $round <= 2; $round++) {
    $pdo = new PDO('sqlite::memory:');
    DB::connection()->setPdo($pdo)->setReadPdo($pdo);
    DB::statement('PRAGMA foreign_keys = ON');
    if (! app()->environment('testing') || DB::connection()->getConfig('database') !== ':memory:' || DB::connection()->getName() !== 'core_journey_check') {
        throw new RuntimeException('Tidak boleh menjalankan/reset skenario di database aplikasi.');
    }
    foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
        (require $migration)->up();
    }
    Event::fake([MatchingInputsChanged::class, WorkspaceTaskChanged::class, ContributionApproved::class, InstitutionMembershipRequested::class, InstitutionMembershipReviewed::class]);
    app(CoreJourneyDemoSeeder::class)->run();
    rejectsJourney(fn () => app(CoreJourneyDemoSeeder::class)->run(), RuntimeException::class, "Putaran {$round}: seed ulang menolak database berisi data, tanpa penghapusan.");
    $campus = Institution::query()->where('slug', 'universitas-teknologi-yogyakarta')->firstOrFail();
    $other = Institution::query()->whereKeyNot($campus->getKey())->firstOrFail();
    $platform = journeyUser('platform');
    $reviewer = journeyUser('reviewer');
    $secondReviewer = journeyUser('second_reviewer');
    $owner = journeyUser('owner');
    $student = journeyUser('student');
    $peer = journeyUser('peer');
    $outsider = journeyUser('outsider');
    expectJourney($reviewer->isUniversityAdmin() && $secondReviewer->isUniversityAdmin()
        && InstitutionMembership::query()->where('institution_id', $campus->id)->where('role', 'campus_admin')->count() === 2,
        'Dataset terisolasi menyediakan dua Admin Universitas UTY tanpa memberi akses institusi lain.');
    expectJourney(Project::count() === 0 && Task::count() === 0 && Contribution::count() === 0 && PortfolioEntry::count() === 0, "Putaran {$round}: dataset awal tidak menanam hasil perjalanan.");
    rejectsJourney(fn () => app(ApproveInstitution::class)->handle($student, $campus, 'Contoh'), AuthorizationException::class, 'Mahasiswa tidak menyetujui institusi.');
    rejectsJourney(fn () => app(ApproveInstitution::class)->handle($platform, $campus, 'Uji flag platform lama.'), AuthorizationException::class, 'Flag platform lama tidak mengaktifkan atau menyetujui institusi.');
    expectJourney($campus->fresh()->status === InstitutionStatus::Active && ! AuditLog::where('operation', 'institution.approved')->exists(), 'Universitas fixture telah dikonfigurasi aktif, tanpa persetujuan institusi baru dalam alur inti.');
    Storage::disk('local')->put('demo-roster.csv', "nim,nama,program_studi,angkatan,semester,nomor_whatsapp\n".CoreJourneyDemoSeeder::NIM.',Budi Data synthetic,Informatika,2026,2026-Synthetic,'.CoreJourneyDemoSeeder::PHONE."\n");
    $importer = app(ImportRoster::class);
    $preview = $importer->preview($campus, 'demo-roster.csv', '2026-Synthetic');
    expectJourney($preview['valid_rows'] === 1, 'Roster synthetic diperiksa sebelum commit.');
    $roster = $importer->commit($reviewer, $campus, 'demo-roster.csv', '2026-Synthetic');
    $affiliation = app(SubmitAffiliationRequest::class)->handle($student, $campus, CoreJourneyDemoSeeder::NIM);
    expectJourney($affiliation->status === AffiliationRequestStatus::Verified, 'Afiliasi mahasiswa baru melewati exact match NIM dan nomor synthetic terverifikasi.');
    $manual = User::factory()->create(['name' => 'Pemulihan afiliasi. Data synthetic']);
    PhoneNumber::factory()->forNumber('+6281200000001')->create(['user_id' => $manual->getKey()]);
    $pending = app(SubmitAffiliationRequest::class)->handle($manual, $campus, 'DEMO-T10-MISMATCH');
    expectJourney($pending->status === AffiliationRequestStatus::PendingReview, 'Mismatch roster menjadi antrean peninjauan, bukan akun tidak kompeten.');
    $locked = app(AcquireAffiliationReviewLock::class)->handle($pending, $reviewer);
    app(ReviewAffiliationRequest::class)->handle($locked, $reviewer, AffiliationReviewDecision::Approve, AffiliationReviewReason::RecordsConfirmed, $locked->version, 'Pemeriksaan berkas synthetic pada fixture.');
    expectJourney($pending->fresh()->status === AffiliationRequestStatus::Verified, 'Pemulihan manual menghasilkan keputusan actual dan riwayat.');
    $taxonomy = SkillTaxonomy::query()->firstOrFail();
    $profile = app(CreateStudentProfile::class)->handle($student, $campus, [
        'bio' => 'Belajar desain. Data synthetic',
        'skills' => [['taxonomy_id' => $taxonomy->getKey(), 'proficiency' => 'beginner']],
        'availability_windows' => [['day_of_week' => 2, 'starts_at' => '15:00', 'ends_at' => '17:00', 'timezone' => 'Asia/Jakarta']],
    ]);
    expectJourney(Contribution::count() === 0 && PortfolioEntry::count() === 0 && TeamMembership::count() === 0, 'Profil awal tersimpan tanpa karya, kontribusi atau relasi sebelumnya.');
    $project = app(CreateProject::class)->handle($owner, $campus, [
        'title' => 'Ruang Baca Kampus. Data synthetic', 'description' => 'Merancang pengalaman peminjaman buku.',
        'capacity' => 3, 'deadline' => now()->addWeek(),
        'roles' => [['title' => 'Desainer antarmuka', 'capacity' => 1, 'accepts_beginners' => true, 'selection_criteria' => 'Bekal dasar dan waktu belajar.', 'skills' => [['taxonomy_id' => $taxonomy->getKey(), 'proficiency' => 'beginner']]]],
    ]);
    $project = app(OpenProject::class)->handle($owner, $project, reason: 'Peluang belajar synthetic.');
    $role = $project->roles()->firstOrFail();
    $support = app(ManageOpportunitySupport::class);
    rejectsJourney(fn () => $support->create($student, $campus, []), AuthorizationException::class, 'Alur lengkap tidak membuka gate bantuan secara otomatis.');
    config()->set('opportunity_support.enabled', true);
    config()->set('opportunity_support.institutions.'.$campus->id, [
        'purpose' => 'Menemukan peran pemula. Data synthetic.', 'notice_version' => 'u06-support-v1',
        'approval_reference' => 'SYNTHETIC-U06-ONLY', 'dataset_kind' => 'synthetic',
        'dataset_manifest' => 'sqlite-memory-u06-fixture', 'access_days' => 7, 'reviewer_ids' => [$reviewer->id],
    ]);
    $supportRequest = $support->create($student, $campus, [
        'command_key' => (string) Str::uuid(), 'need' => 'beginner_path',
        'explanation' => 'Ingin belajar desain. Data synthetic.', 'consent' => true, 'notice_version' => 'u06-support-v1',
    ]);
    expectJourney(! Gate::forUser($secondReviewer)->allows('view', $supportRequest), 'Admin kedua tidak otomatis menjadi peninjau bantuan privat.');
    $supportRequest = $support->transition($reviewer, $supportRequest, [
        'action' => 'offer', 'expected_revision' => $supportRequest->revision,
        'project_role_id' => $role->id, 'reason' => 'Peran menerima pemula sesuai minat yang disampaikan.',
    ]);
    $supportRequest = $support->transition($student, $supportRequest, ['action' => 'accept', 'expected_revision' => $supportRequest->revision]);
    expectJourney($supportRequest->status === 'accepted' && TeamJoinRequest::count() === 0 && TeamMembership::count() === 0,
        'Tawaran bantuan berizin menunjuk peluang, bukan bergabung atau mengajukan otomatis.');
    $filters = ProjectDiscoveryFilters::fromValidated(['institution_id' => $campus->getKey(), 'beginner' => 'accepting', 'availability' => 'available']);
    $found = app(ProjectDiscoveryQuery::class)->execute($student, $filters);
    expectJourney($found->paginator->total() === 1, 'Peluang pemula terbuka ditemukan melalui query server, tanpa undangan personal.');
    rejectsJourney(fn () => app(ProjectDiscoveryQuery::class)->execute($outsider, $filters), AuthorizationException::class, 'Penelusuran tenant lain ditolak.');
    $version = app(CreateMatchScoreVersion::class)->execute($reviewer, 'demo-t10-v1', ['skill_fit' => .35, 'project_need' => .3, 'availability' => .2, 'connectivity_opportunity' => .15], ['policy' => MatchingAvailability::POLICY, 'availability_target_minutes' => 1, 'connectivity_cap' => 1], now());
    config()->set('matching.enabled', true);
    $refresh = app(RequestMatchingRefresh::class)->handle($campus->getKey(), $student->getKey());
    app(RebuildCandidateRecommendations::class)->handle($refresh->getKey(), $campus->getKey(), $student->getKey(), $refresh->revision);
    expectJourney($refresh->fresh()->status === 'ready' && Recommendation::where('candidate_id', $student->getKey())->exists(), 'Rekomendasi dihitung dari profil dan peran baru, bukan hasil seeder.');
    config()->set('matching.enabled', false);
    $beforeQueue = DB::table('jobs')->count();
    DB::beginTransaction();
    $join = app(RequestToJoinTeam::class)->handle($student, $project, $role->getKey(), "Minat: Belajar alur peminjaman.\nKemampuan relevan: Dasar desain.\nKetersediaan: Selasa sore.");
    expectJourney(DB::table('jobs')->count() === $beforeQueue && ! Gate::forUser($student)->allows('viewAny', [Task::class, $project]), 'Pengajuan belum membuka workspace; notifikasi tidak masuk queue sebelum commit.');
    DB::commit();
    expectJourney(DB::table('jobs')->count() > $beforeQueue, 'Notifikasi canonical benar-benar masuk antrean database setelah commit.');
    $second = app(RequestToJoinTeam::class)->handle($peer, $project, $role->getKey(), 'Minat belajar. Data synthetic.');
    $oldRevision = journeyRevision($second);
    app(AcceptTeamJoinRequest::class)->handle($owner, $join, 'Dasar desain dan waktu sesuai kebutuhan pemula.', journeyRevision($join));
    rejectsJourney(fn () => app(AcceptTeamJoinRequest::class)->handle($owner, $second, 'Bekal sesuai.', $oldRevision), HttpException::class, 'Keputusan dari snapshot kapasitas lama ditolak.');
    expectJourney(TeamMembership::where('project_id', $project->getKey())->count() === 1 && $second->fresh()->status->value === 'pending', 'Tempat terakhir tidak terlampaui; pengajuan lain tidak menjadi anggota.');
    expectJourney(Gate::forUser($student)->allows('viewAny', [Task::class, $project]), 'Keanggotaan actual membuka ruang kerja.');
    $task = app(CreateTask::class)->handle($owner, $project, ['title' => 'Rancangan alur peminjaman', 'description' => 'Rancangan dan penjelasan keputusan desain. Data synthetic']);
    app(AssignTask::class)->handle($owner, $task, $student, TaskSnapshot::revision($task->fresh()));
    $task = app(TransitionTaskStatus::class)->handle($student, $task->fresh(), TaskStatus::Done, TaskSnapshot::revision($task->fresh()));
    $proof = app(UploadAttachment::class)->handle($student, $project, UploadedFile::fake()->createWithContent('rancangan.txt', 'Bukti rancangan individual. Data synthetic.'), purpose: AttachmentPurpose::Evidence);
    expectJourney($task->status === TaskStatus::Done && Message::count() === 0 && Contribution::count() === 0, 'Tugas dan bukti diselesaikan tanpa pesan; bukan otomatis kontribusi.');
    $contribution = app(CreateContribution::class)->handle($student, $project, ['task_id' => $task->getKey(), 'claim' => 'Merancang alur peminjaman', 'summary' => 'Bagian rancangan individual. Data synthetic.', 'declaration' => 'Pernyataan privat contoh.', 'evidence' => [$proof->getKey()]]);
    $contribution = app(SubmitContribution::class)->handle($student, $contribution, ContributionSnapshot::revision($contribution->fresh()));
    app(ReviewContribution::class)->handle($contribution, $reviewer, ContributionReviewDecision::Revision, 1, ContributionSnapshot::revision($contribution->fresh()), 'Jelaskan keputusan desain.');
    expectJourney(PortfolioEntry::count() === 0, 'Permintaan revisi belum menghasilkan karya terverifikasi.');
    $oldSnapshot = ContributionSnapshot::revision($contribution->fresh());
    $contribution = app(ReviseContribution::class)->handle($student, $contribution->fresh(), ['summary' => 'Rancangan dengan penjelasan keputusan. Data synthetic.', 'expected_revision' => $oldSnapshot, 'evidence' => [$proof->getKey()]]);
    rejectsJourney(fn () => app(SubmitContribution::class)->handle($student, $contribution, $oldSnapshot), ConflictHttpException::class, 'Versi lama tidak mengirim revisi terbaru secara diam-diam.');
    $contribution = app(SubmitContribution::class)->handle($student, $contribution, ContributionSnapshot::revision($contribution->fresh()));
    app(ReviewContribution::class)->handle($contribution, $secondReviewer, ContributionReviewDecision::Approved, 2, ContributionSnapshot::revision($contribution->fresh()));
    $entry = PortfolioEntry::query()->sole();
    expectJourney($contribution->fresh()->status === ContributionStatus::Approved && $entry->visibility->value === 'private' && ContributionReview::count() === 2 && $entry->contribution_version_id === $contribution->current_version_id, 'Approval dan karya privat berasal dari versi actual; riwayat revisi utuh.');
    app(UpdateStudentProfileVisibility::class)->handle($student, $profile->fresh(), ['portfolio_visibility' => 'public', 'expected_privacy_revision' => \App\Support\Portfolio\PortfolioPrivacyRevision::for($profile->fresh())]);
    expectJourney(app(BuildPublicPortfolioProjection::class)->handle($profile->fresh()->public_identifier)['state'] === 'unavailable', 'Profil publik saja tidak membagikan karya privat.');
    app(UpdatePortfolioEntryVisibility::class)->handle($student, $entry, ['visibility' => 'public', 'expected_privacy_revision' => \App\Support\Portfolio\PortfolioPrivacyRevision::for($entry)]);
    $public = app(BuildPublicPortfolioProjection::class)->handle($profile->fresh()->public_identifier);
    $publicJson = json_encode($public, JSON_THROW_ON_ERROR);
    expectJourney($public['state'] === 'published' && ! str_contains($publicJson, $proof->path) && ! str_contains($publicJson, 'Pernyataan privat contoh.') && ! str_contains($publicJson, $student->username), 'Berbagi eksplisit hanya memproyeksikan ringkasan yang diizinkan.');
    app(UpdatePortfolioEntryVisibility::class)->handle($student, $entry->fresh(), ['visibility' => 'private', 'expected_privacy_revision' => \App\Support\Portfolio\PortfolioPrivacyRevision::for($entry->fresh())]);
    expectJourney(app(BuildPublicPortfolioProjection::class)->handle($profile->fresh()->public_identifier)['state'] === 'unavailable', 'Pencabutan berbagi menghentikan exposure berikutnya.');
    config()->set('opportunity_support.enabled', false);
    $supportRequest = $support->transition($student, $supportRequest->fresh(), ['action' => 'withdraw', 'expected_revision' => $supportRequest->revision]);
    expectJourney($supportRequest->status === 'withdrawn' && ! Gate::forUser($reviewer)->allows('view', $supportRequest)
        && OpportunitySupportRequest::count() === 1, 'Pencabutan bantuan tetap tersedia saat gate ditutup dan riwayat tidak dihapus.');
    Artisan::call('queue:work', ['connection' => 'database', '--stop-when-empty' => true, '--sleep' => 0, '--tries' => 1, '--max-jobs' => 30]);
    expectJourney(DB::table('jobs')->count() === 0 && $student->notifications()->count() >= 2 && $owner->notifications()->count() >= 1, 'Worker isolated memproses notifikasi database, bukan hanya fake pengiriman.');

    $gateway = new FonnteGateway('synthetic-not-a-secret');
    Http::fake(['api.fonnte.com/*' => Http::response(['status' => false], 503)]);
    expectJourney($gateway->send(['target' => CoreJourneyDemoSeeder::PHONE, 'message' => 'Pesan synthetic'])['success'] === false, 'Provider 503 tidak diklaim terkirim; tidak mengubah hasil kolaborasi.');
    Http::fake(['api.fonnte.com/*' => Http::failedConnection()]);
    expectJourney($gateway->send(['target' => CoreJourneyDemoSeeder::PHONE, 'message' => 'Pesan synthetic'])['success'] === false, 'Provider timeout memiliki hasil gagal terstruktur.');

    $restore = new PDO('sqlite::memory:');
    $restore->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $schema = DB::select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    foreach ($schema as $table) {
        $restore->exec($table->sql);
        $rows = DB::table($table->name)->get();
        foreach ($rows as $row) {
            $values = (array) $row;
            $columns = implode(', ', array_map(fn (string $name): string => '"'.$name.'"', array_keys($values)));
            $statement = $restore->prepare('INSERT INTO "'.$table->name.'" ('.$columns.') VALUES ('.implode(', ', array_fill(0, count($values), '?')).')');
            $statement->execute(array_values($values));
        }
    }
    foreach (DB::select("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL") as $index) {
        $restore->exec($index->sql);
    }
    $restore->exec('PRAGMA foreign_keys = ON');
    expectJourney($restore->query('PRAGMA integrity_check')->fetchColumn() === 'ok' && $restore->query('PRAGMA foreign_key_check')->fetchAll() === [], 'Snapshot logical SQLite direstore ke database memori lain dengan integrity dan FK utuh.');
    expectJourney((int) $restore->query('SELECT COUNT(*) FROM contribution_reviews')->fetchColumn() === 2 && (int) $restore->query('SELECT COUNT(*) FROM portfolio_entries')->fetchColumn() === 1, 'Restore mempertahankan keputusan, karya dan provenance.');
    $bytes = Storage::disk('private')->get($proof->path);
    Storage::disk('private')->put('restore-check/'.$proof->path, $bytes);
    expectJourney(hash('sha256', Storage::disk('private')->get('restore-check/'.$proof->path)) === $proof->sha256, 'Bukti synthetic dipulihkan terpisah dengan checksum yang sama.');
}
app()->instance('env', 'production');
rejectsJourney(fn () => app(CoreJourneyDemoSeeder::class)->run(), RuntimeException::class, 'Seeder menolak production meskipun database berada di memori.');
app()->instance('env', 'testing');
$fileGuard = sys_get_temp_dir().'/satu-t10-refusal-'.Str::uuid().'.sqlite';
config()->set('database.connections.core_journey_forbidden_file', ['driver' => 'sqlite', 'database' => $fileGuard]);
config()->set('database.default', 'core_journey_forbidden_file');
rejectsJourney(fn () => app(CoreJourneyDemoSeeder::class)->run(), RuntimeException::class, 'Seeder menolak database SQLite file sebelum pembacaan atau penulisan.');
expectJourney(! file_exists($fileGuard), 'Penolakan tidak membuat berkas database.');
config()->set('database.default', 'core_journey_check');
config()->set('demo.core_journey_manifest', null);
rejectsJourney(fn () => app(CoreJourneyDemoSeeder::class)->run(), RuntimeException::class, 'Seeder menolak tanpa manifest eksplisit.');
expectJourney(Http::recorded()->every(fn (array $pair): bool => str_starts_with($pair[0]->url(), 'https://api.fonnte.com/')), 'Hanya provider fake yang diakses; tidak ada pengiriman eksternal.');
echo "{$checks} pemeriksaan perjalanan T10 lulus. Data synthetic. Dua reset memori, bukan UAT atau pilot.".PHP_EOL;
