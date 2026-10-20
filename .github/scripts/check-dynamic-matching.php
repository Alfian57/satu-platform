<?php

declare(strict_types=1);

use App\Actions\Matching\CreateMatchScoreVersion;
use App\Actions\Matching\HideRecommendation;
use App\Actions\Matching\MarkRecommendationNotRelevant;
use App\Actions\Matching\RecommendationQuery;
use App\Actions\Matching\RequestMatchingRefresh;
use App\Actions\Profile\UpdateStudentProfile;
use App\Actions\Project\CancelProject;
use App\Actions\Project\CreateProject;
use App\Actions\Project\OpenProject;
use App\Actions\Project\UpdateProject;
use App\Actions\Team\LeaveTeam;
use App\Exceptions\StaleRecommendation;
use App\Http\Controllers\DashboardController;
use App\Http\Requests\Matching\RefreshRecommendationsRequest;
use App\Jobs\RebuildCandidateRecommendations;
use App\Models\AvailabilityWindow;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Recommendation;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use App\Support\Matching\MatchingFreshness;
use App\Support\Matching\MatchingInput;
use App\Support\Matching\MatchingScorer;
use App\Support\Matching\RecommendationSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
config()->set('database.default', 'matching_check');
config()->set('database.connections.matching_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
if (DB::connection()->getName() !== 'matching_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian dihentikan: database wajib SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-10 09:00:00');
$passed = 0;
function expectMatching(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function matchingFailure(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectMatching($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}

config()->set('matching.enabled', false);
$campus = Institution::factory()->active()->create(['name' => 'Kampus pencocokan. Data synthetic']);
config()->set('university.slug', $campus->slug);
$otherCampus = Institution::factory()->active()->create();
$owner = User::factory()->create();
$candidate = User::factory()->create();
$peer = User::factory()->create();
foreach ([$owner, $candidate, $peer] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->id, 'user_id' => $user->id]);
}
$profile = StudentProfile::factory()->create(['institution_id' => $campus->id, 'user_id' => $candidate->id]);
$taxonomy = SkillTaxonomy::factory()->create(['name' => 'Desain antarmuka. Data synthetic']);
$skill = ProfileSkill::factory()->create(['student_profile_id' => $profile->id, 'skill_taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner', 'evidence_metadata' => [['title' => 'Bukti privat', 'url' => 'https://example.com/private-evidence']]]);
AvailabilityWindow::factory()->create(['student_profile_id' => $profile->id, 'day_of_week' => 1, 'starts_at' => '09:00:00', 'ends_at' => '10:00:00']);
$project = $app->make(CreateProject::class)->handle($owner, $campus, ['title' => 'Proyek belajar. Data synthetic', 'capacity' => 4, 'deadline' => now()->addWeeks(2), 'roles' => [
    ['title' => 'Peran terisi', 'capacity' => 1, 'accepts_beginners' => true, 'skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']]],
    ['title' => 'Peran tersedia', 'capacity' => 2, 'accepts_beginners' => true, 'skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']]],
]]);
$project->forceFill(['status' => 'open'])->save();
$roles = $project->roles()->orderBy('id')->get();
TeamMembership::factory()->active()->create(['project_id' => $project->id, 'project_role_id' => $roles[0]->id, 'user_id' => $peer->id]);
$private = Project::factory()->create(['institution_id' => $campus->id, 'owner_id' => $owner->id, 'visibility' => 'private']);
ProjectRole::factory()->create(['project_id' => $private->id]);
$outside = Project::factory()->create(['institution_id' => $otherCampus->id, 'owner_id' => $owner->id]);
ProjectRole::factory()->create(['project_id' => $outside->id]);
$admin = User::factory()->create(['is_platform_admin' => false]);
App\Models\InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['user_id' => $admin->id, 'institution_id' => $campus->id]);
$params = ['availability_target_minutes' => 1, 'connectivity_cap' => 1, 'policy' => MatchingAvailability::POLICY];
$weights = ['skill_fit' => 0.35, 'project_need' => 0.30, 'availability' => 0.20, 'connectivity_opportunity' => 0.15];
$version = $app->make(CreateMatchScoreVersion::class)->execute($admin, 'synthetic-v2', $weights, $params, now());
config()->set('matching.enabled', true);
Queue::fake();
Notification::fake();
$requestRefresh = $app->make(RequestMatchingRefresh::class);
$rebuild = $app->make(App\Actions\Matching\RebuildCandidateRecommendations::class);
$read = $app->make(RecommendationQuery::class);
function runMatchingRefresh($refresh): void
{
    global $rebuild;
    $rebuild->handle($refresh->id, $refresh->institution_id, $refresh->candidate_id, $refresh->revision);
}
expectMatching(Contribution::query()->where('owner_id', $candidate->id)->count() === 0, 'Profil tanpa karya atau kontribusi menjadi peserta pencocokan, bukan ditolak otomatis.');
$refresh = $requestRefresh->handle($campus->id, $candidate->id);
expectMatching($refresh->status === 'queued', 'POST eksplisit mencatat permintaan, bukan mengklaim hasil sudah dihitung.');
$duplicate = $requestRefresh->handle($campus->id, $candidate->id);
expectMatching($duplicate->revision === $refresh->revision, 'Permintaan berulang saat antrean tidak menggandakan revision.');
DB::flushQueryLog();
DB::enableQueryLog();
runMatchingRefresh($refresh);
$queries = DB::getQueryLog();
DB::disableQueryLog();
expectMatching(! collect($queries)->contains(fn (array $entry): bool => str_contains($entry['query'], 'collaboration_events') || str_contains($entry['query'], 'inclusion_signals') || str_contains($entry['query'], 'messages')), 'Job v2 tidak membaca jaringan, inklusi atau isi pesan.');
$refresh = $refresh->fresh();
$recommendation = Recommendation::query()->where('candidate_id', $candidate->id)->latest('id')->firstOrFail();
$run = $recommendation->matchRun;
expectMatching($refresh->status === 'ready' && $refresh->outcome === 'available', 'Batch sukses dan statusnya tersimpan atomik.');
expectMatching($run->input_snapshot['selected_role']['id'] === $roles[1]->id, 'Pencocokan memilih peran tersedia, bukan peran pertama yang sudah penuh.');
expectMatching(count($recommendation->component_scores) === 4 && $recommendation->component_scores['availability'] === 0.5 && $recommendation->component_scores['connectivity_opportunity'] === 0.5, 'Empat dimensi tetap ada; jadwal tanpa kebutuhan proyek dan hubungan bersifat netral.');
expectMatching(! str_contains(json_encode($run->input_snapshot, JSON_THROW_ON_ERROR), 'private-evidence'), 'Snapshot dapat diaudit tanpa tautan bukti privat.');
$counts = [Recommendation::query()->count(), MatchRun::query()->count()];
runMatchingRefresh($refresh);
expectMatching($counts === [Recommendation::query()->count(), MatchRun::query()->count()], 'Job ulang revision selesai tidak menggandakan hasil atau history.');
DB::flushQueryLog();
DB::enableQueryLog();
$result = $read->execute($candidate, $campus);
$page = $app->make(RecommendationSerializer::class)->page($result);
$queries = DB::getQueryLog();
DB::disableQueryLog();
expectMatching($result->paginator->total() === 1 && $page['data'][0]['role']['id'] === $roles[1]->id, 'Read model hanya membaca peluang aktual dalam tenant dan peran yang dihitung.');
expectMatching(collect($queries)->every(fn (array $entry): bool => str_starts_with(strtolower(ltrim($entry['query'])), 'select')), 'GET rekomendasi dan freshness hanya SELECT.');
$projection = json_encode($page, JSON_THROW_ON_ERROR);
expectMatching(! str_contains($projection, 'source_digest') && ! str_contains($projection, 'input_snapshot') && ! str_contains($projection, 'connectivity_opportunity') && ! str_contains($projection, $candidate->username), 'Projection tidak membocorkan digest, snapshot, dimensi privat atau identitas login.');
expectMatching(count($page['data'][0]['top_reasons']) === 3 && count($page['data'][0]['limitations']) === 3, 'Alasan aman, versi dan batas ketidakpastian tersedia.');
$dashboard = $app->make(DashboardController::class);
$regionMethod = new ReflectionMethod($dashboard, 'recommendations');
$readyProfile = $profile->fresh()->loadCount(['skills', 'availabilityWindows']);
$region = $regionMethod->invoke($dashboard, $candidate, $campus, $readyProfile, true);
expectMatching($region['state'] === 'ready' && $region['recommendation']['role'] === 'Peran tersedia', 'Payload Beranda memakai hasil aktual dan peran terpilih, bukan fixture UI.');
$run->input_snapshot = ['invalid' => true];
matchingFailure(fn () => $run->save(), LogicException::class, 'Snapshot historical tidak dapat ditimpa melalui model.');
$scorer = $app->make(MatchingScorer::class);
$input = new MatchingInput(1, 1, 1, 2, [['taxonomy_id' => 1, 'proficiency' => 1]], [], [['role_id' => 1, 'role_title' => 'Peran', 'role_capacity' => 1, 'taxonomy_id' => 1, 'skill_name' => 'Keahlian', 'required_proficiency' => 1]], [['day_of_week' => 1, 'starts_at' => '09:00', 'ends_at' => '10:00', 'timezone' => 'Asia/Jakarta']], [], 0, 0);
$experienced = new MatchingInput(1, 1, 1, 2, $input->profileSkills, [], $input->projectRequirements, [['day_of_week' => 1, 'starts_at' => '09:00', 'ends_at' => '18:00', 'timezone' => 'Asia/Jakarta']], [], 100, 100);
expectMatching($scorer->score($input, $weights, $params)->totalScore === $scorer->score($experienced, $weights, $params)->totalScore, 'Riwayat/jumlah hubungan dan jadwal panjang tanpa kebutuhan proyek tidak memengaruhi skor v2.');
matchingFailure(fn () => $read->execute($candidate, $otherCampus), AuthorizationException::class, 'Read model menolak tenant yang tidak dimiliki.');
$before = MatchRun::query()->count();
$rebuild->handle($refresh->id, $otherCampus->id, $candidate->id, $refresh->revision);
expectMatching($before === MatchRun::query()->count(), 'Payload job lintas tenant tidak menemukan target atau menulis hasil.');
$previousRevision = $refresh->revision;
$app->make(UpdateStudentProfile::class)->handle($candidate, $profile, ['skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'expert']]]);
$refresh = $refresh->fresh();
expectMatching($refresh->status === 'queued' && $refresh->revision !== $previousRevision, 'Perubahan keahlian tersimpan memicu invalidasi dan antrean setelah commit.');
expectMatching($regionMethod->invoke($dashboard, $candidate, $campus, $readyProfile, true)['state'] === 'processing', 'Beranda membedakan antrean backend dari hasil siap.');
expectMatching($read->execute($candidate, $campus)->paginator->total() === 0, 'Hasil batch sebelumnya tidak ditampilkan saat input berubah.');
$rebuild->handle($refresh->id, $campus->id, $candidate->id, $previousRevision);
expectMatching(MatchRun::query()->count() === $before, 'Job revision lama tidak menulis hasil atau menimpa status baru.');
runMatchingRefresh($refresh);
$refresh = $refresh->fresh();
$afterRollback = $refresh->toArray();
matchingFailure(fn () => $app->make(UpdateStudentProfile::class)->handle($candidate, $profile->fresh(), ['skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']], 'availability_windows' => [['day_of_week' => 1, 'starts_at' => '12:00', 'ends_at' => '11:00', 'timezone' => 'Asia/Jakarta']]]), ValidationException::class, 'Sumber yang gagal validasi membatalkan transaksi.');
expectMatching($refresh->fresh()->toArray() === $afterRollback, 'Rollback tidak menerbitkan invalidasi atau antrean baru.');
$active = $read->execute($candidate, $campus)->paginator->first();
$app->make(HideRecommendation::class)->execute($candidate, $active);
expectMatching($read->execute($candidate, $campus)->paginator->total() === 0, 'Feedback menyembunyikan peluang dari hasil baca.');
$refresh = $requestRefresh->handle($campus->id, $candidate->id);
runMatchingRefresh($refresh);
expectMatching($read->execute($candidate, $campus)->paginator->total() === 0, 'Pembaruan batch tidak membatalkan pilihan sembunyikan.');
expectMatching($regionMethod->invoke($dashboard, $candidate, $campus, $readyProfile, true)['state'] === 'empty', 'Hasil yang disembunyikan menjadi kosong, bukan stale atau contoh rekaan.');
$peerProfile = StudentProfile::factory()->create(['institution_id' => $campus->id, 'user_id' => $peer->id]);
ProfileSkill::factory()->create(['student_profile_id' => $peerProfile->id, 'skill_taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']);
AvailabilityWindow::factory()->create(['student_profile_id' => $peerProfile->id]);
$peerRefresh = $requestRefresh->handle($campus->id, $peer->id);
runMatchingRefresh($peerRefresh);
expectMatching($read->execute($peer, $campus)->paginator->total() === 0, 'Anggota aktif tidak direkomendasikan bergabung pada timnya sendiri.');
$blankStudent = User::factory()->create();
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->id, 'user_id' => $blankStudent->id]);
StudentProfile::factory()->create(['institution_id' => $campus->id, 'user_id' => $blankStudent->id]);
expectMatching($requestRefresh->handle($campus->id, $blankStudent->id)->outcome === 'profile_incomplete', 'Profil belum siap tidak memperoleh skor nol rekaan; statusnya meminta kesiapan profil.');
$availableInput = $project->roles()->get()->map(fn (ProjectRole $role): array => ['id' => $role->id, 'title' => $role->title, 'capacity' => $role->capacity, 'skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']], 'accepts_beginners' => true, 'selection_criteria' => 'Kriteria nyata diperbarui'])->all();
$app->make(UpdateProject::class)->handle($owner, $project->fresh(), ['roles' => $availableInput]);
expectMatching($refresh->fresh()->status === 'queued' && $peerRefresh->fresh()->status === 'queued', 'Perubahan peran memicu pembaruan kandidat dalam kampus, bukan hanya pemilik.');
$queued = $refresh->fresh();
$job = new RebuildCandidateRecommendations($queued->id, $campus->id, $candidate->id, $queued->revision);
$job->failed(new RuntimeException('Synthetic failure'));
expectMatching($queued->fresh()->status === 'failed', 'Kegagalan akhir job memiliki status tersimpan dan pemulihan eksplisit.');
expectMatching($regionMethod->invoke($dashboard, $candidate, $campus, $readyProfile, true)['state'] === 'error', 'Beranda membaca kegagalan job sebagai keadaan pemulihan.');
$refresh = $requestRefresh->handle($campus->id, $candidate->id);
$job->failed(new RuntimeException('Late failure'));
expectMatching($refresh->fresh()->status === 'queued', 'Callback gagal revision lama tidak menimpa permintaan baru.');
$member = InstitutionMembership::query()->whereBelongsTo($candidate)->first();
$member->forceFill(['status' => 'suspended'])->save();
runMatchingRefresh($refresh);
expectMatching($refresh->fresh()->status === 'blocked', 'Job memeriksa ulang afiliasi sebelum membaca/menulis hasil.');
matchingFailure(fn () => $requestRefresh->handle($campus->id, $candidate->id), AuthorizationException::class, 'Mahasiswa ditangguhkan tidak dapat meminta pembaruan.');
$member->forceFill(['status' => 'verified'])->save();
$refresh = $requestRefresh->handle($campus->id, $candidate->id);
runMatchingRefresh($refresh);
$current = Recommendation::query()->where('candidate_id', $candidate->id)->latest('id')->firstOrFail();
$roles[1]->forceFill(['selection_criteria' => 'Perubahan raw. Data synthetic'])->save();
expectMatching(! $app->make(MatchingFreshness::class)->isFresh($current, $version->id), 'Digest mendeteksi sumber berubah pada detik yang sama, termasuk perubahan di luar Action.');
matchingFailure(fn () => $app->make(MarkRecommendationNotRelevant::class)->execute($candidate, $current), StaleRecommendation::class, 'Feedback hasil stale tidak merekam keputusan berdasarkan input lama.');
$refresh = $requestRefresh->handle($campus->id, $candidate->id);
runMatchingRefresh($refresh);
$version2 = $app->make(CreateMatchScoreVersion::class)->execute($admin, 'synthetic-v2b', $weights, $params, now()->addSecond());
Carbon::setTestNow(now()->addSeconds(2));
expectMatching($read->execute($candidate, $campus)->paginator->total() === 0, 'Versi baru tidak mempromosikan hasil lama sebagai aktual.');
expectMatching(Artisan::call('matching:reconcile-refreshes') === 0 && $refresh->fresh()->status === 'queued', 'Scheduler merekonsiliasi versi tanpa mutasi GET.');
$refresh = $refresh->fresh();
runMatchingRefresh($refresh);
$current = Recommendation::query()->where('candidate_id', $candidate->id)->latest('id')->firstOrFail();
expectMatching($current->matchRun->version_id === $version2->id && $current->expires_at->gt(now()) && $current->expires_at->lte(now()->addMinutes(360)), 'Batch baru memakai versi aktual dan masa berlaku terbatas.');
Carbon::setTestNow(now()->addHours(7));
expectMatching(! $app->make(MatchingFreshness::class)->isFresh($current, $version2->id), 'Hasil kedaluwarsa ditolak, bukan diberi jaminan tempat.');
expectMatching(Artisan::call('matching:reconcile-refreshes') === 0 && $refresh->fresh()->status === 'queued', 'Antrean dapat dipulihkan setelah TTL lewat.');
$oldWeights = $version->fresh()->weights;
$version->weights = ['skill_fit' => 1.0];
matchingFailure(fn () => $version->save(), LogicException::class, 'Konfigurasi versi existing tetap immutable.');
expectMatching($version->fresh()->weights === $oldWeights, 'Versi baru tidak mengubah bobot historical.');
$app->detectEnvironment(fn () => 'production');
expectMatching(! $app->make(MatchingAvailability::class)->enabled(), 'Production default gated, bukan aktivasi data nyata melalui tes.');
expectMatching($regionMethod->invoke($dashboard, $candidate, $campus, $readyProfile, true)['state'] === 'unavailable', 'Beranda menjelaskan gate production tanpa rekomendasi aktif.');
$app->detectEnvironment(fn () => 'testing');
$rules = (new RefreshRecommendationsRequest)->rules();
expectMatching(! Validator::make(['institution_id' => $campus->id, 'candidate_id' => $peer->id, 'weights' => $weights], $rules)->passes(), 'Klien tidak menentukan kandidat orang lain atau mengganti bobot.');
$extra = $app->make(CreateProject::class)->handle($owner, $campus, ['title' => 'Peluang kedua. Data synthetic', 'capacity' => 2, 'deadline' => now()->addWeek(), 'roles' => [['title' => 'Peran kedua', 'capacity' => 2, 'accepts_beginners' => true, 'skills' => [['taxonomy_id' => $taxonomy->id, 'proficiency' => 'beginner']]]]]);
$app->make(OpenProject::class)->handle($owner, $extra);
$refresh = $refresh->fresh();
$beforeFailure = [MatchRun::query()->count(), Recommendation::query()->count()];
$faultEnabled = true;
$insertCount = 0;
DB::listen(function (QueryExecuted $query) use (&$faultEnabled, &$insertCount): void {
    if ($faultEnabled && str_starts_with(strtolower($query->sql), 'insert') && str_contains($query->sql, '"recommendations"')) {
        $insertCount++;
        if ($insertCount === 2) {
            throw new RuntimeException('Gangguan database sintetis setelah sebagian batch.');
        }
    }
});
matchingFailure(fn () => runMatchingRefresh($refresh), RuntimeException::class, 'Gangguan tengah batch ditangani sebagai kegagalan, bukan sukses parsial.');
$faultEnabled = false;
expectMatching($beforeFailure === [MatchRun::query()->count(), Recommendation::query()->count()] && $refresh->fresh()->status === 'queued', 'Rollback job membatalkan semua hasil parsial dan mempertahankan antrean untuk retry.');
runMatchingRefresh($refresh);
expectMatching($refresh->fresh()->status === 'ready' && MatchRun::query()->count() === $beforeFailure[0] + 2, 'Retry setelah gangguan menghasilkan satu batch lengkap tanpa duplikasi hasil parsial.');
expectMatching(Artisan::call('matching:create-score-version', ['--actor' => (string) $admin->id, '--score-version' => 'synthetic-inactive', '--weights' => json_encode($weights, JSON_THROW_ON_ERROR)]) === 0 && MatchScoreVersion::current()->id === $version2->id, 'Command admin membuat versi baru yang tidak aktif tanpa flag aktivasi eksplisit.');
expectMatching(Artisan::call('matching:create-score-version', ['--actor' => (string) $candidate->id, '--score-version' => 'forbidden-version', '--weights' => json_encode($weights, JSON_THROW_ON_ERROR)]) === 1, 'Command konfigurasi tidak memperluas kewenangan mahasiswa.');
$teamMember = TeamMembership::query()->where('project_id', $project->id)->where('user_id', $peer->id)->firstOrFail();
$app->make(LeaveTeam::class)->handle($peer, $teamMember, 'Pengujian kapasitas. Data synthetic.');
$refresh = $refresh->fresh();
expectMatching($refresh->status === 'queued', 'Perubahan anggota tim memicu pembaruan kapasitas setelah commit.');
runMatchingRefresh($refresh);
$newForProject = Recommendation::query()->where('candidate_id', $candidate->id)->where('project_id', $project->id)->latest('id')->firstOrFail();
expectMatching($newForProject->matchRun->input_snapshot['selected_role']['id'] === $roles[0]->id, 'Peran yang kembali kosong dapat dibandingkan, bukan memakai kapasitas snapshot lama.');
$app->make(CancelProject::class)->handle($owner, $extra->fresh(), 'Peluang tidak dilanjutkan. Data synthetic.');
$refresh = $refresh->fresh();
expectMatching($refresh->status === 'queued', 'Pembatalan proyek memicu invalidasi kandidat pada tenant yang sama.');
runMatchingRefresh($refresh);
expectMatching($read->execute($candidate, $campus)->paginator->total() === 0, 'Proyek dibatalkan tidak direkomendasikan lagi dan pilihan sembunyi tetap berlaku.');
$studentAdapter = $app->make(App\Actions\Matching\GenerateRecommendationsForStudent::class);
$projectAdapter = $app->make(App\Actions\Matching\GenerateRecommendationsForProject::class);
config()->set('matching.enabled', false);
$beforeAdapter = [Recommendation::query()->count(), MatchRun::query()->count(), App\Models\MatchingRefreshRequest::query()->count()];
expectMatching($studentAdapter->handle($candidate, $campus) === 0 && $projectAdapter->handle($project) === 0, 'Adapter backend tambahan menghormati gate pencocokan yang tertutup.');
expectMatching($beforeAdapter === [Recommendation::query()->count(), MatchRun::query()->count(), App\Models\MatchingRefreshRequest::query()->count()], 'Gate tertutup tidak menulis hasil atau antrean melalui adapter lama.');
config()->set('matching.enabled', true);
expectMatching($studentAdapter->handle($candidate, $otherCampus) === 0, 'Adapter mahasiswa menolak kampus tanpa afiliasi yang sah.');
$countBeforeQueue = [Recommendation::query()->count(), MatchRun::query()->count()];
expectMatching($studentAdapter->handle($candidate, $campus) === 1 && $studentAdapter->handle($candidate, $campus) === 1, 'Adapter mengantrekan pembaruan canonical dan replay memakai request yang sama.');
expectMatching($countBeforeQueue === [Recommendation::query()->count(), MatchRun::query()->count()], 'Adapter tidak menghitung hasil sinkron di luar pipeline versioning.');
expectMatching(App\Models\MatchingRefreshRequest::query()->where('institution_id', $campus->id)->where('candidate_id', $candidate->id)->count() === 1, 'Adapter tidak menggandakan request kandidat.');
echo $passed.' pemeriksaan pencocokan lulus. Semua fixture SQLite :memory:, bukan data aplikasi.'.PHP_EOL;
