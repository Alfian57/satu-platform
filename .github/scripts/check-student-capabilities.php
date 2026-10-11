<?php

declare(strict_types=1);

use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Actions\Profile\CreateStudentProfile;
use App\Actions\Profile\ResolveStudentMembership;
use App\Actions\Profile\StudentProfileWorkspaceQuery;
use App\Actions\Profile\SyncStudentProfileTaxonomies;
use App\Actions\Profile\UpdateStudentProfile;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\PortfolioVisibility;
use App\Http\Controllers\StudentProfileController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Requests\Profile\StoreStudentProfileRequest;
use App\Http\Requests\Profile\UpdateStudentProfileRequest;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\Task;
use App\Models\User;
use App\Rules\ProfileEvidenceUrl;
use App\Support\Profile\ProfileRevision;
use App\Support\Project\ProjectDiscoveryFilters;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
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
config()->set('database.default', 'capability_check');
config()->set('database.connections.capability_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
if (DB::connection()->getName() !== 'capability_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian dihentikan: database wajib SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-10 09:00:00');
$passed = 0;
function expectCapability(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function expectCapabilityFailure(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectCapability($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}

$campus = Institution::factory()->active()->create();
$otherCampus = Institution::factory()->active()->create();
$user = User::factory()->create();
$peer = User::factory()->create();
$membership = InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->getKey(), 'user_id' => $user->getKey()]);
$peerMembership = InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->getKey(), 'user_id' => $peer->getKey()]);
$pendingMembership = InstitutionMembership::factory()->student()->pending()->create(['institution_id' => $otherCampus->getKey(), 'user_id' => $user->getKey(), 'requested_at' => now()->addMinute()]);
$skill = SkillTaxonomy::factory()->create(['name' => 'Desain sintetis', 'category' => 'design', 'is_verified' => true]);
$interest = SkillTaxonomy::factory()->create(['name' => 'Kolaborasi sintetis', 'category' => 'interest', 'is_verified' => true]);
$unverifiedTaxonomy = SkillTaxonomy::factory()->create(['is_verified' => false]);
$resolver = $app->make(ResolveStudentMembership::class);
expectCapability($resolver->handle($user)->getKey() === $membership->getKey(), 'Request pending baru tidak mengganti konteks kampus terverifikasi.');
$workspace = $app->make(StudentProfileWorkspaceQuery::class);
DB::enableQueryLog();
$emptyWorkspace = $workspace->execute($user);
expectCapability($emptyWorkspace['profile'] === null && $emptyWorkspace['approvedSources'] === [] && StudentProfile::query()->count() === 0, 'GET profil tanpa karya tidak membuat profil default atau sumber rekaan.');
expectCapability(array_all(DB::getQueryLog(), fn (array $query): bool => str_starts_with(strtolower($query['query']), 'select')), 'Pembacaan workspace hanya menjalankan SELECT.');
expectCapabilityFailure(fn () => $workspace->execute($peer, $otherCampus->getKey()), AuthorizationException::class, 'Permintaan konteks kampus orang lain ditolak.');

$profile = $app->make(CreateStudentProfile::class)->handle($user, $campus, ['interests' => [$interest->getKey()], 'skills' => [], 'availability_windows' => []]);
expectCapability($profile->exists && $profile->skills()->count() === 0 && $profile->interests()->count() === 1 && $profile->availabilityWindows()->count() === 0 && Contribution::query()->count() === 0, 'Mahasiswa tanpa karya, keahlian, jadwal atau relasi dapat menyimpan minat.');
expectCapability($profile->portfolio_visibility === PortfolioVisibility::Private && ! $profile->recruiter_discoverable, 'Simpan profil baru tidak membuka izin portofolio atau perekrut.');
$project = Project::factory()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
expectCapability($app->make(ProjectDiscoveryQuery::class)->execute($user, ProjectDiscoveryFilters::fromValidated(['institution_id' => $campus->getKey()]))->paginator->contains('id', $project->getKey()), 'Profil tanpa karya tetap dapat menelusuri peluang.');
Auth::setUser($user);
$payload = $app->make(StudentProfileController::class)->show($profile)->getData(true)['data'];
expectCapability(strlen($payload['revision']) === 64 && $payload['interests'][0]['taxonomy_id'] === $interest->getKey(), 'Payload privat memuat minat dan revision snapshot.');
expectCapability(! array_key_exists('username', $payload) && ! array_key_exists('user_id', $payload) && ! array_key_exists('phone', $payload), 'Editor tidak memproyeksikan identitas login, kontak atau NIM.');
$request = Request::create('/student-profiles/edit');
$route = new Route(['GET'], 'student-profiles/edit', fn (): null => null);
$route->name('student-profiles.edit');
$request->setRouteResolver(fn (): Route => $route);
$request->setUserResolver(fn (): User => $user);
$summary = new ReflectionMethod(HandleInertiaRequests::class, 'studentOnboardingSummary');
$onboarding = $summary->invoke($app->make(HandleInertiaRequests::class), $request);
expectCapability(! $onboarding['required'] && $onboarding['institutionId'] === $campus->getKey(), 'Profil kosong/minat saja tidak memaksa onboarding berulang atau mengubah tenant.');

