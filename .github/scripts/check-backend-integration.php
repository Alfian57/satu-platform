<?php

declare(strict_types=1);

use App\Actions\Integration\CreateIntegrationConnection;
use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\User\ExportUserData;
use App\Enums\RecruiterEntitlementScope;
use App\Http\Controllers\DataRightsController;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
config()->set('database.default', 'integration_check');
config()->set('database.connections.integration_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
config()->set('broadcasting.default', 'null');
if (DB::connection()->getName() !== 'integration_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian hanya diizinkan pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function expectIntegration(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function integrationProps(Inertia\Response $response): array
{
    return (new ReflectionProperty($response, 'props'))->getValue($response);
}
expectIntegration(Model::preventsLazyLoading(), 'Proteksi lazy loading dari backend tetap aktif.');
expectIntegration(Schema::hasColumn('users', 'remember_token') && Schema::hasColumn('inclusion_signals', 'is_synthetic'), 'Migration asli menyediakan kolom backend terbaru.');
$candidate = User::factory()->create();
$recruiter = User::factory()->create();
$admin = User::factory()->create(['is_platform_admin' => false]);
$campus = Institution::factory()->active()->create();
config()->set('university.slug', $campus->slug);
config()->set('university.advanced_administration.recruiter', true);
InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['user_id' => $admin->id, 'institution_id' => $campus->id]);
$organization = RecruiterOrganization::factory()->verified()->create();
RecruiterMembership::factory()->create(['user_id' => $recruiter->id, 'recruiter_organization_id' => $organization->id]);
try {
    $app->make(GrantRecruiterEntitlement::class)->execute($admin, $organization, RecruiterEntitlementScope::CandidateSearch, Illuminate\Support\Carbon::now()->subMinute());
    throw new RuntimeException('Role perekrut yang sudah dihapus mendapat hak baru.');
} catch (AuthorizationException) {
    expectIntegration(true, 'Konfigurasi perekrut lama tidak dapat menerbitkan hak akses baru.');
}
$phone = PhoneNumber::factory()->forNumber('+6281200000099')->create(['user_id' => $candidate->id]);
$projection = TalentCandidateProjection::factory()->create(['user_id' => $candidate->id, 'institution_id' => $campus->id]);
App\Models\RecruiterEntitlement::query()->create(['recruiter_organization_id' => $organization->id, 'scope' => RecruiterEntitlementScope::FullSuite, 'status' => 'active', 'starts_at' => now()->subDay(), 'ends_at' => null, 'issuer_id' => $admin->id, 'reason' => 'Riwayat synthetic untuk uji penutupan role.']);
expectIntegration(! $app->make(App\Actions\Recruiter\VerifyRecruiterEntitlement::class)->check($organization, RecruiterEntitlementScope::CandidateSearch), 'Entitlement perekrut selalu ditolak pada sistem dua role.');
expectIntegration($app->make(App\Actions\Auth\ResolveUserWorkspace::class)->handle($recruiter)->role === App\Enums\WorkspaceRole::Student, 'Membership perekrut historis tidak menjadi role aktif.');
foreach (['recruiter.talent.search', 'recruiter.talent.candidates.show', 'recruiter.talent.contact-requests.index', 'student.contact-requests.index'] as $name) {
    expectIntegration(! Illuminate\Support\Facades\Route::has($name), 'Rute historis '.$name.' tidak lagi terdaftar.');
}
$roles = array_map(fn (App\Enums\WorkspaceRole $role): string => $role->value, App\Enums\WorkspaceRole::cases());
sort($roles);
expectIntegration($roles === ['campus_admin', 'student'], 'Enum workspace tepat dua role, tanpa perekrut atau admin platform.');
$legacy = User::factory()->create(['is_platform_admin' => true]);
$workspaceResolver = $app->make(App\Actions\Auth\ResolveUserWorkspace::class);
expectIntegration($workspaceResolver->handle($legacy)->role === App\Enums\WorkspaceRole::Student, 'Flag historis platform tidak membuat role atau hak akses.');
expectIntegration($workspaceResolver->handle($admin)->role === App\Enums\WorkspaceRole::CampusAdmin, 'Admin Universitas tetap berasal dari membership UTY aktual.');
foreach ([$admin, $recruiter, $candidate] as $actor) {
    $gate = Illuminate\Support\Facades\Gate::forUser($actor);
    $membership = $organization->memberships()->firstOrFail();
    expectIntegration(! $gate->allows('view', $organization) && ! $gate->allows('update', $organization) && ! $gate->allows('review', $organization), 'Policy organisasi lama tidak memberi akses kepada role mana pun.');
    expectIntegration(! $gate->allows('create', [RecruiterMembership::class, $organization->id]) && ! $gate->allows('view', $membership) && ! $gate->allows('update', $membership) && ! $gate->allows('delete', $membership), 'Membership arsip tidak dapat dipakai untuk membaca atau menerbitkan role tambahan.');
}
expectIntegration(array_keys($workspaceResolver->handle($recruiter)->toArray()) === ['role', 'institution'], 'Payload workspace tidak menyertakan organisasi perekrut.');
config()->set('session.driver', 'array');
foreach ([$admin, $candidate, $recruiter, $legacy] as $actor) {
    foreach ([
        ['GET', '/recruiter/talent/search'], ['GET', '/recruiter/talent/saved'],
        ['GET', '/recruiter/talent/candidates/1'], ['GET', '/recruiter/talent/contact-requests'],
        ['POST', '/recruiter/talent/candidates/1/save'], ['DELETE', '/recruiter/talent/candidates/1/unsave'],
        ['POST', '/recruiter/talent/candidates/1/contact'], ['DELETE', '/recruiter/talent/contact-requests/1'],
        ['GET', '/student/contact-requests'], ['POST', '/student/contact-requests/1/accept'],
        ['POST', '/student/contact-requests/1/decline'],
        ['POST', '/platform/recruiter-organizations/1/review'],
        ['POST', '/platform/recruiter-organizations/1/entitlements'],
        ['POST', '/platform/recruiter-entitlements/1/revoke'],
    ] as [$method, $uri]) {
        Illuminate\Support\Facades\Auth::forgetGuards();
        Illuminate\Support\Facades\Auth::guard('web')->setUser($actor);
        $retiredRequest = Request::create($uri, $method);
        $retiredRequest->headers->set('Accept', 'application/json');
        $retiredResponse = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle($retiredRequest);
        expectIntegration($retiredResponse->getStatusCode() === 404, 'Endpoint role yang dihapus tidak dapat dipakai: '.$method.' '.$uri);
    }
}
$visibilityRules = (new App\Http\Requests\Profile\UpdateStudentProfileVisibilityRequest)->rules();
expectIntegration(Illuminate\Support\Facades\Validator::make(['portfolio_visibility' => 'recruiter'], $visibilityRules)->fails(), 'Permintaan berbagi ke role perekrut ditolak server.');
expectIntegration(Illuminate\Support\Facades\Validator::make(['recruiter_discoverable' => true], $visibilityRules)->fails(), 'Pencarian perekrut tidak dapat diaktifkan melalui payload tersembunyi.');
expectIntegration(Illuminate\Support\Facades\Validator::make(['portfolio_visibility' => 'private', 'recruiter_discoverable' => false, 'expected_privacy_revision' => str_repeat('a', 64)], $visibilityRules)->passes(), 'Berbagi privat tetap valid tanpa role tambahan.');
$personal = Request::create('/account/data-rights/export', 'POST');
$personal->setUserResolver(fn () => $candidate);
$accountPage = $app->make(App\Http\Controllers\Settings\ProfileController::class);
$personal->setLaravelSession($app->make('session')->driver());
expectIntegration(integrationProps($accountPage->edit($personal))['account']['username'] === $candidate->username, 'Username privat tersedia hanya pada formulir akun pemilik, bukan shared projection.');
$export = $app->make(DataRightsController::class)->export($personal, $app->make(ExportUserData::class));
expectIntegration($export->getStatusCode() === 200 && $export->headers->has('Content-Disposition'), 'Ekspor mengembalikan JSON unduhan, bukan halaman Inertia.');
expectIntegration(! str_contains($export->getContent(), $phone->number) && ! str_contains($export->getContent(), 'password'), 'Ekspor tidak membocorkan password atau nomor WhatsApp utuh.');
$deleteParameter = (new ReflectionMethod(DataRightsController::class, 'delete'))->getParameters()[0];
expectIntegration((string) $deleteParameter->getType() === ProfileDeleteRequest::class && isset((new ProfileDeleteRequest)->rules()['password']), 'Endpoint hapus baru memakai validasi password yang sama dengan pengaturan profil.');
$operator = User::factory()->create();
InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['user_id' => $operator->id, 'institution_id' => $campus->id]);
$connection = $app->make(CreateIntegrationConnection::class)->execute($operator, $campus, 'synthetic_sandbox');
expectIntegration($connection->mode->value === 'sandbox', 'Operator berwenang membuat koneksi sandbox secara eksplisit.');
try {
    $app->make(CreateIntegrationConnection::class)->execute($candidate, $campus, 'not_allowed');
    throw new RuntimeException('Mahasiswa tidak boleh membuat koneksi akademik.');
} catch (AuthorizationException) {
    expectIntegration(true, 'Mahasiswa tidak mendapat izin operator melalui merge.');
}
echo $passed.' pemeriksaan integrasi backend lulus. Seluruh fixture SQLite di memori.'.PHP_EOL;
