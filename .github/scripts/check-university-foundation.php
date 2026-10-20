<?php

declare(strict_types=1);

use App\Actions\Institution\ProvisionFirstUniversityAdmin;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Actions\Institution\UniversityTransitionInventory;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\PhoneNumberStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Exceptions\UniversityProvisioningConflict;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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
    'database.default' => 'university_check',
    'database.connections.university_check' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
    'cache.default' => 'array', 'queue.default' => 'null', 'broadcasting.default' => 'null',
    'university.slug' => 'universitas-teknologi-yogyakarta',
]);
Http::fake();
Http::preventStrayRequests();
if (! app()->environment('testing') || DB::connection()->getName() !== 'university_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan universitas hanya pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function universityCheck(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function universityReject(callable $operation, string $expected, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        universityCheck($error instanceof $expected, $message);

        return;
    }
    throw new RuntimeException($message);
}
function universityCounts(): array
{
    return [Institution::count(), User::count(), PhoneNumber::count(), InstitutionMembership::count(), AuditLog::count()];
}
function universityAccount(string $username): User
{
    $user = User::factory()->create(['username' => $username, 'is_platform_admin' => false]);
    PhoneNumber::factory()->create(['user_id' => $user->id]);

    return $user;
}

$other = Institution::factory()->active()->create(['name' => 'Institusi lain. Data synthetic']);
$university = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta', 'name' => 'Universitas Teknologi Yogyakarta']);
$resolve = $app->make(ResolveConfiguredUniversity::class);
$provision = $app->make(ProvisionFirstUniversityAdmin::class);
$inventory = $app->make(UniversityTransitionInventory::class);
universityCheck($resolve->handle()->is($university), 'Universitas ditentukan dari slug konfigurasi, bukan institusi pertama.');

foreach ([null, '', true, 1, [], ' UTY ', 'uty_test', '../uty'] as $invalid) {
    config()->set('university.slug', $invalid);
    universityReject(fn () => $resolve->handle(), InvalidUniversityConfiguration::class, 'Konfigurasi kosong atau tidak valid ditolak.');
}
config()->set('university.slug', 'universitas-tidak-ada');
universityReject(fn () => $resolve->handle(), InvalidUniversityConfiguration::class, 'Slug yang tidak tersimpan tidak membuka kampus lain.');
config()->set('university.slug', 'universitas-teknologi-yogyakarta');
foreach ([InstitutionStatus::Pending, InstitutionStatus::Suspended, InstitutionStatus::Archived] as $status) {
    $university->update(['status' => $status]);
    universityReject(fn () => $resolve->handle(), InvalidUniversityConfiguration::class, 'Resolver tidak memakai snapshot aktif setelah status berubah.');
}
$university->update(['status' => InstitutionStatus::Active]);
universityCheck($resolve->handle($university)->is($university), 'Institusi yang terikat sesuai target dapat diselesaikan.');
universityReject(fn () => $resolve->handle($other), InvalidUniversityConfiguration::class, 'Institusi lain pada parameter server ditolak.');
universityReject(fn () => $resolve->handle(new Institution(['slug' => $university->slug])), InvalidUniversityConfiguration::class, 'Model institusi yang belum tersimpan bukan bukti konteks.');
$foreignProject = Project::factory()->create(['institution_id' => $other->id]);
$localProject = Project::factory()->create(['institution_id' => $university->id]);
universityCheck($resolve->handle($localProject)->is($university), 'Resource tersimpan diperiksa terhadap universitas sasaran.');
universityReject(fn () => $resolve->handle($foreignProject), InvalidUniversityConfiguration::class, 'Resource institusi lain ditolak.');
$forged = clone $foreignProject;
$forged->institution_id = $university->id;
universityReject(fn () => $resolve->handle($forged), InvalidUniversityConfiguration::class, 'Kepemilikan model yang kotor ditolak.');
$forged->syncOriginal();
universityReject(fn () => $resolve->handle($forged), InvalidUniversityConfiguration::class, 'Pemalsuan snapshot diperiksa ulang terhadap database.');