$updater = $app->make(UpdateStudentProfile::class);
$beforeRevision = ProfileRevision::for($profile->fresh());
$windows = [
    ['day_of_week' => 1, 'starts_at' => '09:15:30', 'ends_at' => '10:30:45', 'timezone' => 'Asia/Jakarta'],
    ['day_of_week' => 3, 'starts_at' => '18:00:00', 'ends_at' => '19:00:00', 'timezone' => 'Asia/Makassar'],
];
$proof = ['title' => 'Karya belajar. Data sintetis', 'url' => 'https://example.org/karya?view=1'];
$profile = $updater->handle($user, $profile, ['skills' => [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'beginner', 'evidence_metadata' => [$proof]]], 'availability_windows' => $windows, 'expected_profile_revision' => $beforeRevision]);
expectCapability($profile->availabilityWindows()->orderBy('day_of_week')->get()->map(fn ($window): array => $window->only(['day_of_week', 'starts_at', 'ends_at', 'timezone']))->all() === $windows, 'Jadwal mempertahankan detik, hari, jam dan zona waktu per baris.');
expectCapability($profile->skills()->first()->evidence_metadata === [$proof], 'Tautan HTTPS awal tersimpan tanpa klaim validasi.');
expectCapability(ProfileRevision::for($profile) !== $beforeRevision, 'Perubahan relasi mengubah revision meskipun clock dibekukan pada detik yang sama.');
expectCapabilityFailure(fn () => $updater->handle($user, $profile, ['bio' => 'Overwrite sintetis', 'expected_profile_revision' => $beforeRevision]), ConflictHttpException::class, 'Snapshot lama ditolak meskipun timestamp sama.');
expectCapability($profile->fresh()->bio === null, 'Konflik tidak menimpa data terbaru.');

$revision = ProfileRevision::for($profile->fresh());
$beforeAudit = AuditLog::query()->count();
$beforeProjection = TalentCandidateProjection::query()->first()->toArray();
expectCapabilityFailure(fn () => $updater->handle($user, $profile, ['bio' => 'Tidak boleh tersimpan', 'skills' => [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'expert']], 'availability_windows' => [
    ['day_of_week' => 1, 'starts_at' => '09:00', 'ends_at' => '11:00', 'timezone' => 'Asia/Jakarta'],
    ['day_of_week' => 1, 'starts_at' => '10:00', 'ends_at' => '12:00', 'timezone' => 'Asia/Jakarta'],
], 'expected_profile_revision' => $revision]), ValidationException::class, 'Jadwal overlap menolak simpan profil atomik.');
expectCapability($profile->fresh()->bio === null && $profile->skills()->first()->proficiency->value === 'beginner' && ProfileRevision::for($profile->fresh()) === $revision, 'Rollback menjaga informasi, keahlian, bukti serta jadwal lama.');
expectCapability(AuditLog::query()->count() === $beforeAudit && TalentCandidateProjection::query()->first()->toArray() === $beforeProjection, 'Rollback tidak meninggalkan audit/proyeksi untuk operasi gagal.');
expectCapabilityFailure(fn () => $updater->handle($peer, $profile, ['bio' => 'Bukan pemilik']), AuthorizationException::class, 'Non-pemilik tidak dapat mengubah profil.');
Auth::setUser($peer);
expectCapabilityFailure(fn () => $app->make(StudentProfileController::class)->show($profile), AuthorizationException::class, 'Non-pemilik tidak menerima bukti privat.');
Auth::setUser($user);
expectCapabilityFailure(fn () => $app->make(CreateStudentProfile::class)->handle($user, $otherCampus, []), AuthorizationException::class, 'Afiliasi pending tidak mengizinkan penyimpanan profil.');
foreach ([InstitutionMembershipStatus::Pending, InstitutionMembershipStatus::Suspended] as $status) {
    $membership->forceFill(['status' => $status])->save();
    $context = $workspace->execute($user, $campus->getKey());
    expectCapability($context['profile'] === null && $context['approvedSources'] === [], 'Status '.$status->value.' tidak membaca profil atau bukti lama.');
    expectCapabilityFailure(fn () => $updater->handle($user, $profile, ['bio' => 'Ditolak']), AuthorizationException::class, 'Status '.$status->value.' tidak dapat menulis profil.');
}
$membership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();

