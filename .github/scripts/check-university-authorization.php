<?php

declare(strict_types=1);

use App\Actions\Auth\ResolveUserWorkspace;
use App\Actions\Institution\AcceptInvitation;
use App\Actions\Institution\ApproveInstitution;
use App\Actions\Institution\ChangeUniversityAdminStatus;
use App\Actions\Institution\IssueInvitation;
use App\Actions\Institution\MapUniversityAdmin;
use App\Actions\Institution\RevokeInvitation;
use App\Actions\Institution\SuspendInstitution;
use App\Actions\InstitutionMemberships\TransitionInstitutionMembership;
use App\Actions\User\DeleteUserAccount;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\InvitationStatus;
use App\Enums\MessageStatus;
use App\Enums\WorkspaceRole;
use App\Exceptions\InvalidInstitutionMembershipTransition;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Exceptions\UniversityProvisioningConflict;
use App\Http\Controllers\PlatformAffiliationController;
use App\Http\Controllers\PlatformOperationsController;
use App\Http\Controllers\UniversityAdminController;
use App\Http\Middleware\EnsureUniversityAdministration;
use App\Jobs\SendWhatsAppMessage;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchScoreVersion;
use App\Models\MessageOutbox;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ContributionSubmittedNotification;
use App\Support\Auth\UniversityAdminRevision;
use App\Support\Notification\WhatsAppGateway;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
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
config()->set([
    'database.default' => 'university_authorization_check',
    'database.connections.university_authorization_check' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
    'cache.default' => 'array', 'queue.default' => 'null', 'broadcasting.default' => 'null',
    'session.driver' => 'array', 'university.slug' => 'universitas-teknologi-yogyakarta',
    'university.advanced_administration' => ['recruiter' => false, 'gamification' => false],
    'filesystems.disks.private' => ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-admin-check-'.Str::uuid(), 'throw' => true],
]);
Storage::forgetDisk('private');
Http::fake();
Http::preventStrayRequests();
Queue::fake();
if (! app()->environment('testing') || DB::connection()->getName() !== 'university_authorization_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan admin hanya pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function adminCheck(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function adminReject(callable $operation, string $expected, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        if (! $error instanceof $expected) {
            throw $error;
        }
        adminCheck(true, $message);

        return;
    }
    throw new RuntimeException($message);
}
function adminAccount(bool $legacy = false): User
{
    $user = User::factory()->create(['is_platform_admin' => $legacy]);
    PhoneNumber::factory()->create(['user_id' => $user->id]);

    return $user;
}
$campus = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta']);
$other = Institution::factory()->active()->create();
$primary = adminAccount();
$secondary = adminAccount();
$legacy = adminAccount(true);
$student = adminAccount();
$foreign = adminAccount();
$first = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $primary->id]);
$second = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $secondary->id]);
$foreignMembership = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $other->id, 'user_id' => $foreign->id]);
$workspace = $app->make(ResolveUserWorkspace::class);
adminCheck($primary->isUniversityAdmin() && $secondary->isUniversityAdmin(), 'Dua akun UTY memperoleh role dari membership yang sama.');
adminCheck(! $legacy->isUniversityAdmin() && ! $foreign->isUniversityAdmin() && ! $student->isUniversityAdmin(), 'Flag platform, admin kampus lain dan mahasiswa tidak menjadi Admin Universitas.');
adminCheck($workspace->handle($primary)->role === WorkspaceRole::CampusAdmin && $workspace->handle($primary)->institutionId === $campus->id, 'Tujuan login admin mengarah pada universitas yang dikonfigurasi.');
adminCheck($workspace->handle($legacy)->role === WorkspaceRole::Student && $workspace->handle($foreign)->role === WorkspaceRole::Student, 'Akun lama tanpa pemetaan tidak mendapat workspace platform atau kampus lain.');
adminCheck($workspace->handle($primary, $other)->institutionId === null, 'Parameter route lain tidak mengganti universitas admin.');
adminCheck(Gate::forUser($primary)->allows('create', MatchScoreVersion::class) && Gate::forUser($legacy)->denies('create', MatchScoreVersion::class), 'Pengelolaan versi pencocokan berpindah ke admin UTY, bukan flag global.');
$primary->load('institutionMemberships');
$secondary->load('institutionMemberships');
$change = $app->make(ChangeUniversityAdminStatus::class);
$issue = $app->make(IssueInvitation::class);
$invitation = $issue->handle($secondary, $campus, '+6281399400099', 'campus_admin');
$outbox = MessageOutbox::query()->sole();
$oldRevision = UniversityAdminRevision::make($second->fresh());
$change->handle($primary, $second, InstitutionMembershipStatus::Suspended, $oldRevision, 'Penangguhan synthetic.');
adminCheck(! $secondary->isUniversityAdmin() && $workspace->handle($secondary)->role === WorkspaceRole::Student, 'Pencabutan diperiksa ulang tanpa memakai relasi atau workspace cache.');
adminCheck($invitation->fresh()->status === InvitationStatus::Revoked, 'Penangguhan admin mencabut undangan yang masih menunggu.');
$app->make(SendWhatsAppMessage::class, ['outboxId' => $outbox->id])->handle($app->make(WhatsAppGateway::class));
adminCheck($outbox->fresh()->status === MessageStatus::Cancelled && Http::recorded()->isEmpty(), 'Pekerjaan antrean yang lama membatalkan kirim undangan setelah akses dicabut.');
adminReject(fn () => $issue->handle($secondary, $campus, '+6281399400098', 'campus_admin'), AuthorizationException::class, 'Admin suspended tidak membuat undangan baru.');
adminReject(fn () => $change->handle($primary, $first, InstitutionMembershipStatus::Suspended, UniversityAdminRevision::make($first->fresh()), 'Uji admin terakhir.'), ValidationException::class, 'Admin aktif terakhir tidak dapat ditangguhkan.');
adminReject(fn () => $app->make(DeleteUserAccount::class)->handle($primary), ValidationException::class, 'Penghapusan akun mandiri tidak melewati proteksi admin terakhir.');
adminCheck($primary->fresh()->name === $primary->name && $primary->isUniversityAdmin(), 'Penolakan penghapusan tidak meninggalkan akun atau izin parsial.');
adminReject(fn () => $app->make(TransitionInstitutionMembership::class)->handle($first, InstitutionMembershipStatus::Suspended), InvalidInstitutionMembershipTransition::class, 'Transisi afiliasi lama tidak menjadi bypass pengelolaan admin.');
adminReject(fn () => $change->handle($primary, $second, InstitutionMembershipStatus::Verified, $oldRevision, 'Pemulihan synthetic.'), ConflictHttpException::class, 'Keputusan dari revision lama ditolak.');
$change->handle($primary, $second, InstitutionMembershipStatus::Verified, UniversityAdminRevision::make($second->fresh()), 'Pemulihan synthetic.');
adminCheck($secondary->isUniversityAdmin(), 'Pemulihan memakai keputusan baru dan WhatsApp terverifikasi.');
adminReject(fn () => $change->handle($primary, $second, InstitutionMembershipStatus::Suspended, $oldRevision, 'Uji ABA synthetic.'), ConflictHttpException::class, 'Audit membedakan status yang kembali sama dalam detik yang sama.');
adminReject(fn () => $change->handle($primary, $foreignMembership, InstitutionMembershipStatus::Suspended, UniversityAdminRevision::make($foreignMembership->fresh()), 'Uji kampus lain.'), InvalidUniversityConfiguration::class, 'Pengelolaan admin lintas kampus ditolak.');
$request = Request::create('/platform');
$request->setUserResolver(fn () => $primary);
adminCheck($app->make(PlatformOperationsController::class)->index($request)->getTargetUrl() === route('campus.overview.show', $campus), 'GET platform lama beralih ke ringkasan UTY setelah otorisasi.');
adminCheck($app->make(PlatformAffiliationController::class)->__invoke($request)->getTargetUrl() === route('campus.affiliations.index', $campus), 'GET afiliasi platform lama beralih ke antrean UTY.');
$request->setUserResolver(fn () => $legacy);
adminReject(fn () => $app->make(PlatformOperationsController::class)->index($request), HttpException::class, 'Flag admin lama tidak membuka GET platform.');
foreach ([ApproveInstitution::class, SuspendInstitution::class] as $operation) {
    adminReject(fn () => $app->make($operation)->handle($primary, $other, 'Uji synthetic.'), AuthorizationException::class, 'Operasi persetujuan/status institusi baru ditutup, termasuk melalui Action.');
}
adminCheck(! $primary->canAdministerAdvancedModule('recruiter') && ! $primary->canAdministerAdvancedModule('gamification'), 'Penggabungan role tidak otomatis memberi izin administrasi modul lanjutan.');
config()->set('university.advanced_administration.recruiter', true);
adminCheck(! $primary->canAdministerAdvancedModule('recruiter') && ! $legacy->canAdministerAdvancedModule('recruiter'), 'Konfigurasi lama tidak dapat mengaktifkan kembali role perekrut.');
config()->set('university.advanced_administration.recruiter', false);
$recipient = adminAccount();
$phone = $recipient->phoneNumber->number;
$invitation = $issue->handle($primary, $campus, $phone, 'campus_admin');
$latestOutbox = MessageOutbox::query()->latest('id')->firstOrFail();
preg_match('/invitation\/([a-zA-Z0-9]+)/', json_decode(Crypt::decryptString($latestOutbox->payload), true)['message'], $tokenMatch);
$token = $tokenMatch[1];
$accept = $app->make(AcceptInvitation::class);
adminReject(fn () => $accept->handle($student, $token), AuthorizationException::class, 'Token undangan tidak mengabaikan kecocokan nomor WhatsApp.');
$accept->handle($recipient, $token);
adminCheck($recipient->isUniversityAdmin() && $invitation->fresh()->status === InvitationStatus::Accepted, 'Undangan admin aktif menghasilkan membership UTY dan audit penerimaan.');
adminReject(fn () => $accept->handle($recipient, $token), RuntimeException::class, 'Token yang telah digunakan tidak dapat dipakai ulang.');
adminReject(fn () => $app->make(RevokeInvitation::class)->handle($primary, $invitation->fresh(), 'Uji keputusan lama.'), AuthorizationException::class, 'Undangan accepted tidak dilaporkan seolah berhasil dicabut.');
$revokable = $issue->handle($primary, $campus, '+6281399400088', 'campus_admin');
$revoke = $app->make(RevokeInvitation::class);
$revoke->handle($primary, $revokable, 'Pencabutan synthetic.');
adminCheck($revokable->fresh()->status === InvitationStatus::Revoked, 'Policy dan Action mencabut undangan UTY dengan audit.');
$revokeCount = AuditLog::count();
$revoke->handle($primary, $revokable->fresh(), 'Uji ulang pencabutan.');
adminCheck(AuditLog::count() === $revokeCount, 'Retry pencabutan undangan tidak menggandakan audit.');
adminReject(fn () => $issue->handle($primary, $other, '+6281399400096', 'campus_admin'), AuthorizationException::class, 'Admin UTY tidak mengundang admin institusi lain.');
$foreignToken = Str::random(64);
PrivilegedInvitation::factory()->create(['institution_id' => $other->id, 'token_hash' => Hash::make($foreignToken), 'issued_by' => $foreign->id]);
adminReject(fn () => $accept->handle($recipient, $foreignToken), RuntimeException::class, 'Token institusi lain tidak menjadi jalur eskalasi UTY.');
$map = $app->make(MapUniversityAdmin::class);
$before = [InstitutionMembership::count(), AuditLog::count(), Storage::disk('private')->allFiles()];
adminCheck($map->handle($legacy->id, 'Pemetaan synthetic.')['status'] === 'dry_run', 'Pemetaan akun lama default hanya dry run.');
adminCheck($before === [InstitutionMembership::count(), AuditLog::count(), Storage::disk('private')->allFiles()], 'Dry run tidak menulis hak, audit atau cadangan.');
adminReject(fn () => $map->handle($foreign->id, 'Uji kampus lain.', true), UniversityProvisioningConflict::class, 'Pemetaan tidak memindahkan akun atau data kampus lain.');
adminReject(fn () => $map->handle($student->id, 'Uji mahasiswa.', true), UniversityProvisioningConflict::class, 'Pemetaan bukan jalur promosi mahasiswa tanpa sumber admin lama.');
$mapped = $map->handle($legacy->id, 'Pemetaan synthetic.', true);
adminCheck($mapped['status'] === 'mapped' && $legacy->isUniversityAdmin() && ! $legacy->fresh()->is_platform_admin, 'Apply eksplisit memetakan akun yang sah dan menghentikan flag globalnya.');
$receipt = $mapped['receipt'];
adminCheck(Storage::disk('private')->exists($receipt) && ! str_contains(Storage::disk('private')->get($receipt), 'user_id'), 'Cadangan disimpan terenkripsi di storage privat sebelum perubahan.');
$count = AuditLog::count();
adminCheck($map->handle($legacy->id, 'Uji retry.', true)['status'] === 'already_mapped' && AuditLog::count() === $count, 'Retry pemetaan tidak menggandakan grant atau audit.');
adminCheck($map->rollback($receipt, 'Pemulihan synthetic.')['status'] === 'rollback_dry_run' && $legacy->isUniversityAdmin(), 'Rollback default hanya pemeriksaan dan tidak mencabut hak.');
$map->rollback($receipt, 'Pemulihan synthetic.', true);
adminCheck(! $legacy->isUniversityAdmin() && $legacy->fresh()->is_platform_admin && AuditLog::count() > $count, 'Rollback mencabut grant baru tanpa menghapus riwayat atau menghidupkan bypass flag.');
adminCheck($map->rollback($receipt, 'Uji retry rollback.', true)['status'] === 'already_rolled_back', 'Rollback yang diulang idempotent.');
adminReject(fn () => $map->rollback('../secrets', 'Uji path.', true), UniversityProvisioningConflict::class, 'Path cadangan arbitrer ditolak.');
adminReject(fn () => $map->handle($legacy->id, 'Uji grant ulang.', true), UniversityProvisioningConflict::class, 'Pemetaan tidak mengaktifkan ulang membership hasil rollback yang suspended.');
$cliUser = adminAccount(true);
adminCheck(Artisan::call('university:transition-admin', ['--user' => (string) $cliUser->id, '--reason' => 'Uji CLI.']) === 0 && ! $cliUser->isUniversityAdmin(), 'Command CLI memakai dry run default.');
adminCheck(Artisan::call('university:transition-admin', ['--user' => '1e3', '--reason' => 'Uji CLI.', '--apply' => true]) === 1, 'Command menolak ID tidak valid.');
$fault = true;
DB::listen(function (QueryExecuted $query) use (&$fault): void {
    if ($fault && str_starts_with(strtolower(trim($query->sql)), 'insert') && str_contains($query->sql, '"audit_logs"')) {
        throw new RuntimeException('Gangguan audit synthetic.');
    }
});
adminReject(fn () => $map->handle($cliUser->id, 'Uji gangguan.', true), RuntimeException::class, 'Gangguan audit membatalkan pemetaan.');
$fault = false;
adminCheck(! $cliUser->isUniversityAdmin() && $cliUser->fresh()->is_platform_admin, 'Rollback transaksi tidak menyisakan hak parsial.');
$console = new ReflectionProperty($app, 'isRunningInConsole');
$savedConsole = $console->getValue($app);
$console->setValue($app, false);
adminReject(fn () => $map->handle($cliUser->id, 'Uji HTTP.', true), AuthorizationException::class, 'Pemetaan tidak dapat dipanggil dari konteks HTTP.');
$console->setValue($app, $savedConsole);
$request->setUserResolver(fn () => $primary);
$request->headers->set('Accept', 'application/json');
$list = $app->make(UniversityAdminController::class)->index($request, $campus)->getData(true);
adminCheck(count($list['data']) >= 3 && ! str_contains(json_encode($list['data']), 'password') && ! str_contains(json_encode($list['data']), 'phone'), 'Daftar admin hanya memuat identitas pelaku minimum dan revision, tanpa kredensial/kontak.');
$routes = $app->make('router')->getRoutes();
foreach ([[$primary, $campus, true], [$primary, $other, false], [$foreign, $other, false], [$legacy, $campus, false]] as [$actor, $institution, $allowed]) {
    $route = clone $routes->getByName('campus.overview.show');
    $http = Request::create('/campus/'.$institution->id.'/overview');
    $route->bind($http);
    $route->setParameter('institution', $institution);
    $http->setRouteResolver(fn () => $route);
    $http->setUserResolver(fn () => $actor);
    $invoke = fn () => $app->make(EnsureUniversityAdministration::class)->handle($http, fn () => new Response('ok'));
    if ($allowed) {
        adminCheck($invoke()->getStatusCode() === 200, 'Middleware membuka hanya admin universitas sasaran.');
    } else {
        adminReject($invoke, HttpException::class, 'Middleware menolak URL langsung kampus lain atau flag lama.');
    }
}
$student->fill(['is_platform_admin' => true]);
adminCheck(! $student->is_platform_admin && ! array_key_exists('is_platform_admin', $student->toArray()), 'Flag admin lama tidak menerima mass assignment atau masuk serialisasi akun.');
$project = Project::factory()->open()->create(['institution_id' => $campus->id, 'owner_id' => $primary->id]);
$ownContribution = Contribution::factory()->pending()->create(['institution_id' => $campus->id, 'project_id' => $project->id, 'owner_id' => $primary->id]);
adminCheck(Gate::forUser($primary)->denies('review', $ownContribution) && Gate::forUser($secondary)->allows('review', $ownContribution), 'Admin tidak memvalidasi kontribusi sendiri; admin kedua memakai versi pengajuan yang sah.');
$draft = Contribution::factory()->draft()->create(['institution_id' => $campus->id, 'project_id' => $project->id, 'owner_id' => $student->id]);
adminCheck(Gate::forUser($primary)->denies('view', $draft), 'Penggabungan role tidak membuka draft individual mahasiswa.');
$submitted = new ContributionSubmittedNotification($ownContribution);
adminCheck($submitted->shouldSend($secondary, 'database') && ! $submitted->shouldSend($legacy, 'database'), 'Consumer notifikasi memeriksa akses aktual, bukan flag admin historis.');
$singleCampus = Institution::factory()->active()->create();
config()->set('university.slug', $singleCampus->slug);
$singleLegacy = adminAccount(true);
$singleMap = $map->handle($singleLegacy->id, 'Uji admin terakhir dalam pemulihan.', true);
adminReject(fn () => $map->rollback($singleMap['receipt'], 'Uji pemulihan admin terakhir.', true), ValidationException::class, 'Rollback tidak mencabut grant yang menjadi admin aktif terakhir.');
config()->set('university.slug', $campus->slug);
adminReject(fn () => $map->rollback($singleMap['receipt'], 'Uji scope pemulihan.', true), UniversityProvisioningConflict::class, 'Cadangan universitas lain tidak dipakai pada konteks UTY.');
foreach (['platform.invitations.store', 'platform.invitations.revoke', 'university.admins.status'] as $name) {
    adminCheck(in_array('password.confirm', $routes->getByName($name)->gatherMiddleware(), true), 'Route sensitif '.$name.' mewajibkan konfirmasi password.');
}
$campus->forceFill(['status' => InstitutionStatus::Suspended])->save();
adminReject(fn () => $app->make(DeleteUserAccount::class)->handle($primary), ValidationException::class, 'Universitas tidak aktif tidak menjadi celah menghapus akun admin terverifikasi.');
adminCheck(! $primary->isUniversityAdmin() && $workspace->handle($primary)->institutionId === null, 'Perubahan status universitas mencabut akses pada operasi berikutnya.');
$campus->forceFill(['status' => InstitutionStatus::Active])->save();
config()->set('university.slug', '');
adminCheck(! $primary->isUniversityAdmin(), 'Konfigurasi universitas kosong gagal tertutup.');
config()->set('university.slug', $campus->slug);
adminCheck(Http::recorded()->isEmpty(), 'Seluruh pemeriksaan tanpa pengiriman OTP/WhatsApp atau HTTP eksternal.');
echo $passed.' pemeriksaan otorisasi universitas lulus. Seluruh fixture SQLite di memori.'.PHP_EOL;