$watchReads = false;
$mutations = [];
$failAudit = false;
DB::listen(function (QueryExecuted $query) use (&$watchReads, &$mutations, &$failAudit): void {
    $sql = strtolower(trim($query->sql));
    if ($watchReads && preg_match('/^(insert|update|delete|replace|alter|create|drop|truncate)\b/', $sql)) {
        $mutations[] = $query->sql;
    }
    if ($failAudit && str_starts_with($sql, 'insert') && str_contains($sql, '"audit_logs"')) {
        throw new RuntimeException('Gangguan audit synthetic.');
    }
});
$snapshot = universityCounts();
$watchReads = true;
$report = $inventory->handle();
$watchReads = false;
universityCheck($report['configured_institution_id'] === $university->id && count($report['institutions']) === 2, 'Inventaris menunjukkan target serta institusi lama tanpa memindahkan data.');
universityCheck($snapshot === universityCounts() && $mutations === [], 'Inventaris hanya membaca dan tidak mengubah akun atau data.');
universityCheck(! str_contains(json_encode($report), 'password') && ! str_contains(json_encode($report), 'phone'), 'Laporan tidak mengekspos password atau nomor WhatsApp.');
config()->set('university.slug', null);
universityCheck($inventory->handle()['configuration_state'] === 'missing', 'Inventaris melaporkan konfigurasi kosong sebagai terkunci.');
universityCheck(Artisan::call('university:inspect', ['--json' => true]) === 1, 'Command inventaris mengembalikan gagal saat universitas belum dikonfigurasi.');
config()->set('university.slug', $university->slug);

$candidate = universityAccount('admin_awal_uty_synthetic');
$accountBefore = $candidate->fresh()->getAttributes();
$snapshot = universityCounts();
$watchReads = true;
$dry = $provision->handle($candidate->id, 'Pemeriksaan provisioning synthetic.');
$watchReads = false;
universityCheck($dry['status'] === 'dry_run' && $dry['membership_id'] === null, 'Provisioning default menghasilkan dry run tanpa membership.');
universityCheck($snapshot === universityCounts() && $mutations === [], 'Dry run tidak menulis membership, audit atau akun.');

$failAudit = true;
universityReject(fn () => $provision->handle($candidate->id, 'Uji rollback synthetic.', true), RuntimeException::class, 'Gangguan audit membatalkan provisioning.');
$failAudit = false;
universityCheck($snapshot === universityCounts(), 'Kegagalan audit tidak meninggalkan hak admin parsial.');
$created = $provision->handle($candidate->id, 'Provisioning awal untuk uji synthetic.', true);
$membership = InstitutionMembership::findOrFail($created['membership_id']);
$audit = AuditLog::query()->where('operation', 'university.admin.provisioned')->sole();
universityCheck($created['status'] === 'created' && $membership->role === InstitutionMembershipRole::CampusAdmin && $membership->status === InstitutionMembershipStatus::Verified, 'Bootstrap menghasilkan membership admin universitas yang terverifikasi.');
universityCheck($membership->verification_method === null && $membership->reviewed_by_id === null, 'Bootstrap tidak mengarang roster match, undangan atau peninjauan pribadi.');
universityCheck($candidate->fresh()->getAttributes() === $accountBefore && ! $candidate->fresh()->is_platform_admin, 'Password, identitas dan flag platform akun tidak diubah.');
universityCheck($audit->actor_id === null && $audit->after_summary['source'] === 'deployment_cli' && $audit->after_summary['user_id'] === $candidate->id, 'Audit membedakan operasi deployment dari identitas akun sasaran.');
$snapshot = universityCounts();
universityCheck($provision->handle($candidate->id, 'Uji ulang synthetic.', true)['status'] === 'already_admin' && $snapshot === universityCounts(), 'Retry tidak menggandakan membership atau audit.');