$rules = (new StoreStudentProfileRequest)->rules();
foreach (['javascript:alert(1)', 'http://example.org/x', 'data:text/html,hello', 'https://user:password@example.org/x', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://0x7f.0.0.1/x', 'https://service.local/x', 'https://example.org/x?access_token=private'] as $url) {
    expectCapability(! ProfileEvidenceUrl::isSafe($url), 'Tautan berbahaya atau privat ditolak: '.parse_url($url, PHP_URL_SCHEME));
}
expectCapability(ProfileEvidenceUrl::isSafe($proof['url']), 'Tautan HTTPS eksternal biasa diterima.');
expectCapability(! Validator::make(['institution_id' => $campus->getKey(), 'skills' => [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'beginner', 'evidence_metadata' => [[...$proof, 'verified' => true, 'contribution_id' => 99]]]]], $rules)->passes(), 'Klien tidak dapat memalsukan verifikasi atau sumber kontribusi.');
expectCapability(! Validator::make(['institution_id' => $campus->getKey(), 'interests' => [$skill->getKey()]], $rules)->passes(), 'Keahlian tidak dapat dipakai sebagai taxonomy minat.');
expectCapability(! Validator::make(['institution_id' => $campus->getKey(), 'skills' => [['taxonomy_id' => $interest->getKey(), 'proficiency' => 'beginner']]], $rules)->passes(), 'Minat tidak dapat dipakai sebagai keahlian.');
expectCapability(! Validator::make(['institution_id' => $campus->getKey(), 'skills' => [['taxonomy_id' => $unverifiedTaxonomy->getKey(), 'proficiency' => 'beginner']]], $rules)->passes(), 'Taxonomy yang tidak canonical ditolak.');
expectCapability(! Validator::make(['skills' => [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'beginner', 'evidence_metadata' => array_fill(0, 11, $proof)]]], (new UpdateStudentProfileRequest)->rules())->passes(), 'Bukti awal maksimal 10 per keahlian.');

$profileSkill = $profile->skills()->first();
$legacy = ['source' => 'legacy', 'private_note' => 'Bukti lama sintetis'];
$profileSkill->forceFill(['evidence_metadata' => $legacy])->save();
$app->make(SyncStudentProfileTaxonomies::class)->handle($profile, [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'intermediate']]);
expectCapability($profileSkill->fresh()->evidence_metadata === $legacy, 'Update tanpa key bukti mempertahankan metadata legacy.');
$app->make(SyncStudentProfileTaxonomies::class)->handle($profile, [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'intermediate', 'evidence_metadata' => []]]);
expectCapability($profileSkill->fresh()->evidence_metadata === [], 'Daftar bukti kosong menghapus hanya setelah perintah eksplisit.');
$app->make(SyncStudentProfileTaxonomies::class)->handle($profile, [['taxonomy_id' => $skill->getKey(), 'proficiency' => 'beginner', 'evidence_metadata' => [$proof]]]);
$projection = $app->make(RebuildTalentCandidateProjection::class)->handle($user, $campus);
expectCapability(! str_contains(json_encode($projection->toArray(), JSON_THROW_ON_ERROR), 'example.org/karya'), 'Bukti awal tidak masuk proyeksi perekrut.');

$task = Task::factory()->create(['project_id' => $project->getKey(), 'created_by_id' => $peer->getKey()]);
$approved = Contribution::factory()->approved()->create(['institution_id' => $campus->getKey(), 'owner_id' => $user->getKey(), 'project_id' => $project->getKey()]);
$version = ContributionVersion::factory()->create(['contribution_id' => $approved->getKey(), 'created_by_id' => $user->getKey(), 'task_id' => $task->getKey(), 'claim' => 'Karya disetujui. Data sintetis']);
$approved->forceFill(['current_version_id' => $version->getKey()])->save();
ContributionReview::factory()->approved()->create(['contribution_version_id' => $version->getKey(), 'reviewer_id' => $peer->getKey()]);
Contribution::factory()->approved()->create(['institution_id' => $campus->getKey(), 'owner_id' => $user->getKey(), 'project_id' => $project->getKey()]);
Contribution::factory()->approved()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey(), 'project_id' => $project->getKey()]);
$context = $workspace->execute($user);
expectCapability(count($context['approvedSources']) === 1 && $context['approvedSources'][0]['id'] === $approved->getKey(), 'Sumber disetujui memerlukan review versi aktual dan milik pengguna dalam tenant aktif.');
expectCapability(! $context['approvedSources'][0]['can_view'], 'Ringkasan sumber tidak memalsukan izin detail setelah tidak menjadi anggota tim.');
expectCapability(array_keys($context['approvedSources'][0]) === ['id', 'title', 'version', 'can_view', 'verification_label'], 'Ringkasan sumber tidak membuka catatan reviewer, URL bukti atau data rekan.');

echo $passed.' pemeriksaan lulus. Seluruh fixture memakai SQLite :memory:, tanpa data aplikasi.'.PHP_EOL;
