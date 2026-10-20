<?php

declare(strict_types=1);

use App\Enums\InstitutionMembershipStatus;
use App\Http\Controllers\UniversityStudentController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\InstitutionalIdentifier;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

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
    'database.default' => 'affiliation_privacy_check',
    'database.connections.affiliation_privacy_check' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
    'cache.default' => 'array', 'queue.default' => 'null', 'session.driver' => 'array', 'broadcasting.default' => 'null',
    'university.slug' => 'universitas-teknologi-yogyakarta',
]);
Http::fake();
Http::preventStrayRequests();
Queue::fake();
if (! app()->environment('testing') || DB::connection()->getName() !== 'affiliation_privacy_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan privasi hanya memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function privacyCheck(bool $ok, string $message): void
{
    global $passed;
    if (! $ok) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function reviewRead(?User $actor, Institution $institution, bool $partial = true): Response
{
    Auth::forgetGuards();
    if ($actor !== null) {
        Auth::guard('web')->setUser($actor);
    }
    $request = Request::create(route('campus.affiliations.index', $institution), 'GET');
    $request->headers->set('Accept', 'application/json');
    $request->headers->set('X-Inertia', 'true');
    $request->headers->set('X-Inertia-Version', app(HandleInertiaRequests::class)->version($request) ?? '');
    if ($partial) {
        $request->headers->set('X-Inertia-Partial-Component', 'campus/affiliations');
        $request->headers->set('X-Inertia-Partial-Data', 'reviewQueue');
    }

    return app(HttpKernel::class)->handle($request);
}
$campus = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta', 'name' => 'UTY. Data synthetic']);
$other = Institution::factory()->active()->create();
$admin = User::factory()->create();
$adminMembership = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $admin->id]);
$student = User::factory()->create();
$phone = PhoneNumber::factory()->forNumber('+6281399400088')->create(['user_id' => $student->id]);
$nim = '2023994001';
$application = AffiliationRequest::factory()->create(['institution_id' => $campus->id, 'user_id' => $student->id, 'nim' => $nim, 'nim_hash' => InstitutionalIdentifier::hash($nim), 'review_locked_by_id' => $admin->id, 'review_locked_at' => now(), 'review_lock_expires_at' => now()->addMinutes(5)]);
$withoutPhone = User::factory()->create();
$withoutPhoneApplication = AffiliationRequest::factory()->create(['institution_id' => $campus->id, 'user_id' => $withoutPhone->id]);
$foreignStudent = User::factory()->create();
$foreignPhone = PhoneNumber::factory()->forNumber('+6281399400099')->create(['user_id' => $foreignStudent->id]);
$foreignApplication = AffiliationRequest::factory()->create(['institution_id' => $other->id, 'user_id' => $foreignStudent->id]);
$foreignAdmin = User::factory()->create();
InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $other->id, 'user_id' => $foreignAdmin->id]);
$legacyAdmin = User::factory()->create(['is_platform_admin' => true]);
$outsider = User::factory()->create();
$writes = [];
DB::listen(function (QueryExecuted $query) use (&$writes): void {
    if (preg_match('/^\s*(insert|update|delete|replace)\b/i', $query->sql)) {
        $writes[] = true;
    }
});
$response = reviewRead($admin, $campus);
privacyCheck($response->getStatusCode() === 200, 'Admin berwenang membaca respons deferred melalui middleware dan Form Request aktual. HTTP '.$response->getStatusCode());
$page = json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR);
$items = collect($page['props']['reviewQueue']['items']);
$item = $items->firstWhere('id', $application->id);
privacyCheck($item['nim'] === $nim && $item['phone'] === $phone->number, 'Antrean mengirim NIM dan WhatsApp lengkap yang berasal dari database.');
privacyCheck($item['lock']['ownedByCurrentUser'] === true && ! array_key_exists('owner', $item['lock']), 'Proyeksi mempertahankan kunci tanpa username peninjau.');
privacyCheck(! array_key_exists('username', $item) && ! array_key_exists('nim_hash', $item) && ! array_key_exists('number_hash', $item), 'Allowlist tidak memperluas username atau hash identitas.');
privacyCheck($items->firstWhere('id', $withoutPhoneApplication->id)['phone'] === null, 'Nomor yang tidak tersedia tetap null.');
privacyCheck(! $items->contains('id', $foreignApplication->id) && ! str_contains($response->getContent(), $foreignPhone->number), 'Antrean tidak memuat identitas dari institusi lain.');
privacyCheck($writes === [], 'Pembacaan antrean tidak membuat data atau audit baru.');
privacyCheck(! array_key_exists('nim', $application->fresh()->toArray()) && ! array_key_exists('number', $phone->fresh()->toArray()), 'Hidden model tetap melindungi serialisasi umum.');
privacyCheck(DB::table('affiliation_requests')->where('id', $application->id)->value('nim') !== $nim && DB::table('phone_numbers')->where('id', $phone->id)->value('number') !== $phone->number, 'NIM dan nomor tetap terenkripsi dalam penyimpanan.');
$initial = reviewRead($admin, $campus, false);
$initialPage = json_decode($initial->getContent(), true, flags: JSON_THROW_ON_ERROR);
privacyCheck(! isset($initialPage['props']['reviewQueue']) && ! str_contains($initial->getContent(), $nim) && ! str_contains($initial->getContent(), $phone->number), 'Payload awal tidak menduplikasi data deferred ke shared props.');
foreach ([[$student, $campus], [$outsider, $campus], [$legacyAdmin, $campus], [$foreignAdmin, $campus], [$admin, $other], [$foreignAdmin, $other], [null, $campus]] as [$actor, $institution]) {
    $denied = reviewRead($actor, $institution);
    privacyCheck(in_array($denied->getStatusCode(), [401, 403], true), 'Akses mahasiswa, non-admin, tenant lain, flag lama atau tamu ditolak server.');
    privacyCheck(! str_contains($denied->getContent(), $nim) && ! str_contains($denied->getContent(), $phone->number), 'Respons penolakan tidak membawa identitas lengkap dari antrean.');
}
$adminMembership->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
$denied = reviewRead($admin, $campus);
privacyCheck($denied->getStatusCode() === 403 && ! str_contains($denied->getContent(), $phone->number), 'Pencabutan akses admin segera menghentikan pembacaan berikutnya.');
$adminMembership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
Inertia::flushShared();
$directoryRequest = Request::create('/directory-check', 'GET');
$directoryRequest->setUserResolver(fn () => $admin);
$directoryRequest->headers->set('X-Inertia', 'true');
$directory = app(UniversityStudentController::class)->index($directoryRequest, $campus)->toResponse($directoryRequest)->getContent();
privacyCheck(! str_contains($directory, $nim) && ! str_contains($directory, $phone->number), 'Direktori Mahasiswa tetap tidak memuat NIM atau WhatsApp lengkap.');
echo $passed.' pemeriksaan privasi afiliasi lulus. Data synthetic pada SQLite :memory:, tanpa mutasi database pengguna.'.PHP_EOL;
