<?php

declare(strict_types=1);

use App\Actions\Institution\IssueInvitation;
use App\Http\Controllers\PlatformSkillTaxonomyController;
use App\Http\Controllers\UniversityAdminController;
use App\Http\Controllers\UniversitySettingsController;
use App\Http\Controllers\UniversityStudentController;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
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
config()->set([
    'database.default' => 'university_workspace_check',
    'database.connections.university_workspace_check' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
    'cache.default' => 'array', 'queue.default' => 'null', 'session.driver' => 'array', 'broadcasting.default' => 'null',
    'university.slug' => 'universitas-teknologi-yogyakarta',
]);
Http::fake();
Http::preventStrayRequests();
Queue::fake();
if (! app()->environment('testing') || DB::connection()->getName() !== 'university_workspace_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan workspace hanya pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function workspaceCheck(bool $ok, string $message): void
{
    global $passed;
    if (! $ok) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function workspaceRequest(User $actor, array $query = []): Request
{
    $request = Request::create('/workspace-check', 'GET', $query);
    $request->headers->set('Accept', 'application/json');
    $request->setUserResolver(fn () => $actor);

    return $request;
}
function workspaceProps(Response $response, Request $request): array
{
    $request->headers->set('X-Inertia', 'true');

    return $response->toResponse($request)->getData(true)['props'];
}
$campus = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta', 'name' => 'UTY. Data synthetic', 'settings' => ['private_provider_token' => 'never-project-this']]);
$other = Institution::factory()->active()->create();
$admin = User::factory()->create(['name' => 'Admin. Data synthetic']);
PhoneNumber::factory()->create(['user_id' => $admin->id]);
$adminMembership = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $admin->id]);
$student = User::factory()->create(['name' => 'Pemula. Data synthetic']);
InstitutionMembership::factory()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $student->id]);
$noWork = User::factory()->create(['name' => 'Tanpa karya. Data synthetic']);
InstitutionMembership::factory()->pending()->create(['institution_id' => $campus->id, 'user_id' => $noWork->id]);
$foreign = User::factory()->create(['name' => 'Foreign synthetic']);
InstitutionMembership::factory()->verifiedByCampusAdmin()->create(['institution_id' => $other->id, 'user_id' => $foreign->id]);
$profile = StudentProfile::factory()->create(['institution_id' => $campus->id, 'user_id' => $student->id, 'bio' => 'private-bio-never-project']);
$foreignProfile = StudentProfile::factory()->create(['institution_id' => $other->id, 'user_id' => $foreign->id]);
$skill = SkillTaxonomy::factory()->create();
ProfileSkill::factory()->create(['student_profile_id' => $profile->id, 'skill_taxonomy_id' => $skill->id]);
ProfileSkill::factory()->create(['student_profile_id' => $foreignProfile->id, 'skill_taxonomy_id' => $skill->id]);
InstitutionRoster::factory()->create(['institution_id' => $campus->id, 'semester' => '2026-ganjil']);
InstitutionRoster::factory()->create(['institution_id' => $other->id, 'semester' => 'semester-foreign-private']);
$invitation = $app->make(IssueInvitation::class)->handle($admin, $campus, '+6281399400077', 'campus_admin');
PrivilegedInvitation::factory()->create(['institution_id' => $other->id]);
$legacy = User::factory()->create(['is_platform_admin' => true]);
$request = workspaceRequest($admin);
$writes = [];
DB::listen(function (QueryExecuted $query) use (&$writes): void {
    if (preg_match('/^\s*(insert|update|delete|replace)\b/i', $query->sql)) {
        $writes[] = $query->sql;
    }
});
$directory = $app->make(UniversityStudentController::class);
$settings = $app->make(UniversitySettingsController::class);
$accounts = $app->make(UniversityAdminController::class);
$catalog = $app->make(PlatformSkillTaxonomyController::class);
$props = workspaceProps($directory->index($request, $campus), $request);
workspaceCheck($props['students']['total'] === 2, 'Mahasiswa tanpa karya tetap masuk daftar, admin dan kampus lain tidak.');
$serialized = json_encode($props);
foreach (['username', 'institutional_identifier', 'phone', 'bio', 'private-bio-never-project', 'evidence', 'Foreign synthetic', 'password'] as $private) {
    workspaceCheck(! str_contains($serialized, $private), 'Direktori tidak memproyeksikan '.$private.'.');
}
$query = workspaceRequest($admin, ['q' => 'Tanpa karya', 'status' => 'pending']);
$filtered = workspaceProps($directory->index($query, $campus), $query);
workspaceCheck($filtered['students']['total'] === 1 && $filtered['students']['data'][0]['name'] === $noWork->name, 'Nama dan status difilter server, tanpa wajib profil/karya.');
$request = workspaceRequest($admin);
$props = workspaceProps($settings->index($request, $campus), $request);
workspaceCheck($props['rosters']['total'] === 1 && $props['rosters']['data'][0]['semester'] === '2026-ganjil', 'Semester hanya membaca roster universitas sasaran.');
foreach (['never-project-this', 'settings', 'source_filename', 'checksum', 'semester-foreign-private'] as $private) {
    workspaceCheck(! array_key_exists($private, $props['institution']) && ! str_contains(json_encode($props['rosters']), $private) && ! str_contains(json_encode($props['institution']), $private), 'Pengaturan tidak membuka '.$private.'.');
}
$request = workspaceRequest($admin);
$list = $accounts->index($request, $campus)->getData(true);
workspaceCheck(count($list['data']) === 1 && $list['invitations']['total'] === 1, 'JSON admin dan undangan tetap scoped dan kompatibel.');
workspaceCheck($list['invitations']['data'][0]['phone_masked'] !== $invitation->phone && ! str_contains(json_encode($list), $invitation->phone), 'Nomor undangan hanya masked.');
foreach (['token_hash', 'audit_reference', 'revoke_reason', 'username', 'password'] as $private) {
    workspaceCheck(! str_contains(json_encode($list), $private), 'Allowlist admin/undangan tidak membuka '.$private.'.');
}
$request->headers->set('X-Inertia', 'true');
workspaceCheck($accounts->index($request, $campus) instanceof Response, 'Kunjungan browser/Inertia membuka halaman akun admin, bukan JSON mentah.');
$request = workspaceRequest($admin);
$props = workspaceProps($catalog->index($request), $request);
$listedSkill = collect($props['skills'])->firstWhere('id', $skill->id);
workspaceCheck($listedSkill['profileSkillsCount'] === 1, 'Penggunaan katalog tidak mengagregasi profil kampus lain.');
workspaceCheck($writes === [], 'Semua GET workspace tidak membuat data default, grant atau audit.');
try {
    $catalog->destroy(workspaceRequest($admin), $skill);
    throw new RuntimeException('Istilah terpakai terhapus.');
} catch (ValidationException) {
    workspaceCheck(ProfileSkill::query()->where('skill_taxonomy_id', $skill->id)->count() === 2 && $skill->fresh() !== null, 'Penghapusan istilah terpakai ditolak tanpa menghapus kemampuan mahasiswa.');
}
$interestSkill = SkillTaxonomy::factory()->create();
ProfileInterest::factory()->create(['student_profile_id' => $profile->id, 'skill_taxonomy_id' => $interestSkill->id]);
try {
    $catalog->destroy(workspaceRequest($admin), $interestSkill);
    throw new RuntimeException('Minat mahasiswa terhapus melalui katalog.');
} catch (ValidationException) {
    workspaceCheck($interestSkill->fresh() !== null, 'Minat pemula juga dilindungi dari penghapusan istilah.');
}
$operations = [fn (Request $req, Institution $institution) => $directory->index($req, $institution), fn (Request $req, Institution $institution) => $settings->index($req, $institution), fn (Request $req, Institution $institution) => $accounts->index($req, $institution)];
foreach ($operations as $i => $operation) {
    foreach ([[$student, $campus], [$legacy, $campus], [$admin, $other], [$foreign, $other]] as [$actor, $institution]) {
        try {
            $operation(workspaceRequest($actor), $institution);
            throw new RuntimeException('Akses tidak sah berhasil.');
        } catch (AuthorizationException|HttpException) {
            workspaceCheck(true, 'Surface '.$i.' menolak role/tenant yang tidak sah.');
        }
    }
}
$adminMembership->forceFill(['status' => 'suspended'])->save();
foreach ($operations as $i => $operation) {
    try {
        $operation(workspaceRequest($admin), $campus);
        throw new RuntimeException('Admin suspended masih membaca.');
    } catch (AuthorizationException|HttpException) {
        workspaceCheck(true, 'Surface '.$i.' menolak akses yang sudah ditangguhkan.');
    }
}
workspaceCheck(Http::recorded()->isEmpty(), 'Pemeriksaan tidak mengirim WhatsApp/OTP/provider nyata.');
echo $passed.' pemeriksaan workspace universitas lulus. Fixture terisolasi di memori.'.PHP_EOL;
