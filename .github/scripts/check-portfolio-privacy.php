<?php

declare(strict_types=1);

use App\Actions\Portfolio\BuildPublicPortfolioProjection;
use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Actions\Profile\UpdateStudentProfileVisibility;
use App\Enums\PortfolioVisibility;
use App\Http\Controllers\PortfolioEntryController;
use App\Http\Controllers\PortfolioPageController;
use App\Http\Requests\Portfolio\ListPortfolioEntriesRequest;
use App\Http\Requests\Portfolio\UpdatePortfolioEntryVisibilityRequest;
use App\Http\Requests\Profile\StoreStudentProfileRequest;
use App\Http\Requests\Profile\UpdateStudentProfileVisibilityRequest;
use App\Models\AuditLog;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\PortfolioEntry;
use App\Models\User;
use App\Models\XpLedgerEntry;
use App\Support\Portfolio\PortfolioEntrySerializer;
use App\Support\Portfolio\PortfolioPrivacyRevision;
use Database\Seeders\UtyJourneySeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Console\OutputStyle;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Console\Seeds\SeedCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
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
config()->set('database.default', 'portfolio_check');
config()->set('database.connections.portfolio_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set(['cache.default' => 'array', 'queue.default' => 'null', 'broadcasting.default' => 'null', 'university.slug' => UtyJourneySeeder::SLUG]);
foreach (['local', 'private'] as $disk) {
    config()->set('filesystems.disks.'.$disk, ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-privacy-'.$disk.'-'.Str::uuid(), 'throw' => true]);
    Storage::forgetDisk($disk);
}
Http::fake();
Http::preventStrayRequests();
if (DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan wajib memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-20 10:00:00');
$command = $app->make(SeedCommand::class);
$command->setOutput(new OutputStyle(new ArrayInput([]), new BufferedOutput));
$app->make(UtyJourneySeeder::class)->setContainer($app)->setCommand($command)->run();
$checks = 0;
function privacyCheck(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    echo 'PASS '.$message.PHP_EOL;
    $checks++;
}
function privacyRejects(callable $operation, string $type, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        privacyCheck($error instanceof $type, $message);
        return;
    }
    throw new RuntimeException($message);
}
$campus = Institution::where('slug', UtyJourneySeeder::SLUG)->sole();
$owner = User::where('username', 'uty_portofolio')->sole();
$peer = User::where('username', 'uty_anggota')->sole();
$admin = User::where('username', 'uty_admin')->sole();
$profile = $owner->studentProfiles()->whereBelongsTo($campus)->sole();
$private = PortfolioEntry::where('user_id', $owner->id)->where('visibility', 'private')->firstOrFail();
$public = PortfolioEntry::where('user_id', $owner->id)->where('visibility', 'public')->sole();
$setEntry = app(UpdatePortfolioEntryVisibility::class);
$setProfile = app(UpdateStudentProfileVisibility::class);
$buildPublic = app(BuildPublicPortfolioProjection::class);
$serializer = app(PortfolioEntrySerializer::class);
$entryPayload = fn (PortfolioEntry $entry, string $visibility): array => ['visibility' => $visibility, 'expected_privacy_revision' => PortfolioPrivacyRevision::for($entry->fresh())];
$profilePayload = fn (string $visibility): array => ['portfolio_visibility' => $visibility, 'expected_privacy_revision' => PortfolioPrivacyRevision::for($profile->fresh())];
$businessCounts = [PortfolioEntry::count(), ContributionReview::count(), XpLedgerEntry::count()];
privacyCheck(Gate::forUser($owner)->allows('view', $private) && ! Gate::forUser($peer)->allows('view', $private) && ! Gate::forUser($admin)->allows('view', $private), 'Hanya pemilik dapat membaca karya Hanya saya, termasuk melalui Policy detail.');
privacyCheck(! Gate::forUser($admin)->allows('viewAll', [PortfolioEntry::class, $profile]), 'Admin tidak mendapat bypass daftar portofolio privat.');
privacyCheck(Gate::forUser($admin)->allows('view', $public->contribution), 'Izin admin meninjau kontribusi tetap terpisah dan berfungsi.');
privacyCheck(Gate::forUser($peer)->allows('view', $public) && Gate::forUser($admin)->allows('view', $public), 'Karya publik dapat dibaca pembaca terverifikasi jika profil juga publik.');
privacyCheck(count($buildPublic->handle($profile->public_identifier)['entries']) === 1, 'Profil publik tidak otomatis membagikan karya privat.');

foreach (['institution', 'recruiter'] as $legacy) {
    privacyRejects(fn () => $setEntry->handle($owner, $private, $entryPayload($private, $legacy)), ValidationException::class, 'Action karya menolak jangkauan lama '.$legacy.'.');
    privacyRejects(fn () => $setProfile->handle($owner, $profile, $profilePayload($legacy)), ValidationException::class, 'Action profil menolak jangkauan lama '.$legacy.'.');
    privacyCheck(Validator::make($entryPayload($private, $legacy), (new UpdatePortfolioEntryVisibilityRequest)->rules())->fails()
        && Validator::make($profilePayload($legacy), (new UpdateStudentProfileVisibilityRequest)->rules())->fails(), 'Form Request juga menolak jangkauan lama '.$legacy.'.');
    privacyCheck(Validator::make(['institution_id' => $campus->id, 'portfolio_visibility' => $legacy], (new StoreStudentProfileRequest)->rules())->fails(), 'Pembuatan profil tidak melewati batas jangkauan '.$legacy.'.');
    $private->forceFill(['visibility' => $legacy])->save();
    privacyCheck($serializer->toArray($private)['visibility'] === 'private' && $serializer->toArray($private)['status'] === 'private' && ! Gate::forUser($peer)->allows('view', $private), 'Nilai historis '.$legacy.' diproyeksikan privat tanpa memberi akses.');
}
$private->forceFill(['visibility' => 'private'])->save();
privacyRejects(fn () => $setEntry->handle($owner, $private, ['visibility' => 'public']), ValidationException::class, 'Action karya mewajibkan revisi privasi.');
privacyRejects(fn () => $setProfile->handle($owner, $profile, ['portfolio_visibility' => 'public']), ValidationException::class, 'Action profil mewajibkan revisi privasi.');
privacyCheck(Validator::make(['visibility' => 'private'], (new UpdatePortfolioEntryVisibilityRequest)->rules())->fails(), 'Request HTTP tanpa revisi ditolak sebelum command.');
privacyRejects(fn () => $setEntry->handle($peer, $private, $entryPayload($private, 'public')), AuthorizationException::class, 'Mahasiswa lain tidak dapat memublikasikan karya pemilik.');
privacyRejects(fn () => $setProfile->handle($admin, $profile, $profilePayload('public')), AuthorizationException::class, 'Admin tidak dapat mengubah privasi mahasiswa.');

$oldProfileToken = PortfolioPrivacyRevision::for($profile->fresh());
$setProfile->handle($owner, $profile, $profilePayload('private'));
privacyCheck($buildPublic->handle($profile->public_identifier) === ['state' => 'unavailable', 'profile' => null, 'entries' => []], 'Profil Hanya saya menyembunyikan identitas serta seluruh karya dari publik.');
privacyCheck(! Gate::forUser($peer)->allows('view', $public) && ! Gate::forUser($admin)->allows('view', $public), 'URL detail tidak melewati pengaturan profil privat walau karya masih dipilih publik.');
$listRequest = ListPortfolioEntriesRequest::create('/student-profiles/'.$profile->id.'/portfolio', 'GET');
$listRequest->setUserResolver(fn (): User => $admin);
$list = app(PortfolioEntryController::class)->index($listRequest, $profile, $serializer)->getData(true);
privacyCheck($list['data'] === [], 'API daftar admin tidak membuka karya profil privat.');
privacyRejects(fn () => $setProfile->handle($owner, $profile, ['portfolio_visibility' => 'public', 'expected_privacy_revision' => $oldProfileToken]), ConflictHttpException::class, 'Tab lama tidak dapat menimpa pencabutan profil pada detik yang sama.');
$beforeAba = $profile->fresh()->getAttributes();
$abaToken = PortfolioPrivacyRevision::for($profile->fresh());
$setProfile->handle($owner, $profile, $profilePayload('public'));
$setProfile->handle($owner, $profile, $profilePayload('private'));
privacyCheck($beforeAba === $profile->fresh()->getAttributes() && $abaToken !== PortfolioPrivacyRevision::for($profile->fresh()), 'Jejak audit membedakan perubahan bolak-balik profil meski seluruh atribut dan timestamp kembali sama.');
privacyRejects(fn () => $setProfile->handle($owner, $profile, ['portfolio_visibility' => 'public', 'expected_privacy_revision' => $abaToken]), ConflictHttpException::class, 'Token sebelum perubahan bolak-balik profil tetap ditolak.');
$setProfile->handle($owner, $profile, $profilePayload('public'));
$setEntry->handle($owner, $private, $entryPayload($private, 'public'));
privacyCheck(count($buildPublic->handle($profile->public_identifier)['entries']) === 2, 'Publikasi eksplisit karya menambah hanya karya yang dipilih.');
$setEntry->handle($owner, $private, $entryPayload($private, 'private'));
$entryAba = $private->fresh()->getAttributes();
$entryToken = PortfolioPrivacyRevision::for($private->fresh());
$setEntry->handle($owner, $private, $entryPayload($private, 'public'));
$setEntry->handle($owner, $private, $entryPayload($private, 'private'));
privacyCheck($entryAba === $private->fresh()->getAttributes() && $entryToken !== PortfolioPrivacyRevision::for($private->fresh()), 'Jejak audit membedakan perubahan bolak-balik karya pada detik yang sama.');
privacyRejects(fn () => $setEntry->handle($owner, $private, ['visibility' => 'public', 'expected_privacy_revision' => $entryToken]), ConflictHttpException::class, 'Tab lama tidak dapat memublikasikan ulang karya setelah penarikan.');
privacyCheck(count($buildPublic->handle($profile->public_identifier)['entries']) === 1, 'Penarikan karya langsung mengeluarkannya dari proyeksi publik.');
$source = $public->contribution;
$source->forceFill(['status' => 'revision'])->save();
privacyCheck($buildPublic->handle($profile->public_identifier)['state'] === 'unavailable', 'Sumber yang tidak lagi approved tidak dibagikan ke publik.');
privacyRejects(fn () => $setEntry->handle($owner, $public, $entryPayload($public, 'public')), ValidationException::class, 'Sumber tidak sah tidak bisa dipublikasikan melalui command.');
$setEntry->handle($owner, $public, $entryPayload($public, 'private'));
privacyCheck($public->fresh()->visibility === PortfolioVisibility::Private, 'Penarikan tetap diperbolehkan ketika sumber karya bermasalah.');
$source->forceFill(['status' => 'approved'])->save();
$setEntry->handle($owner, $public, $entryPayload($public, 'public'));
$projection = $buildPublic->handle($profile->public_identifier);
$json = json_encode($projection, JSON_THROW_ON_ERROR);
privacyCheck(! str_contains($json, $owner->username) && ! str_contains($json, 'privacy_revision') && ! str_contains($json, 'contribution_id') && ! str_contains($json, 'evidence') && ! str_contains($json, 'reviewer'), 'Proyeksi publik tetap allowlist tanpa identitas masuk, token, sumber atau bukti privat.');
$http = Request::create('/p/'.$profile->public_identifier, 'GET');
$http->headers->set('X-Inertia', 'true');
$response = app(PortfolioPageController::class)->share($http, $profile->public_identifier, $buildPublic);
privacyCheck($response->getStatusCode() === 200 && str_contains($response->headers->get('Cache-Control', ''), 'no-store'), 'Halaman publik berhasil dan tidak menyimpan cache yang melewati pencabutan.');
$setProfile->handle($owner, $profile, $profilePayload('private'));
$gone = app(PortfolioPageController::class)->share($http, $profile->public_identifier, $buildPublic);
privacyCheck($gone->getStatusCode() === 410 && $gone->headers->get('X-Robots-Tag') === 'noindex, nofollow' && $gone->getData(true)['props']['profile'] === null, 'Pencabutan profil menghasilkan 410/noindex tanpa identitas pemilik.');
privacyCheck($businessCounts === [PortfolioEntry::count(), ContributionReview::count(), XpLedgerEntry::count()], 'Pengaturan privasi tidak menghapus karya, review atau XP.');
privacyCheck(AuditLog::where('operation', 'portfolio_entry.visibility_updated')->count() > 0 && AuditLog::where('operation', 'profile.visibility_updated')->count() > 0, 'Publikasi dan pencabutan memiliki riwayat audit append-only.');
privacyCheck(Http::recorded()->isEmpty(), 'Pemeriksaan tidak menghubungi provider eksternal.');
$ownerRequest = Request::create('/portfolio', 'GET');
$ownerRequest->setUserResolver(fn (): User => $owner);
$ownerRequest->headers->set('X-Inertia', 'true');
$ownerRequest->headers->set('X-Inertia-Partial-Component', 'portfolio/index');
$ownerRequest->headers->set('X-Inertia-Partial-Data', 'profile,entries,permissions');
DB::enableQueryLog();
$ownerPage = app(PortfolioPageController::class)->index($ownerRequest, $serializer)->toResponse($ownerRequest)->getData(true)['props'];
$ownerQueries = DB::getQueryLog();
DB::disableQueryLog();
privacyCheck($ownerPage['profile']['privacy_revision'] === PortfolioPrivacyRevision::for($profile->fresh())
    && collect($ownerPage['entries'])->every(fn ($row): bool => $row['privacy_revision'] === PortfolioPrivacyRevision::for(PortfolioEntry::findOrFail($row['id']))), 'Revisi hasil eager aggregate sama dengan sumber aktual untuk profil dan seluruh karya.');
privacyCheck(collect($ownerQueries)->filter(fn ($query): bool => str_contains($query['query'], 'audit_logs'))->count() <= 2, 'Daftar memuat revisi privasi tanpa query audit per karya.');
echo $checks.' pemeriksaan privasi portofolio lulus. SQLite di memori, bukan database pengguna.'.PHP_EOL;
