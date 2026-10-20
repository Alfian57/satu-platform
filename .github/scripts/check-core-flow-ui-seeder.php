<?php

declare(strict_types=1);

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Portfolio\BuildPublicPortfolioProjection;
use App\Enums\ContributionStatus;
use App\Enums\PortfolioVisibility;
use App\Enums\ProjectStatus;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchScoreVersion;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\PhoneIdentity;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UtyJourneySeeder;
use Illuminate\Console\OutputStyle;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Console\Seeds\SeedCommand;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

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
config()->set('database.default', 'core_ui_check');
config()->set('database.connections.core_ui_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
config()->set('broadcasting.default', 'null');
config()->set('filesystems.disks.local', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-ui-roster-'.Str::uuid(), 'throw' => true]);
config()->set('filesystems.disks.private', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-ui-proof-'.Str::uuid(), 'throw' => true]);
Storage::forgetDisk('local');
Storage::forgetDisk('private');
Http::fake();
Http::preventStrayRequests();
if (DB::connection()->getName() !== 'core_ui_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Verifikasi hanya diizinkan pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
Carbon::setTestNow('2026-10-16 10:00:00');
function expectUiSeed(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function rejectUiSeed(callable $callback, string $message): void
{
    try {
        $callback();
    } catch (RuntimeException) {
        expectUiSeed(true, $message);

        return;
    }
    throw new RuntimeException($message);
}
function uiSeedCounts(): array
{
    return [User::count(), Institution::count(), Project::count(), Task::count(), Contribution::count(), Attachment::count(), PortfolioEntry::count(), DB::table('notifications')->count()];
}
$command = $app->make(SeedCommand::class);
$command->setOutput(new OutputStyle(new ArrayInput([]), new BufferedOutput));
config()->set('university.slug', UtyJourneySeeder::SLUG);
$seed = $app->make(UtyJourneySeeder::class)->setContainer($app)->setCommand($command);
$existingUser = User::factory()->create(['name' => 'Data existing tidak boleh berubah']);
$existingCampus = Institution::factory()->active()->create();
$existingSkill = SkillTaxonomy::factory()->create(['name' => 'React', 'description' => 'Katalog yang telah disesuaikan admin', 'is_verified' => false]);
$snapshot = [$existingUser->fresh()->getAttributes(), $existingCampus->fresh()->getAttributes()];
$app->make(DatabaseSeeder::class)->setContainer($app)->setCommand($command)->__invoke();
$campus = Institution::query()->where('slug', UtyJourneySeeder::SLUG)->sole();
$student = User::query()->where('username', 'uty_mahasiswa')->sole();
$member = User::query()->where('username', 'uty_anggota')->sole();
$reviewer = User::query()->where('username', 'uty_admin')->sole();
$owner = User::query()->where('username', 'uty_pemilik')->sole();
$beginner = User::query()->where('username', 'uty_pemula')->sole();
$waiting = User::query()->where('username', 'uty_afiliasi')->sole();
expectUiSeed($snapshot === [$existingUser->fresh()->getAttributes(), $existingCampus->fresh()->getAttributes()], 'DatabaseSeeder memanggil dataset UTY tanpa mengubah akun atau kampus existing.');
expectUiSeed($existingSkill->fresh()->description === 'Katalog yang telah disesuaikan admin' && ! $existingSkill->fresh()->is_verified, 'Seed katalog tidak menimpa deskripsi atau keputusan persetujuan yang sudah ada.');
expectUiSeed(User::query()->where('username', 'like', 'uty_%')->count() === 12, 'Dua belas akun UTY tersedia sesuai skenario yang terdokumentasi.');
expectUiSeed(Hash::check(UtyJourneySeeder::PASSWORD, $student->password), 'Password bersama dapat digunakan untuk login.');
expectUiSeed($campus->settings['demo_dataset'] === UtyJourneySeeder::DATASET && $campus->settings['demo_seed_complete'], 'Dataset berlabel dan ditandai lengkap setelah transaksi berhasil.');
expectUiSeed($campus->name === 'Universitas Teknologi Yogyakarta', 'Scope dataset memakai Universitas Teknologi Yogyakarta.');
expectUiSeed(! User::query()->where('username', 'like', 'uty_%')->where('is_platform_admin', true)->exists(), 'Dataset UTY tidak membuat akun admin platform terpisah.');
expectUiSeed($campus->memberships()->where('role', 'campus_admin')->count() === 2, 'Dua akun admin universitas memakai satu sumber membership.');
expectUiSeed($student->institutionMemberships()->where('institution_id', $campus->id)->sole()->status->value === 'verified', 'Mahasiswa siap menelusuri peluang melalui afiliasi roster.');
expectUiSeed($waiting->affiliationRequests()->sole()->status->value === 'pending_review', 'Kasus afiliasi belum cocok tersedia untuk Admin Universitas.');
expectUiSeed(StudentProfile::where('user_id', $student->id)->sole()->skills()->exists() && StudentProfile::where('user_id', $student->id)->sole()->availabilityWindows()->count() === 2, 'Profil mahasiswa utama sudah berisi kemampuan dan jadwal.');
expectUiSeed(StudentProfile::where('user_id', $student->id)->sole()->study_year === 1 && StudentProfile::where('user_id', $student->id)->sole()->admission_year === null, 'Tingkat studi fixture lama tidak diterjemahkan menjadi angkatan masuk secara perkiraan.');
expectUiSeed(! Contribution::where('owner_id', $student->id)->exists() && ! TeamMembership::where('user_id', $student->id)->exists(), 'Mahasiswa utama tetap mulai tanpa karya atau riwayat tim.');
expectUiSeed(! StudentProfile::where('user_id', $beginner->id)->sole()->skills()->exists(), 'Pemula dapat melihat kondisi tanpa keahlian atau portofolio.');
expectUiSeed(Project::where('institution_id', $campus->id)->count() === 8 && Project::where('institution_id', $campus->id)->where('status', ProjectStatus::Full)->count() === 1, 'Delapan proyek mencakup peluang, pembentukan tim, penuh, tutup dan draft.');
expectUiSeed(TeamJoinRequest::where('status', 'pending')->count() === 1 && TeamJoinRequest::where('status', 'rejected')->count() === 1, 'Pengajuan menunggu dan keputusan beralasan tersedia.');
expectUiSeed(Task::count() === 11 && Task::where('status', 'blocked')->whereDoesntHave('assignments')->exists(), 'Papan tugas mempunyai status beragam dan tugas belum ditugaskan.');
foreach (ContributionStatus::cases() as $status) {
    if (in_array($status->value, ['draft', 'pending', 'revision', 'approved', 'rejected'], true)) {
        expectUiSeed(Contribution::where('status', $status)->count() === ($status === ContributionStatus::Approved ? 4 : 1), 'Contoh kontribusi '.$status->value.' berasal dari operasi aktual.');
    }
}
$entry = PortfolioEntry::query()->where('user_id', $member->id)->sole();
expectUiSeed($entry->visibility->value === 'private' && $entry->user_id === $member->id, 'Approval menghasilkan karya privat, tidak otomatis dipublikasikan.');
$activation = User::query()->where('username', 'uty_aktivasi')->sole();
$profileOnly = User::query()->where('username', 'uty_profil')->sole();
$portfolioOwner = User::query()->where('username', 'uty_portofolio')->sole();
$rejectedOwner = User::query()->where('username', 'uty_ditolak')->sole();
expectUiSeed(! $activation->institutionMemberships()->exists() && ! $activation->studentProfiles()->exists(), 'Akun aktivasi dimulai dari akun tanpa afiliasi atau profil.');
expectUiSeed($profileOnly->institutionMemberships()->where('institution_id', $campus->id)->sole()->status->value === 'verified' && ! $profileOnly->studentProfiles()->exists(), 'Akun profil telah verified tanpa profil otomatis atau karya.');
expectUiSeed(! PortfolioEntry::where('user_id', $rejectedOwner->id)->exists()
    && Contribution::where('owner_id', $rejectedOwner->id)->sole()->reviews()->sole()->reason !== null, 'Kontribusi ditolak mempunyai alasan dan tidak menghasilkan karya.');
$sharedProfile = $portfolioOwner->studentProfiles()->where('institution_id', $campus->id)->sole();
expectUiSeed(PortfolioEntry::where('user_id', $portfolioOwner->id)->count() === 3 && ! $sharedProfile->recruiter_discoverable, 'Tiga karya untuk uji berbagi tidak membuka izin perekrut.');
foreach ([PortfolioVisibility::Private, PortfolioVisibility::Public] as $visibility) {
    expectUiSeed(PortfolioEntry::where('user_id', $portfolioOwner->id)->where('visibility', $visibility)->count() === ($visibility === PortfolioVisibility::Private ? 2 : 1), 'Jangkauan '.$visibility->value.' tersedia melalui pilihan pemilik.');
}
$publicEntry = PortfolioEntry::where('user_id', $portfolioOwner->id)->where('visibility', PortfolioVisibility::Public)->sole();
$publicContribution = $publicEntry->contribution;
expectUiSeed($publicEntry->sourceVersion->version_number === 2 && $publicContribution->versions()->count() === 2
    && $publicContribution->reviews()->count() === 2
    && $publicContribution->reviews()->pluck('reviewer_id')->unique()->count() === 2,
    'Karya publik bersumber versi kedua dengan riwayat revisi serta dua admin berbeda.');
$public = app(BuildPublicPortfolioProjection::class)->handle($sharedProfile->public_identifier);
$publicJson = json_encode($public, JSON_THROW_ON_ERROR);
expectUiSeed($public['state'] === 'published' && count($public['entries']) === 1, 'Proyeksi publik hanya memuat satu karya publik, bukan karya kampus atau privat.');
expectUiSeed(! str_contains($publicJson, $portfolioOwner->username) && ! str_contains($publicJson, 'Pernyataan individual privat')
    && ! str_contains($publicJson, 'reviewer_id') && ! str_contains($publicJson, 'sha256'), 'Proyeksi publik tidak membocorkan identitas masuk, pernyataan atau data bukti.');
expectUiSeed(Project::where('institution_id', $campus->id)->where('title', 'like', '08.%')->sole()->roles()->count() === 2, 'Peluang lintas program studi memuat dua peran pemula yang dapat diajukan.');
$activationResult = app(SubmitAffiliationRequest::class)->handle($activation, $campus, 'UI-DEMO-9');
expectUiSeed($activationResult->status->value === 'verified', 'NIM yang didokumentasikan benar-benar dapat dipakai untuk aktivasi exact match.');
foreach (Attachment::query()->with('project')->get() as $proof) {
    expectUiSeed(Storage::disk('private')->exists($proof->path) && hash('sha256', Storage::disk('private')->get($proof->path)) === $proof->sha256, 'Bukti privat tersedia dan checksum sesuai.');
}
$pending = Contribution::where('status', ContributionStatus::Pending)->sole();
expectUiSeed(Gate::forUser($reviewer)->allows('review', $pending) && ! Gate::forUser($owner)->allows('review', $pending), 'Admin Universitas dapat memvalidasi; pemilik proyek tidak mendapat izin kampus.');
expectUiSeed(DB::table('notifications')->count() > 0 && DB::table('jobs')->count() === 0 && Http::recorded()->isEmpty(), 'Notifikasi database tersedia tanpa queue tertinggal atau HTTP eksternal.');
expectUiSeed(config('queue.default') === 'null' && MatchScoreVersion::count() === 0, 'Konfigurasi antrean dipulihkan dan versi pencocokan global tidak berubah.');
$student->forceFill(['name' => 'Perubahan pengguna selama uji'])->save();
$beforeRerun = uiSeedCounts();
$seed->run();
expectUiSeed(uiSeedCounts() === $beforeRerun && $student->fresh()->name === 'Perubahan pengguna selama uji', 'Seed ulang tidak menggandakan data atau mereset perubahan pengguna.');
$campus->forceFill(['settings' => [...$campus->settings, 'demo_dataset' => UtyJourneySeeder::PREVIOUS_V2_DATASET]])->save();
$oldFixturePassword = Hash::make('Sandi fixture versi sebelumnya');
foreach (array_keys(UtyJourneySeeder::ACCOUNTS) as $role) {
    User::query()->where('username', 'uty_'.$role)->sole()->forceFill(['password' => $oldFixturePassword])->save();
}
$seed->run();
$v2PasswordsUpdated = User::query()->whereIn('username', array_map(fn (string $role): string => 'uty_'.$role, array_keys(UtyJourneySeeder::ACCOUNTS)))
    ->get()->every(fn (User $user): bool => Hash::check(UtyJourneySeeder::PASSWORD, $user->password));
expectUiSeed($v2PasswordsUpdated && $campus->fresh()->settings['demo_dataset'] === UtyJourneySeeder::DATASET
    && $student->fresh()->name === 'Perubahan pengguna selama uji', 'Upgrade v2 mengganti password akun synthetic satu kali dan menjaga data akun lainnya.');
$changedFixturePassword = 'Password pilihan setelah upgrade';
$student->forceFill(['password' => Hash::make($changedFixturePassword)])->save();
$seed->run();
expectUiSeed(Hash::check($changedFixturePassword, $student->fresh()->password), 'Seed ulang v3 mempertahankan password yang diubah setelah upgrade.');
$app->detectEnvironment(fn () => 'production');
rejectUiSeed(fn () => $seed->run(), 'Production ditolak sebelum membaca atau menulis dataset.');
$app->detectEnvironment(fn () => 'testing');
config()->set('filesystems.disks.private.driver', 's3');
rejectUiSeed(fn () => $seed->run(), 'Disk eksternal ditolak sebelum penulisan.');
config()->set('filesystems.disks.private.driver', 'local');
expectUiSeed(uiSeedCounts() === $beforeRerun, 'Penolakan lingkungan tidak mengubah data.');
$campus->forceFill(['slug' => 'dataset-uji-yang-sudah-dipindah'])->save();
rejectUiSeed(fn () => $seed->run(), 'Akun dengan username uji yang sudah ada tidak diambil alih oleh dataset baru.');
expectUiSeed(uiSeedCounts() === $beforeRerun, 'Konflik identitas tidak meninggalkan tenant parsial.');

DB::connection()->setPdo(new PDO('sqlite::memory:'))->setReadPdo(null);
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$faultEnabled = true;
DB::listen(function (QueryExecuted $query) use (&$faultEnabled): void {
    if ($faultEnabled && str_starts_with(strtolower(trim($query->sql)), 'insert') && str_contains($query->sql, '"contributions"')) {
        throw new RuntimeException('Gangguan database synthetic setelah penyiapan bukti.');
    }
});
$filesBeforeFailure = [Storage::disk('local')->allFiles(), Storage::disk('private')->allFiles()];
rejectUiSeed(fn () => $seed->run(), 'Gangguan tengah seed membatalkan transaksi.');
$faultEnabled = false;
expectUiSeed(uiSeedCounts() === [0, 0, 0, 0, 0, 0, 0, 0], 'Rollback tidak meninggalkan akun, proyek, bukti atau keputusan parsial.');
expectUiSeed($filesBeforeFailure === [Storage::disk('local')->allFiles(), Storage::disk('private')->allFiles()], 'Rollback membersihkan hanya berkas baru milik percobaan gagal.');
expectUiSeed(config('queue.default') === 'null', 'Konfigurasi dipulihkan setelah seed gagal.');
$seed->run();
expectUiSeed(User::count() === 12 && Contribution::count() === 8, 'Retry setelah rollback dapat menghasilkan dataset lengkap.');

DB::connection()->setPdo(new PDO('sqlite::memory:'))->setReadPdo(null);
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$legacyCampus = Institution::factory()->active()->create([
    'slug' => UtyJourneySeeder::SLUG,
    'settings' => ['demo_dataset' => UtyJourneySeeder::PREVIOUS_DATASET, 'demo_seed_complete' => true, 'custom_setting' => 'dipertahankan'],
]);
$legacyUsers = [];
$legacyPassword = Hash::make('SandiUjiDiubah!2026');
foreach (array_slice(UtyJourneySeeder::ACCOUNTS, 0, 8, true) as $role => $name) {
    $index = count($legacyUsers);
    $legacyUsers[$role] = User::factory()->create(['username' => 'uty_'.$role, 'name' => $name, 'password' => $legacyPassword, 'is_platform_admin' => false]);
    PhoneNumber::factory()->forNumber('+62813994000'.str_pad((string) $index, 2, '0', STR_PAD_LEFT))->create(['user_id' => $legacyUsers[$role]->id]);
    $membership = in_array($role, ['admin', 'admin_kedua'], true)
        ? InstitutionMembership::factory()->campusAdmin()
        : InstitutionMembership::factory()->student();
    $membership->verifiedByRosterExactMatch()->create(['institution_id' => $legacyCampus->id, 'user_id' => $legacyUsers[$role]->id]);
}
$legacyProject = Project::factory()->create(['institution_id' => $legacyCampus->id, 'owner_id' => $legacyUsers['pemilik']->id, 'title' => 'Proyek yang diubah saat uji']);
$legacySnapshot = [$legacyUsers['anggota']->fresh()->getAttributes(), $legacyProject->fresh()->getAttributes()];
$collision = User::factory()->create(['username' => 'uty_portofolio']);
$collisionCounts = uiSeedCounts();
rejectUiSeed(fn () => $seed->run(), 'Upgrade menolak benturan username baru tanpa mengambil alih akun.');
expectUiSeed(uiSeedCounts() === $collisionCounts && $legacyCampus->fresh()->settings['demo_dataset'] === UtyJourneySeeder::PREVIOUS_DATASET, 'Upgrade yang ditolak tidak mengubah marker atau data lama.');
$collision->forceFill(['username' => 'akun-lain-tidak-diubah'])->save();
$collisionBeforeUpgrade = $collision->fresh()->getAttributes();
$legacyPhone = $legacyUsers['anggota']->phoneNumber;
$phoneHash = $legacyPhone->number_hash;
$legacyPhone->forceFill(['number_hash' => PhoneIdentity::hash('+6281399409999')])->save();
rejectUiSeed(fn () => $seed->run(), 'Upgrade menolak identitas nomor akun lama yang berubah.');
$legacyPhone->forceFill(['number_hash' => $phoneHash])->save();
$faultEnabled = true;
$upgradeFiles = [Storage::disk('local')->allFiles(), Storage::disk('private')->allFiles()];
rejectUiSeed(fn () => $seed->run(), 'Gangguan saat upgrade membatalkan akun dan skenario baru.');
$faultEnabled = false;
expectUiSeed(uiSeedCounts() === $collisionCounts && $legacyCampus->fresh()->settings['demo_dataset'] === UtyJourneySeeder::PREVIOUS_DATASET, 'Rollback upgrade mempertahankan dataset v1 yang lengkap.');
expectUiSeed($upgradeFiles === [Storage::disk('local')->allFiles(), Storage::disk('private')->allFiles()], 'Rollback upgrade membersihkan hanya berkas percobaan baru.');
$seed->run();
$legacyMemberAfter = $legacyUsers['anggota']->fresh();
$legacyMemberAttributes = $legacyMemberAfter->getAttributes();
$legacyMemberBefore = $legacySnapshot[0];
unset($legacyMemberAttributes['password'], $legacyMemberBefore['password']);
expectUiSeed([$legacyMemberAttributes, $legacyProject->fresh()->getAttributes()] === [$legacyMemberBefore, $legacySnapshot[1]]
    && Hash::check(UtyJourneySeeder::PASSWORD, $legacyMemberAfter->password)
    && $collisionBeforeUpgrade === $collision->fresh()->getAttributes(), 'Upgrade v1 memperbarui password fixture dan menjaga atribut akun lain serta proyek uji.');
expectUiSeed($legacyCampus->fresh()->settings['demo_dataset'] === UtyJourneySeeder::DATASET
    && $legacyCampus->fresh()->settings['custom_setting'] === 'dipertahankan', 'Upgrade menandai v2 setelah sukses dan menjaga pengaturan lain.');
expectUiSeed(User::count() === 13 && Project::count() === 3 && Contribution::count() === 4 && PortfolioEntry::count() === 3, 'Upgrade hanya menambahkan empat akun, dua proyek dan empat kontribusi baru.');
$upgradedCounts = uiSeedCounts();
$seed->run();
expectUiSeed(uiSeedCounts() === $upgradedCounts && Http::recorded()->isEmpty(), 'Upgrade dapat diulang tanpa duplikasi atau provider eksternal.');
echo $passed.' pemeriksaan seeder UI lulus. Seluruh fixture SQLite di memori.'.PHP_EOL;
