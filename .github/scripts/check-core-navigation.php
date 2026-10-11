<?php

declare(strict_types=1);

use App\Actions\Project\ProjectDiscoveryQuery;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Enums\TeamMembershipStatus;
use App\Http\Controllers\DashboardController;
use App\Http\Requests\Project\ListProjectsRequest;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

require dirname(__DIR__, 2).'/vendor/autoload.php';

// Pengujian mandiri ini hanya boleh membuat fixture pada SQLite di memori.
foreach (['APP_ENV' => 'testing', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'FAIL '.$error->getMessage().PHP_EOL);
    exit(1);
});
config()->set('database.default', 'core_navigation_check');
config()->set('database.connections.core_navigation_check', [
    'driver' => 'sqlite',
    'database' => ':memory:',
    'prefix' => '',
    'foreign_key_constraints' => true,
]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');

if (DB::connection()->getName() !== 'core_navigation_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian dihentikan: database harus terisolasi di memori.');
}

$migrationNames = [
    '0001_01_01_000000_create_users_table.php',
    '2026_07_23_170102_create_institutions_table.php',
    '2026_07_23_171937_create_institution_memberships_table.php',
    '2026_08_08_000009_create_skill_taxonomies_table.php',
    '2026_08_11_151844_create_project_tables.php',
    '2026_08_12_041305_create_team_transition_tables.php',
    '2026_08_12_065436_create_tasks_table.php',
    '2026_08_12_065437_create_task_assignments_table.php',
    '2026_08_12_095400_create_attachments_table.php',
    '2026_08_12_210832_create_contribution_lifecycle_tables.php',
];
foreach ($migrationNames as $migrationName) {
    (require $app->databasePath('migrations/'.$migrationName))->up();
}

$passed = 0;
function expectCore(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}

$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data sintetis']);
$otherCampus = Institution::factory()->active()->create(['name' => 'Kampus B. Data sintetis']);
$student = User::factory()->create();
$peer = User::factory()->create();
$newStudent = User::factory()->create();
$membership = InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create([
    'user_id' => $student->getKey(), 'institution_id' => $campus->getKey(),
]);
$newMembership = InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create([
    'user_id' => $newStudent->getKey(), 'institution_id' => $campus->getKey(),
]);
$owned = Project::factory()->create(['institution_id' => $campus->getKey(), 'owner_id' => $student->getKey()]);
$draft = Project::factory()->draft()->privateVisibility()->create(['institution_id' => $campus->getKey(), 'owner_id' => $student->getKey()]);
$archived = Project::factory()->archived()->create(['institution_id' => $campus->getKey(), 'owner_id' => $student->getKey()]);
$joined = Project::factory()->privateVisibility()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
$joinedMembership = TeamMembership::factory()->create(['project_id' => $joined->getKey(), 'user_id' => $student->getKey()]);
$left = Project::factory()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
TeamMembership::factory()->left()->create(['project_id' => $left->getKey(), 'user_id' => $student->getKey()]);
$removed = Project::factory()->privateVisibility()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
TeamMembership::factory()->removed($peer)->create(['project_id' => $removed->getKey(), 'user_id' => $student->getKey()]);
$pending = Project::factory()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
$pendingRequest = TeamJoinRequest::factory()->create(['project_id' => $pending->getKey(), 'requester_id' => $student->getKey()]);
$privateOther = Project::factory()->privateVisibility()->create(['institution_id' => $campus->getKey(), 'owner_id' => $peer->getKey()]);
$foreign = Project::factory()->privateVisibility()->create(['institution_id' => $otherCampus->getKey(), 'owner_id' => $peer->getKey()]);
TeamMembership::factory()->create(['project_id' => $foreign->getKey(), 'user_id' => $student->getKey()]);

