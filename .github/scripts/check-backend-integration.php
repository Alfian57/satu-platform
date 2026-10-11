<?php

declare(strict_types=1);

use App\Actions\Consent\ConsentRecorder;
use App\Actions\Integration\CreateIntegrationConnection;
use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\User\ExportUserData;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Http\Controllers\DataRightsController;
use App\Http\Controllers\RecruiterContactRequestController;
use App\Http\Controllers\TalentSearchController;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\RecruiterContactRequest;
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
$admin = User::factory()->create(['is_platform_admin' => true]);
$campus = Institution::factory()->active()->create();
$organization = RecruiterOrganization::factory()->verified()->create();
RecruiterMembership::factory()->create(['user_id' => $recruiter->id, 'recruiter_organization_id' => $organization->id]);
$entitlement = $app->make(GrantRecruiterEntitlement::class)->execute($admin, $organization, RecruiterEntitlementScope::CandidateSearch, Illuminate\Support\Carbon::now()->subMinute());
$phone = PhoneNumber::factory()->forNumber('+6281200000099')->create(['user_id' => $candidate->id]);
$projection = TalentCandidateProjection::factory()->create(['user_id' => $candidate->id, 'institution_id' => $campus->id]);
$contact = RecruiterContactRequest::factory()->create([
    'recruiter_organization_id' => $organization->id, 'recruiter_user_id' => $recruiter->id,
    'candidate_user_id' => $candidate->id, 'talent_candidate_projection_id' => $projection->id,
]);
$consent = $app->make(ConsentRecorder::class);
$request = Request::create('/recruiter/talent/contact-requests');
$request->setUserResolver(fn () => $recruiter);
$contacts = $app->make(RecruiterContactRequestController::class);
$talent = $app->make(TalentSearchController::class);
expectIntegration(integrationProps($contacts->index($request))['requests']->first()['candidate_phone'] === null, 'Permintaan pending tidak membuka nomor kontak.');
$contact->update(['status' => ContactRequestStatus::Accepted, 'responded_at' => now()]);
expectIntegration(integrationProps($contacts->index($request))['requests']->first()['candidate_phone'] === null, 'Status accepted tanpa consent aktual tidak membuka kontak.');
$consent->grant($candidate, 'contact.handoff', 'v1', 'student.contact_response');
DB::enableQueryLog();
expectIntegration(integrationProps($contacts->index($request))['requests']->first()['candidate_phone'] === $phone->number, 'Riwayat menampilkan handoff yang disetujui dan berhak akses.');
expectIntegration(integrationProps($talent->show($request, $projection->id))['candidate']['phone'] === $phone->number, 'Detail menggunakan handoff yang sama tanpa menghapus desain lokal.');
foreach (DB::getQueryLog() as $query) {
    expectIntegration(str_starts_with(strtolower(trim($query['query'])), 'select'), 'GET handoff tetap baca-saja.');
}
DB::disableQueryLog();
$consent->withdraw($candidate, 'contact.handoff', 'v1', 'test.integration');
expectIntegration(! isset(integrationProps($talent->show($request, $projection->id))['candidate']['phone']), 'Pencabutan consent menyembunyikan nomor pada pembacaan berikutnya.');
$consent->grant($candidate, 'contact.handoff', 'v1', 'student.contact_response');
$projection->update(['is_visible' => false]);
expectIntegration(integrationProps($contacts->index($request))['requests']->first()['candidate_phone'] === null, 'Visibility ditarik menghentikan exposure kontak pada riwayat.');
$projection->update(['is_visible' => true]);
$entitlement->update(['status' => RecruiterEntitlementStatus::Revoked]);
expectIntegration(integrationProps($contacts->index($request))['requests']->first()['candidate_phone'] === null, 'Hak akses dicabut tetap mempertahankan riwayat tanpa nomor privat.');
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
