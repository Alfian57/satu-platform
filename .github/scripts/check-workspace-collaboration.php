<?php

declare(strict_types=1);

use App\Actions\Attachment\DeleteAttachment;
use App\Actions\Attachment\UploadAttachment;
use App\Actions\Task\AssignTask;
use App\Actions\Task\CreateTask;
use App\Actions\Task\DeleteTask;
use App\Actions\Task\TransitionTaskStatus;
use App\Actions\Task\UnassignTask;
use App\Actions\Task\UpdateTask;
use App\Enums\AttachmentPurpose;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Enums\TeamMembershipStatus;
use App\Events\WorkspaceAttachmentChanged;
use App\Events\WorkspaceTaskChanged;
use App\Http\Controllers\ProjectWorkspaceController;
use App\Http\Requests\Task\ShowTaskWorkspaceRequest;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Attachment\WorkspaceEvidenceQuery;
use App\Support\Task\TaskSnapshot;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Route;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
config()->set('database.default', 'workspace_check');
config()->set('database.connections.workspace_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
config()->set('filesystems.disks.private', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-t07-'.Str::uuid(), 'throw' => true]);
Storage::forgetDisk('private');
if (DB::connection()->getName() !== 'workspace_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian hanya boleh memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-11 10:00:00');
$checks = 0;
function expectWorkspace(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function rejectsWorkspace(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectWorkspace($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}
function workspaceRevision(Task $task): string
{
    return TaskSnapshot::revision($task->fresh());
}

$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data sintetis']);
config()->set('university.slug', $campus->slug);
$other = Institution::factory()->active()->create(['name' => 'Kampus B. Data sintetis']);
$owner = User::factory()->create();
$student = User::factory()->create();
$peer = User::factory()->create();
$outsider = User::factory()->create();
$admin = User::factory()->create();
foreach ([$owner, $student, $peer] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->getKey(), 'institution_id' => $campus->getKey()]);
}
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $outsider->getKey(), 'institution_id' => $other->getKey()]);
InstitutionMembership::factory()->campusAdmin()->verifiedByRosterExactMatch()->create(['user_id' => $admin->getKey(), 'institution_id' => $campus->getKey()]);
$project = Project::factory()->open()->privateVisibility()->create(['institution_id' => $campus->getKey(), 'owner_id' => $owner->getKey(), 'deadline' => now()->addMonth()]);
$foreign = Project::factory()->open()->create(['institution_id' => $other->getKey(), 'owner_id' => $outsider->getKey(), 'deadline' => now()->addMonth()]);
$team = TeamMembership::factory()->create(['project_id' => $project->getKey(), 'user_id' => $student->getKey()]);
TeamMembership::factory()->create(['project_id' => $project->getKey(), 'user_id' => $peer->getKey()]);
Event::fake([WorkspaceTaskChanged::class, WorkspaceAttachmentChanged::class]);
$create = app(CreateTask::class);
$update = app(UpdateTask::class);
$assign = app(AssignTask::class);
$unassign = app(UnassignTask::class);
$transition = app(TransitionTaskStatus::class);
$delete = app(DeleteTask::class);
$task = $create->handle($student, $project, ['title' => 'Hasil individual. Data sintetis', 'description' => 'Susun satu lembar alur yang dapat diperiksa.', 'due_at' => now()->addWeek()]);
expectWorkspace($task->status === TaskStatus::Todo && Message::count() === 0, 'Anggota membuat tugas tanpa pesan atau profil/portofolio.');
$initial = workspaceRevision($task);
$assignment = $assign->handle($owner, $task, $student, $initial);
expectWorkspace($assignment->user_id === $student->getKey() && workspaceRevision($task) !== $initial, 'Penanggung jawab mengubah revisi walaupun timestamp tugas tidak berubah.');
rejectsWorkspace(fn () => $update->handle($student, $task, ['title' => 'Tidak boleh tertimpa', 'expected_revision' => $initial]), ConflictHttpException::class, 'Snapshot sebelum assignment ditolak 409.');
$revision = workspaceRevision($task);
$beforeTime = $task->fresh()->updated_at->toIso8601String();
$updated = $update->handle($peer, $task, ['title' => 'Judul terbaru. Data sintetis', 'expected_revision' => $revision]);
expectWorkspace($updated->updated_at->toIso8601String() === $beforeTime && workspaceRevision($updated) !== $revision, 'Perubahan judul pada detik sama tetap terdeteksi.');
$auditCount = AuditLog::count();
foreach ([
    fn () => $update->handle($student, $task, ['title' => 'Lama', 'expected_revision' => $revision]),
    fn () => $transition->handle($student, $task, TaskStatus::Done, $revision),
    fn () => $assign->handle($student, $task, $peer, $revision),
    fn () => $unassign->handle($student, $task, $student, $revision),
    fn () => $delete->handle($student, $task, $revision),
] as $operation) {
    rejectsWorkspace($operation, ConflictHttpException::class, 'Command tugas menolak revisi lama sebelum perubahan.');
}
expectWorkspace(AuditLog::count() === $auditCount && Task::find($task->getKey()) !== null, 'Konflik tidak mencatat keputusan palsu atau menghapus tugas.');
rejectsWorkspace(fn () => $update->handle($student, $task, ['title' => 'Tidak punya revisi']), ValidationException::class, 'Revisi tidak boleh dilewati oleh Action.');
rejectsWorkspace(fn () => $assign->handle($student, $task, $outsider, workspaceRevision($task)), AuthorizationException::class, 'Anggota lintas kampus tidak bisa ditugaskan.');
$done = $transition->handle($student, $task, TaskStatus::Done, workspaceRevision($task));
expectWorkspace($done->status === TaskStatus::Done, 'Tombol command menyelesaikan tugas tanpa drag.');
$transition->handle($student, $task, TaskStatus::Todo, workspaceRevision($task));
$unassign->handle($student, $task, $student, workspaceRevision($task));
expectWorkspace($task->fresh()->assignments()->count() === 0, 'Lepas penanggung jawab dengan revisi terbaru berhasil.');
$assign->handle($student, $task, $student, workspaceRevision($task));
$more = $create->handle($owner, $project, ['title' => 'Tugas lain. Data sintetis']);
$assign->handle($owner, $more, $student, workspaceRevision($more));
$unassigned = $create->handle($owner, $project, ['title' => 'Belum dibagi. Data sintetis']);
Auth::setUser($student);
$controller = app(ProjectWorkspaceController::class);
function workspacePage(Project $project, User $user, array $query = []): array
{
    $route = new Route('GET', 'projects/{project}/workspace', fn () => null);
    $route->name('projects.workspace');
    $route->bind(Request::create('/projects/'.$project->getKey().'/workspace'));
    $route->setParameter('project', $project);
    $request = ShowTaskWorkspaceRequest::create('/projects/'.$project->getKey().'/workspace', 'GET', $query);
    $request->setRouteResolver(fn () => $route);
    $request->setUserResolver(fn () => $user);
    $request->setContainer(app());
    $request->setRedirector(app('redirect'));
    $request->headers->set('X-Inertia', 'true');
    $request->validateResolved();
    $response = app()->call([app(ProjectWorkspaceController::class), 'show'], ['request' => $request, 'project' => $project]);

    return $response->toResponse($request)->getData(true)['props'];
}
$snapshot = [Task::count(), Attachment::count(), AuditLog::count(), Message::count()];
DB::enableQueryLog();
DB::flushQueryLog();
$mine = workspacePage($project, $student, ['scope' => 'mine', 'per_page' => 1, 'page' => 2]);
expectWorkspace($mine['tasks']['meta']['total'] === 2 && count($mine['tasks']['data']) === 1 && $mine['filters']['scope'] === 'mine', 'Tugas saya berlaku di server sebelum pagination.');
$free = workspacePage($project, $student, ['scope' => 'unassigned']);
expectWorkspace(array_column($free['tasks']['data'], 'id') === [$unassigned->getKey()], 'Belum ditugaskan tidak tercampur dengan tanggung jawab anggota.');
$specific = workspacePage($project, $student, ['task' => $task->getKey()]);
expectWorkspace(array_column($specific['tasks']['data'], 'id') === [$task->getKey()], 'Arahan Beranda membuka tugas yang ditunjuk.');
$empty = workspacePage($project, $student, ['task' => 999999]);
expectWorkspace($empty['tasks']['meta']['total'] === 0, 'Tugas hilang tidak diganti dengan tugas lain diam-diam.');
expectWorkspace(array_all(DB::getQueryLog(), fn (array $row): bool => preg_match('/^\s*(select|pragma)\b/i', $row['query']) === 1) && $snapshot === [Task::count(), Attachment::count(), AuditLog::count(), Message::count()], 'GET ruang kerja hanya membaca, tanpa default data atau audit baru.');
DB::disableQueryLog();
rejectsWorkspace(fn () => workspacePage($foreign, $student), AuthorizationException::class, 'Ruang kerja tenant lain ditolak.');
foreach (['AssignTaskRequest', 'UnassignTaskRequest', 'UpdateTaskRequest', 'TransitionTaskRequest', 'DeleteTaskRequest'] as $name) {
    $class = 'App\\Http\\Requests\\Task\\'.$name;
    $request = new $class;
    expectWorkspace(Validator::make([], ['expected_revision' => $request->rules()['expected_revision']])->fails(), $name.' mewajibkan revisi.');
}
$upload = app(UploadAttachment::class);
$file = fn () => UploadedFile::fake()->createWithContent('hasil.txt', "Bukti sintetis untuk pengujian T07.\nHasil pekerjaan dapat diperiksa.");
$proof = $upload->handle($student, $project, $file(), purpose: AttachmentPurpose::Evidence);
expectWorkspace($proof->message_id === null && Message::count() === 0 && Storage::disk('private')->exists($proof->path), 'Bukti tersimpan tanpa pesan pada disk privat terisolasi.');
$evidence = app(WorkspaceEvidenceQuery::class);
$list = $evidence->execute($student, $project);
expectWorkspace($list['data'][0]['id'] === $proof->getKey() && ! str_contains(json_encode($list, JSON_THROW_ON_ERROR), $proof->path) && ! array_key_exists('sha256', $list['data'][0]), 'Proyeksi bukti tidak membocorkan path, checksum atau metadata privat profil.');
$fileCount = count(Storage::disk('private')->allFiles());
rejectsWorkspace(fn () => $upload->handle($student, $project, $file(), purpose: AttachmentPurpose::Evidence), ValidationException::class, 'Unggah ulang checksum sama ditolak tanpa duplikasi.');
expectWorkspace(Attachment::count() === 1 && count(Storage::disk('private')->allFiles()) === $fileCount, 'Kegagalan duplikat membersihkan berkas sementara miliknya.');
rejectsWorkspace(fn () => $upload->handle($student, $project, UploadedFile::fake()->createWithContent('script.php', '<?php echo 1;'), purpose: AttachmentPurpose::Evidence), ValidationException::class, 'Tipe berkas berbahaya ditolak.');
rejectsWorkspace(fn () => $upload->handle($student, $project, UploadedFile::fake()->createWithContent('palsu.exe', 'Teks sintetis biasa.'), purpose: AttachmentPurpose::Evidence), ValidationException::class, 'Ekstensi berbahaya ditolak walaupun MIME menyerupai teks yang diizinkan.');
rejectsWorkspace(fn () => $upload->handle($student, $project, UploadedFile::fake()->create('besar.pdf', 10241, 'application/pdf'), purpose: AttachmentPurpose::Evidence), ValidationException::class, 'Berkas di atas 10 MB ditolak.');
for ($number = 0; $number < 11; $number++) {
    Attachment::factory()->evidence()->create(['project_id' => $project->getKey(), 'uploaded_by_id' => $student->getKey()]);
}
$message = Message::factory()->create(['project_id' => $project->getKey(), 'author_id' => $student->getKey()]);
Attachment::factory()->evidence()->forMessage($message)->create(['uploaded_by_id' => $student->getKey()]);
Attachment::factory()->evidence()->create(['project_id' => $foreign->getKey(), 'uploaded_by_id' => $outsider->getKey()]);
$second = $evidence->execute($student, $project, 2);
expectWorkspace($second['meta']['total'] === 12 && count($second['data']) === 2, 'Pagination bukti tidak mencampur pesan atau tenant lain.');
foreach ([$outsider, $admin] as $actor) {
    rejectsWorkspace(fn () => $evidence->execute($actor, $project), AuthorizationException::class, 'Daftar bukti workspace tidak membuka akses role/tenant lain.');
}
$membership = InstitutionMembership::query()->where('institution_id', $campus->getKey())->where('user_id', $student->getKey())->firstOrFail();
foreach ([InstitutionMembershipStatus::Pending, InstitutionMembershipStatus::Suspended] as $state) {
    $membership->forceFill(['status' => $state])->save();
    rejectsWorkspace(fn () => $evidence->execute($student, $project), AuthorizationException::class, 'Afiliasi '.$state->value.' tidak membaca bukti.');
    rejectsWorkspace(fn () => $update->handle($student, $task, ['title' => 'Tidak diizinkan', 'expected_revision' => workspaceRevision($task)]), AuthorizationException::class, 'Afiliasi '.$state->value.' tidak mengubah tugas.');
}
$membership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
$team->forceFill(['status' => TeamMembershipStatus::Left, 'left_at' => now()])->save();
expectWorkspace(! Gate::forUser($student)->allows('view', $proof), 'Keluar dari tim menutup download bukti privat.');
rejectsWorkspace(fn () => $evidence->execute($student, $project), AuthorizationException::class, 'Keluar dari tim menutup daftar bukti.');
$team->forceFill(['status' => TeamMembershipStatus::Active, 'left_at' => null])->save();
$project->forceFill(['status' => ProjectStatus::Closed])->save();
rejectsWorkspace(fn () => $evidence->execute($student, $project->fresh()), AuthorizationException::class, 'Proyek ditutup tidak membuka ruang kerja baru.');
$project->forceFill(['status' => ProjectStatus::Open])->save();
Event::fake([WorkspaceTaskChanged::class, WorkspaceAttachmentChanged::class]);
$before = Task::count();
DB::beginTransaction();
$create->handle($student, $project, ['title' => 'Transaksi rollback. Data sintetis']);
expectWorkspace(Event::dispatched(WorkspaceTaskChanged::class)->isEmpty(), 'Delta tugas belum diterbitkan sebelum commit.');
DB::rollBack();
expectWorkspace(Task::count() === $before, 'Rollback tidak menyimpan tugas atau memancarkan delta.');
DB::beginTransaction();
$create->handle($student, $project, ['title' => 'Transaksi commit. Data sintetis']);
expectWorkspace(Event::dispatched(WorkspaceTaskChanged::class)->isEmpty(), 'Delta tugas belum diterbitkan sebelum commit.');
DB::commit();
expectWorkspace(Event::dispatched(WorkspaceTaskChanged::class)->count() === 1, 'Commit menerbitkan tepat satu delta tugas.');
expectWorkspace(true, 'Delta tugas hanya diterbitkan sesudah commit luar.');
Event::fake([WorkspaceAttachmentChanged::class]);
DB::beginTransaction();
$rolledProof = $upload->handle($student, $project, UploadedFile::fake()->createWithContent('rollback.txt', 'Bukti sintetis rollback luar.'), purpose: AttachmentPurpose::Evidence);
expectWorkspace(Event::dispatched(WorkspaceAttachmentChanged::class)->isEmpty(), 'Delta bukti belum diterbitkan sebelum commit luar.');
DB::rollBack();
expectWorkspace(Attachment::find($rolledProof->getKey()) === null && ! Storage::disk('private')->exists($rolledProof->path), 'Rollback luar menghapus metadata serta file bukti yang dibuatnya.');
$proof2 = $upload->handle($student, $project, UploadedFile::fake()->createWithContent('kedua.txt', 'Bukti sintetis kedua.'), purpose: AttachmentPurpose::Evidence);
expectWorkspace(Event::dispatched(WorkspaceAttachmentChanged::class)->count() === 1, 'Unggah tanpa pesan menerbitkan delta bukti.');
$delta = new WorkspaceAttachmentChanged($campus->getKey(), $project->getKey(), $proof2->getKey(), 'attachment.created', null, now()->toIso8601String());
expectWorkspace(array_keys($delta->broadcastWith()) === ['resource', 'operation', 'resource_id', 'project_id', 'institution_id', 'version', 'occurred_at'] && $delta->broadcastOn()[0]->name === 'private-institutions.'.$campus->getKey().'.projects.'.$project->getKey().'.workspace', 'Delta bukti memakai allowlist dan channel privat tenant/proyek.');
app(DeleteAttachment::class)->handle($student, $proof2);
expectWorkspace(! Storage::disk('private')->exists($proof2->path) && Attachment::find($proof2->getKey()) === null, 'Hapus bukti membersihkan file setelah commit dan menyembunyikan metadata aktif.');
expectWorkspace(Event::dispatched(WorkspaceAttachmentChanged::class)->count() === 2, 'Hapus tanpa pesan menerbitkan delta bukti.');
$delete->handle($student, $unassigned, workspaceRevision($unassigned));
expectWorkspace(Task::find($unassigned->getKey()) === null, 'Hapus tugas hanya berhasil dengan revisi terbaru.');
expectWorkspace(AuditLog::query()->where('operation', 'task.deleted')->exists(), 'Audit penghapusan tetap tersimpan.');