$tables = Schema::getTableListing();
$counts = fn (): array => array_map(fn (string $table): int => DB::table($table)->count(), $tables);
DB::enableQueryLog();
$readSnapshot = function () use ($counts): array {
    DB::flushQueryLog();

    return $counts();
};
$onlyReads = fn (): bool => array_all(DB::getQueryLog(), fn (array $entry): bool => preg_match('/^\s*(select|pragma)\b/i', $entry['query']) === 1);
$query = $app->make(ProjectDiscoveryQuery::class);
$filters = fn (array $overrides = []): ProjectDiscoveryFilters => ProjectDiscoveryFilters::fromValidated([
    'institution_id' => $campus->getKey(), ...$overrides,
]);
$before = $readSnapshot();
$mine = $query->execute($student, $filters(['view' => 'mine']));
$ids = $mine->paginator->pluck('id')->sort()->values()->all();
$expected = [$owned->getKey(), $draft->getKey(), $archived->getKey(), $joined->getKey()];
sort($expected);
expectCore($ids === $expected, 'Proyek saya hanya memuat pemilik atau anggota aktif, termasuk privat, draft dan arsip.');
expectCore($counts() === $before && $onlyReads(), 'Pembacaan Proyek saya tidak membuat atau mengubah baris.');
expectCore($mine->filters->view === 'mine', 'Mode Proyek saya tetap pada filter efektif.');
foreach ($mine->paginator as $project) {
    expectCore(Gate::forUser($student)->allows('view', $project), 'Policy mengizinkan setiap proyek yang dikembalikan.');
}
$opportunities = $query->execute($student, $filters());
expectCore($opportunities->filters->view === 'opportunities', 'URL lama tetap menggunakan Peluang secara default.');
expectCore(! $opportunities->paginator->contains('id', $draft->getKey()) && ! $opportunities->paginator->contains('id', $archived->getKey()), 'Draft dan arsip tidak menjadi peluang secara default.');
expectCore(! $opportunities->paginator->contains('id', $joined->getKey()) && ! $opportunities->paginator->contains('id', $privateOther->getKey()), 'Proyek privat tidak menjadi peluang publik.');
expectCore($query->execute($newStudent, $filters(['view' => 'mine']))->paginator->isEmpty(), 'Mahasiswa baru mendapat Proyek saya kosong, bukan proyek orang lain.');
$paged = $query->execute($student, $filters(['view' => 'mine', 'per_page' => 1, 'sort' => 'title']));
parse_str((string) parse_url($paged->paginator->url(2), PHP_URL_QUERY), $pageQuery);
expectCore($pageQuery['view'] === 'mine' && (int) $pageQuery['institution_id'] === $campus->getKey() && (int) $pageQuery['page'] === 2, 'Paginasi mempertahankan mode dan konteks institusi.');
expectCore($query->execute($student, $filters(['view' => 'mine', 'visibility' => 'private']))->paginator->total() === 2, 'Filter privat tetap dibatasi pemilik atau anggota aktif.');
try {
    $query->execute($student, $filters(['view' => 'mine', 'institution_id' => $otherCampus->getKey()]));
    throw new RuntimeException('Query lintas tenant tidak ditolak.');
} catch (AuthorizationException) {
    expectCore(true, 'Keanggotaan proyek tidak menggantikan otorisasi institusi.');
}

$validate = function (array $data): bool {
    $request = ListProjectsRequest::create('/projects', 'GET', $data);
    $validator = Validator::make($data, $request->rules());
    foreach ($request->after() as $after) {
        $validator->after($after);
    }

    return $validator->passes();
};
expectCore($validate(['view' => 'mine', 'status' => 'draft,archived']), 'Proyek saya menerima filter draft dan arsip.');
expectCore(! $validate(['view' => 'opportunities', 'status' => 'draft']), 'Peluang menolak filter draft.');
expectCore(! $validate(['view' => 'everyone']) && ! $validate(['view' => ['mine']]), 'Mode tidak dikenal dan parameter array ditolak.');

