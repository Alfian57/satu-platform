<?php

declare(strict_types=1);

use App\Actions\Project\CreateProject;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Actions\Project\UpdateProject;
use App\Actions\Team\RequestToJoinTeam;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Http\Controllers\ProjectController;
use App\Http\Requests\Project\ListProjectsRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\StudentProfile;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Project\ProjectDiscoverySerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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
config()->set('database.default', 'opportunity_check');
config()->set('database.connections.opportunity_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
if (DB::connection()->getName() !== 'opportunity_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian dihentikan: database wajib SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-10 09:00:00');
$passed = 0;
function expectOpportunity(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function opportunityFailure(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectOpportunity($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}
$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data sintetis']);
$otherCampus = Institution::factory()->active()->create(['name' => 'Kampus B. Data sintetis']);
$owner = User::factory()->create();
$newStudent = User::factory()->create();
$member = User::factory()->create();
foreach ([$owner, $newStudent, $member] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->getKey(), 'institution_id' => $campus->getKey()]);
}
Notification::fake();
$creator = $app->make(CreateProject::class);
$updater = $app->make(UpdateProject::class);
$query = $app->make(ProjectDiscoveryQuery::class);
$serializer = $app->make(ProjectDiscoverySerializer::class);
$make = function (string $title, array $roles) use ($creator, $owner, $campus): Project {
    $project = $creator->handle($owner, $campus, ['title' => $title, 'description' => 'Tujuan kerja. Data sintetis.', 'capacity' => 4, 'deadline' => now()->addWeek(), 'roles' => $roles]);

    return $project->forceFill(['status' => ProjectStatus::Open])->save() ? $project->refresh()->load('roles.skills.taxonomy') : throw new RuntimeException('Fixture gagal.');
};
$mixed = $make('Peran pemula terisi', [['title' => 'Pemula', 'capacity' => 1, 'accepts_beginners' => true], ['title' => 'Pengembang', 'capacity' => 2, 'accepts_beginners' => false]]);
$filledRole = $mixed->roles[0];
TeamMembership::factory()->create(['project_id' => $mixed->getKey(), 'project_role_id' => $filledRole->getKey(), 'user_id' => $member->getKey()]);
$beginner = $make('Peluang belajar bertahap', [['title' => 'Perancang', 'capacity' => 2, 'accepts_beginners' => true, 'selection_criteria' => 'Minat belajar bertahap, waktu diskusi terjadwal.']]);
$role = $beginner->roles[0];
TeamMembership::factory()->create(['project_id' => $beginner->getKey(), 'project_role_id' => null, 'user_id' => $owner->getKey()]);
TeamMembership::factory()->left()->create(['project_id' => $beginner->getKey(), 'project_role_id' => $role->getKey(), 'user_id' => $member->getKey()]);
TeamJoinRequest::factory()->create(['project_id' => $beginner->getKey(), 'project_role_id' => $role->getKey(), 'requester_id' => $member->getKey()]);
TeamInvitation::factory()->create(['project_id' => $beginner->getKey(), 'project_role_id' => $role->getKey(), 'inviter_id' => $owner->getKey(), 'invitee_id' => $member->getKey()]);
$legacy = $make('Data lama belum dinyatakan', [['title' => 'Peran lama', 'capacity' => 2]]);
$private = $make('Proyek privat', [['title' => 'Peran privat', 'capacity' => 2, 'accepts_beginners' => true]]);
$private->forceFill(['visibility' => 'private'])->save();
$expired = $make('Peluang lewat', [['title' => 'Pemula lewat', 'capacity' => 2, 'accepts_beginners' => true]]);
$expired->forceFill(['deadline' => now()->subMinute()])->save();
$closed = $make('Peluang ditutup', [['title' => 'Pemula ditutup', 'capacity' => 2, 'accepts_beginners' => true]]);
$closed->forceFill(['status' => ProjectStatus::Closed])->save();
$other = Project::factory()->create(['institution_id' => $otherCampus->getKey(), 'owner_id' => $owner->getKey()]);
ProjectRole::factory()->create(['project_id' => $other->getKey(), 'accepts_beginners' => true]);
expectOpportunity(StudentProfile::query()->whereBelongsTo($newStudent)->doesntExist(), 'Mahasiswa fixture tidak mempunyai profil, karya atau riwayat kontribusi.');
DB::flushQueryLog();
DB::enableQueryLog();
$result = $query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['beginner' => 'accepting', 'availability' => 'available']));
$page = $serializer->page($result->paginator);
$reads = DB::getQueryLog();
DB::disableQueryLog();
expectOpportunity(array_column($page['data'], 'id') === [$beginner->getKey()], 'Kombinasi filter mengacu pada peran pemula yang sama dan masih memiliki tempat.');
expectOpportunity(collect($reads)->every(fn (array $entry): bool => str_starts_with(strtolower(ltrim($entry['query'])), 'select')), 'GET discovery dan agregat kapasitas hanya SELECT, tanpa default atau hitung tersimpan.');
expectOpportunity($page['data'][0]['capacity_stats']['occupied'] === 1 && $page['data'][0]['capacity_stats']['remaining'] === 3, 'Pemilik hanya terhitung bila membership aktif; pending dan anggota keluar tidak mengisi kapasitas.');
expectOpportunity($page['data'][0]['roles'][0]['capacity_stats']['occupied'] === 0 && $page['data'][0]['roles'][0]['capacity_stats']['remaining'] === 2, 'Sisa peran berasal dari keanggotaan aktif peran, bukan kapasitas tim atau pending.');
expectOpportunity($page['data'][0]['roles'][0]['selection_criteria'] === 'Minat belajar bertahap, waktu diskusi terjadwal.', 'Kriteria pemilik diteruskan tanpa klaim verifikasi atau skor.');
expectOpportunity(! str_contains(json_encode($page, JSON_THROW_ON_ERROR), $newStudent->username), 'Discovery tidak memproyeksikan username, kontak atau anggota privat.');
expectOpportunity($result->filters->queryParameters()['beginner'] === 'accepting' && $result->filters->queryParameters()['availability'] === 'available', 'Filter efektif dan pagination mempertahankan pemula serta ketersediaan pada URL.');
$all = $query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['beginner' => 'accepting']))->paginator->getCollection()->modelKeys();
expectOpportunity(in_array($mixed->getKey(), $all, true), 'Filter pemula saja tidak mengarang bahwa peran yang menerima pemula masih kosong.');
expectOpportunity(! in_array($private->getKey(), $all, true) && ! in_array($other->getKey(), $all, true), 'Peluang privat dan tenant lain tidak bocor lewat filter baru.');
$unknown = $query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['q' => 'Data lama']))->paginator->first();
expectOpportunity($serializer->summary($unknown)['roles'][0]['accepts_beginners'] === null, 'Data lama bernilai null, tidak otomatis menerima atau menolak pemula.');
expectOpportunity($query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['q' => 'belajar bertahap']))->paginator->total() === 1, 'Pencarian membaca kriteria kebutuhan yang nyata.');
opportunityFailure(fn () => $query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['institution_id' => $otherCampus->getKey()])), AuthorizationException::class, 'Konteks institusi yang tidak dimiliki ditolak.');
$join = $app->make(RequestToJoinTeam::class)->handle($newStudent, $beginner, $role->getKey(), 'Saya ingin belajar dan dapat mengikuti waktu tim.');
expectOpportunity($join->status->value === 'pending' && $join->project_role_id === $role->getKey(), 'Mahasiswa tanpa portofolio dapat mengajukan peran pemula, bukan otomatis diterima.');
opportunityFailure(fn () => $app->make(RequestToJoinTeam::class)->handle($newStudent, $mixed, $filledRole->getKey()), ValidationException::class, 'Peran penuh diperiksa lagi di server saat pengajuan, bukan hanya kontrol UI.');
$roleInput = ['id' => $role->getKey(), 'title' => 'Perancang baru', 'capacity' => 2, 'accepts_beginners' => true, 'selection_criteria' => 'Kriteria diperbarui', 'skills' => []];
$updated = $updater->handle($owner, $beginner, ['roles' => [$roleInput]]);
expectOpportunity($updated->roles[0]->getKey() === $role->getKey() && $join->fresh()->project_role_id === $role->getKey(), 'Edit nama/kriteria mempertahankan ID peran serta referensi pengajuan.');
expectOpportunity(TeamInvitation::query()->whereBelongsTo($beginner)->first()->project_role_id === $role->getKey(), 'Referensi undangan juga dipertahankan setelah edit.');
$updated = $updater->handle($owner, $updated, ['roles' => [['id' => $role->getKey(), 'title' => 'Perancang baru', 'capacity' => 2, 'skills' => []]]]);
expectOpportunity($updated->roles[0]->accepts_beginners === true && $updated->roles[0]->selection_criteria === 'Kriteria diperbarui', 'Klien lama yang tidak mengirim metadata baru tidak menghapus pernyataan pemilik.');
$mixedRoles = $mixed->roles->map(fn (ProjectRole $item): array => ['id' => $item->getKey(), 'title' => $item->getKey() === $filledRole->getKey() ? 'Pengembang' : 'Pemula', 'capacity' => $item->capacity, 'skills' => []])->all();
$swapped = $updater->handle($owner, $mixed, ['roles' => $mixedRoles]);
expectOpportunity($swapped->roles->firstWhere('id', $filledRole->getKey())->title === 'Pengembang' && TeamMembership::query()->whereBelongsTo($mixed)->whereBelongsTo($member)->first()->project_role_id === $filledRole->getKey(), 'Pertukaran nama unik mempertahankan ID dan keanggotaan peran.');
opportunityFailure(fn () => $updater->handle($owner, $mixed, ['roles' => [$mixedRoles[0], [...$mixedRoles[1], 'id' => $mixedRoles[0]['id']]]]), ValidationException::class, 'ID peran berulang ditolak sebelum mutasi.');
$unusedRoleId = $swapped->roles->firstWhere('id', '!=', $filledRole->getKey())->getKey();
$updater->handle($owner, $mixed, ['roles' => [$mixedRoles[0]]]);
expectOpportunity(ProjectRole::query()->whereKey($unusedRoleId)->doesntExist() && ProjectRole::query()->whereKey($filledRole->getKey())->exists(), 'Peran tanpa referensi dapat dihapus tanpa mengganti peran yang dipertahankan.');
$snapshot = $updated->fresh()->toArray();
opportunityFailure(fn () => $updater->handle($owner, $updated, ['title' => 'Jangan tersimpan', 'roles' => [['title' => 'Peran pengganti', 'capacity' => 2]]]), ValidationException::class, 'Peran dengan riwayat tidak dapat dihapus atau diganti tanpa ID.');
expectOpportunity($updated->fresh()->toArray() === $snapshot && $role->fresh()->title === 'Perancang baru', 'Kegagalan edit membatalkan informasi proyek dan peran secara atomik.');
opportunityFailure(fn () => $updater->handle($owner, $updated, ['roles' => [[...$roleInput, 'id' => $other->roles()->first()->getKey()]]]), ValidationException::class, 'ID peran milik tenant/proyek lain ditolak.');
TeamMembership::factory()->active()->create(['project_id' => $beginner->getKey(), 'project_role_id' => $role->getKey(), 'user_id' => $newStudent->getKey()]);
opportunityFailure(fn () => $updater->handle($owner, $updated, ['capacity' => 1, 'roles' => [[...$roleInput, 'capacity' => 1]]]), ValidationException::class, 'Kapasitas tim tidak dapat dikurangi di bawah anggota aktif.');
TeamMembership::query()->whereBelongsTo($beginner)->where('user_id', $member->getKey())->update(['status' => 'active']);
opportunityFailure(fn () => $updater->handle($owner, $updated, ['roles' => [[...$roleInput, 'capacity' => 1]]]), ValidationException::class, 'Kapasitas peran tidak dapat dikurangi di bawah anggota aktif.');
opportunityFailure(fn () => $updater->handle($newStudent, $updated, ['roles' => [$roleInput]]), AuthorizationException::class, 'Calon anggota tidak dapat mengubah penerimaan pemula atau kriteria pemilik.');
$rules = (new StoreProjectRequest)->rules();
expectOpportunity(! Validator::make(['beginner' => ['accepting'], 'availability' => 'invalid'], (new ListProjectsRequest)->rules())->passes(), 'Filter array dan nilai tidak dikenal ditolak.');
expectOpportunity(! Validator::make(['roles' => [['title' => 'Peran', 'capacity' => 1, 'accepts_beginners' => 'yes', 'selection_criteria' => str_repeat('x', 2001)]]], (new UpdateProjectRequest)->rules())->passes(), 'Boolean palsu serta kriteria terlalu panjang ditolak.');
expectOpportunity(! Validator::make(['roles' => [['id' => $role->getKey()]]], $rules)->passes(), 'Create tidak menerima ID peran existing kiriman klien.');
Auth::setUser($newStudent);
$request = Request::create('/projects/'.$beginner->getKey(), 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
$request->setUserResolver(fn () => $newStudent);
$detail = $app->make(ProjectController::class)->show($request, $beginner->fresh())->getData(true)['data'];
expectOpportunity(isset($detail['capacity_stats'], $detail['roles'][0]['capacity_stats']) && $detail['roles'][0]['accepts_beginners'] === true, 'Detail JSON membaca agregat dan kontrak peran dari sumber yang sama.');
$fullStudent = User::factory()->create();
TeamMembership::factory()->active()->create(['project_id' => $beginner->getKey(), 'project_role_id' => null, 'user_id' => $fullStudent->getKey()]);
expectOpportunity($query->execute($newStudent, ProjectDiscoveryFilters::fromValidated(['beginner' => 'accepting', 'availability' => 'available']))->paginator->total() === 0, 'Proyek yang masih berstatus open tetapi kapasitas aktual penuh tidak menjadi peluang tersedia.');
opportunityFailure(fn () => $app->make(RequestToJoinTeam::class)->handle($member, $expired, $expired->roles[0]->getKey()), AuthorizationException::class, 'Tenggat lewat tidak mengizinkan pengajuan meskipun peran memiliki sisa fisik.');
$membership = InstitutionMembership::query()->whereBelongsTo($newStudent)->first();
$membership->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
opportunityFailure(fn () => $query->execute($newStudent, ProjectDiscoveryFilters::fromValidated([])), AuthorizationException::class, 'Afiliasi ditangguhkan tidak membuka peluang meskipun profil kosong diizinkan.');
$beforeSchema = ProjectRole::query()->count();
expectOpportunity(Artisan::call('projects:sync-opportunity-schema', ['--database' => 'opportunity_check', '--apply' => true]) === 0 && ProjectRole::query()->count() === $beforeSchema, 'Command schema idempotent dan tidak menghapus record.');
echo $passed.' pemeriksaan lulus. Fixture SQLite :memory:, tanpa data aplikasi.'.PHP_EOL;