$missingPhone = User::factory()->create(['is_platform_admin' => false]);
universityReject(fn () => $provision->handle($missingPhone->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Akun tanpa WhatsApp terverifikasi ditolak.');
$pendingPhone = universityAccount('phone_pending_synthetic');
$pendingPhone->phoneNumbers()->update(['status' => PhoneNumberStatus::Pending, 'verified_at' => null]);
universityReject(fn () => $provision->handle($pendingPhone->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Nomor pending tidak menjadi bukti verifikasi.');
$revokedPhone = universityAccount('phone_revoked_synthetic');
$revokedPhone->phoneNumbers()->update(['status' => PhoneNumberStatus::Revoked, 'verified_at' => null]);
universityReject(fn () => $provision->handle($revokedPhone->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Nomor yang dicabut tidak menjadi bukti verifikasi.');
$legacyPlatform = universityAccount('legacy_platform_synthetic');
$legacyPlatform->forceFill(['is_platform_admin' => true])->save();
universityReject(fn () => $provision->handle($legacyPlatform->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Admin platform lama memerlukan pemetaan U03.');
$foreignCandidate = universityAccount('foreign_membership_synthetic');
InstitutionMembership::factory()->student()->create(['user_id' => $foreignCandidate->id, 'institution_id' => $other->id]);
universityReject(fn () => $provision->handle($foreignCandidate->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Membership institusi lain tidak dimigrasikan otomatis.');
$student = universityAccount('student_membership_synthetic');
InstitutionMembership::factory()->student()->create(['user_id' => $student->id, 'institution_id' => $university->id]);
universityReject(fn () => $provision->handle($student->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Membership mahasiswa tidak ditimpa menjadi admin.');
$suspended = universityAccount('suspended_admin_synthetic');
InstitutionMembership::factory()->campusAdmin()->create(['user_id' => $suspended->id, 'institution_id' => $university->id, 'status' => InstitutionMembershipStatus::Suspended]);
universityReject(fn () => $provision->handle($suspended->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Bootstrap tidak mengaktifkan ulang admin yang ditangguhkan.');
$second = universityAccount('second_admin_synthetic');
universityReject(fn () => $provision->handle($second->id, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'Admin berikutnya memakai undangan, bukan bootstrap berulang.');
universityReject(fn () => $provision->handle(0, 'Uji synthetic.', true), UniversityProvisioningConflict::class, 'ID akun tidak valid ditolak.');
universityReject(fn () => $provision->handle($second->id, str_repeat('a', 1001), true), UniversityProvisioningConflict::class, 'Alasan berlebihan ditolak sebelum perubahan.');
$consoleState = new ReflectionProperty($app, 'isRunningInConsole');
$savedConsoleState = $consoleState->getValue($app);
$consoleState->setValue($app, false);
universityReject(fn () => $provision->handle($second->id, 'Uji synthetic.', true), AuthorizationException::class, 'Provisioning tidak dapat dipanggil dari konteks HTTP.');
$consoleState->setValue($app, $savedConsoleState);

$commandCampus = Institution::factory()->active()->create(['slug' => 'uty-command-synthetic']);
config()->set('university.slug', $commandCampus->slug);
$commandUser = universityAccount('command_admin_synthetic');
$snapshot = universityCounts();
universityCheck(Artisan::call('university:provision-admin', ['--user' => (string) $commandUser->id, '--reason' => 'Uji command synthetic.']) === 0 && $snapshot === universityCounts(), 'Command default hanya dry run.');
universityCheck(Artisan::call('university:provision-admin', ['--user' => '1e3', '--reason' => 'Uji synthetic.', '--apply' => true]) === 1, 'Command menolak ID yang akan terpotong oleh konversi integer.');
universityCheck(Artisan::call('university:provision-admin', ['--user' => (string) $commandUser->id, '--reason' => 'Uji command synthetic.', '--apply' => true]) === 0, 'Command --apply memprovisikan admin pertama.');
universityCheck(Artisan::call('university:inspect', ['--json' => true]) === 0 && json_decode(Artisan::output(), true)['configured_institution_id'] === $commandCampus->id, 'Inventaris JSON memakai target aktual tanpa fallback.');
universityCheck(Http::recorded()->count() === 0, 'Provisioning dan inventaris tidak mengirim HTTP atau OTP.');
echo $passed.' pemeriksaan fondasi universitas lulus. Seluruh fixture SQLite di memori.'.PHP_EOL;