require $app->basePath('routes/channels.php');
$channel = Broadcast::getChannels()['institutions.{institution}.projects.{project}.workspace'];
expectWorkspace($channel($student, $campus, $project) && ! $channel($student, $other, $project) && ! $channel($outsider, $campus, $project) && ! $channel($admin, $campus, $project), 'Channel workspace memeriksa tenant serta keanggotaan mahasiswa aktual.');

$injectAudit = false;
DB::listen(function ($query) use (&$injectAudit): void {
    if ($injectAudit && preg_match('/^insert into ["`]audit_logs/i', $query->sql) === 1) {
        $injectAudit = false;
        throw new RuntimeException('Gangguan audit sintetis.');
    }
});
$taskCount = Task::count();
$auditCount = AuditLog::count();
Event::fake([WorkspaceTaskChanged::class, WorkspaceAttachmentChanged::class]);
$injectAudit = true;
rejectsWorkspace(fn () => $create->handle($student, $project, ['title' => 'Gagal audit. Data sintetis']), RuntimeException::class, 'Kegagalan di tengah penyimpanan tugas membatalkan command.');
expectWorkspace(Task::count() === $taskCount && AuditLog::count() === $auditCount && Event::dispatched(WorkspaceTaskChanged::class)->isEmpty(), 'Kegagalan tugas tidak meninggalkan data parsial atau delta palsu.');
$proofCount = Attachment::count();
$fileCount = count(Storage::disk('private')->allFiles());
$injectAudit = true;
rejectsWorkspace(fn () => $upload->handle($student, $project, UploadedFile::fake()->createWithContent('gagal-audit.txt', 'Bukti sintetis yang gagal audit.'), purpose: AttachmentPurpose::Evidence), RuntimeException::class, 'Kegagalan metadata bukti membatalkan unggahan.');
expectWorkspace(Attachment::count() === $proofCount && AuditLog::count() === $auditCount && count(Storage::disk('private')->allFiles()) === $fileCount && Event::dispatched(WorkspaceAttachmentChanged::class)->isEmpty(), 'Kegagalan bukti tidak meninggalkan file yatim, metadata atau delta palsu.');

Storage::disk('private')->delete(Storage::disk('private')->allFiles());
echo 'PASS '.$checks.' pemeriksaan ruang kerja.'.PHP_EOL;