$controller = $app->make(DashboardController::class);
$activeProjects = new ReflectionMethod($controller, 'activeProjectsQuery');
$nextAction = new ReflectionMethod($controller, 'nextAction');
$choose = function (?InstitutionMembership $context = null, ?StudentProfile $profile = null, ?User $actor = null) use ($controller, $activeProjects, $nextAction, $student, $membership, $campus): array {
    $actor ??= $student;
    $context ??= $membership->fresh(['institution']);
    $active = $activeProjects->invoke($controller, $actor, $campus)->first();

    return $nextAction->invoke($controller, $context, $profile, null, $active, $actor);
};
$before = $readSnapshot();
$action = $choose();
expectCore($action['primaryAction']['key'] === 'workspace' && $action['secondaryAction']['view'] === 'mine', 'Proyek aktif didahulukan meskipun profil belum lengkap.');
expectCore($counts() === $before && $onlyReads(), 'Arahan Beranda tanpa tugas tetap baca-saja.');
$task = Task::factory()->create(['project_id' => $joined->getKey(), 'created_by_id' => $peer->getKey(), 'title' => 'Tugas saya. Data sintetis', 'due_at' => now()->subDay()]);
TaskAssignment::factory()->create(['task_id' => $task->getKey(), 'user_id' => $student->getKey()]);
$unassigned = Task::factory()->create(['project_id' => $joined->getKey(), 'created_by_id' => $peer->getKey(), 'status' => TaskStatus::Blocked, 'title' => 'Tugas rekan. Data sintetis']);
$foreignTask = Task::factory()->create(['project_id' => $foreign->getKey(), 'created_by_id' => $peer->getKey(), 'status' => TaskStatus::Blocked]);
TaskAssignment::factory()->create(['task_id' => $foreignTask->getKey(), 'user_id' => $student->getKey()]);
$before = $readSnapshot();
$action = $choose();
expectCore($action['reference'] === 'TASK-'.$task->getKey() && $action['statusTone'] === 'correction', 'Tugas pribadi yang tertunda diprioritaskan, tugas rekan dan tenant lain tidak bocor.');
expectCore($action['primaryAction']['taskId'] === $task->getKey(), 'Arahan Beranda membawa ID tugas aktual ke ruang kerja, bukan hanya ID proyek.');
expectCore($counts() === $before && $onlyReads(), 'Pembacaan tugas Beranda tidak mengubah data.');
$revision = Contribution::factory()->revision()->create(['institution_id' => $campus->getKey(), 'owner_id' => $student->getKey(), 'project_id' => $joined->getKey()]);
Contribution::factory()->revision()->create(['institution_id' => $otherCampus->getKey(), 'owner_id' => $student->getKey(), 'project_id' => $foreign->getKey(), 'updated_at' => now()->subDay()]);
$before = $readSnapshot();
$action = $choose();
expectCore($action['reference'] === 'REV-'.$revision->getKey() && $action['primaryAction']['contributionId'] === $revision->getKey(), 'Revisi sendiri didahulukan dari tugas dan tidak mengungkap bukti atau catatan privat.');
expectCore(! str_contains(json_encode($action, JSON_THROW_ON_ERROR), 'current_version') && $counts() === $before && $onlyReads(), 'Arahan revisi hanya memuat konteks minimum dan tetap baca-saja.');
foreach ([InstitutionMembershipStatus::Pending, InstitutionMembershipStatus::Unverified, InstitutionMembershipStatus::Suspended] as $status) {
    $membership->forceFill(['status' => $status])->save();
    $before = $readSnapshot();
    $action = $choose();
    expectCore($action['primaryAction']['key'] === 'onboarding' && $counts() === $before && $onlyReads(), 'Status '.$status->value.' hanya mengarahkan pemulihan afiliasi.');
    try {
        $query->execute($student, $filters(['view' => 'mine']));
        throw new RuntimeException('Akses '.$status->value.' tidak ditolak.');
    } catch (AuthorizationException) {
        expectCore(true, 'Status '.$status->value.' tidak membuka daftar proyek.');
    }
}
$membership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
$joinedMembership->update(['status' => TeamMembershipStatus::Left, 'left_at' => now()]);
$action = $choose();
expectCore($action['primaryAction']['key'] === 'workspace' && $action['primaryAction']['projectId'] === $owned->getKey(), 'Keluar dari tim menghapus arahan tugas dan revisi tim tersebut.');
$owned->update(['status' => ProjectStatus::Closed]);
$action = $choose();
expectCore($action['reference'] === 'JOIN-'.$pendingRequest->getKey() && $action['statusLabel'] === 'Menunggu keputusan', 'Tanpa proyek aktif, pengajuan yang masih menunggu menjadi arahan berikutnya.');
$emptyAction = $choose($newMembership->fresh(['institution']), null, $newStudent);
expectCore($emptyAction['reference'] === 'PROFIL-START', 'Pengguna baru tanpa pekerjaan mendapat arahan profil, bukan data pekerjaan rekaan.');
$readyProfile = new StudentProfile;
$readyProfile->skills_count = 1;
$readyProfile->availability_windows_count = 1;
$discoveryAction = $choose($newMembership->fresh(['institution']), $readyProfile, $newStudent);
expectCore($discoveryAction['reference'] === 'DISCOVERY-START' && $discoveryAction['primaryAction']['key'] === 'projects', 'Profil siap tanpa rekomendasi tetap dapat menjelajahi peluang.');
$noMembership = $nextAction->invoke($controller, null, null, null, null, $newStudent);
expectCore($noMembership['reference'] === 'AFF-START', 'Tanpa afiliasi hanya muncul arahan untuk menghubungkan kampus.');

echo $passed.' pemeriksaan lulus. Seluruh fixture hanya berada pada SQLite :memory:.'.PHP_EOL;
