<?php

use App\Actions\Task\AssignTask;
use App\Actions\Task\CreateTask;
use App\Actions\Task\DeleteTask;
use App\Actions\Task\TransitionTaskStatus;
use App\Actions\Task\UnassignTask;
use App\Actions\Task\UpdateTask;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Exceptions\InvalidTaskTransition;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution, 2: Project}
 */
function taskWorkspaceContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($owner, 'owner')
        ->for($institution)
        ->create();

    return [$owner, $institution, $project];
}

function taskVerifiedStudent(Institution $institution): User
{
    $student = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

function taskActiveMember(Project $project, Institution $institution): User
{
    $member = taskVerifiedStudent($institution);

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    return $member;
}

test('task schema has bounded foreign keys, unique assignments, and ordering indexes', function () {
    expect(Schema::hasTable('tasks'))->toBeTrue()
        ->and(Schema::hasTable('task_assignments'))->toBeTrue()
        ->and(Schema::hasColumns('tasks', [
            'project_id',
            'created_by_id',
            'title',
            'description',
            'status',
            'priority',
            'due_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('task_assignments', [
            'task_id',
            'user_id',
            'assigned_by_id',
        ]))->toBeTrue();

    $taskMigration = file_get_contents(
        database_path('migrations/2026_08_12_065436_create_tasks_table.php'),
    );
    $assignmentMigration = file_get_contents(
        database_path('migrations/2026_08_12_065437_create_task_assignments_table.php'),
    );

    expect($taskMigration)->toBeString()
        ->toContain("'tasks_project_fk'")
        ->toContain("'tasks_creator_fk'")
        ->toContain("'tasks_project_order_idx'")
        ->and($assignmentMigration)->toBeString()
        ->toContain("'task_assignments_task_user_unique'")
        ->toContain("'task_assignments_assigner_fk'");
});

test('owner can create and update a task within the project deadline', function () {
    [$owner, , $project] = taskWorkspaceContext();
    $dueAt = now()->addDays(3);

    $task = app(CreateTask::class)->handle($owner, $project, [
        'title' => 'Susun kontrak API workspace',
        'description' => 'Pastikan response command aman untuk tenant.',
        'priority' => TaskPriority::High,
        'due_at' => $dueAt,
    ]);

    expect($task->status)->toBe(TaskStatus::Todo)
        ->and($task->priority)->toBe(TaskPriority::High)
        ->and($task->due_at?->toDateTimeString())->toBe($dueAt->toDateTimeString())
        ->and($task->project_id)->toBe($project->getKey())
        ->and($task->created_by_id)->toBe($owner->getKey())
        ->and(AuditLog::query()->where('operation', 'task.created')->exists())->toBeTrue();

    $updated = app(UpdateTask::class)->handle($owner, $task, [
        'title' => 'Susun kontrak API dan reconciliation',
        'priority' => TaskPriority::Urgent,
        'due_at' => now()->addDays(5),
    ]);

    expect($updated->title)->toBe('Susun kontrak API dan reconciliation')
        ->and($updated->priority)->toBe(TaskPriority::Urgent)
        ->and($updated->due_at?->isFuture())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'task.updated')->exists())->toBeTrue();
});

test('due date cannot exceed the project deadline and overdue state is derived from current state', function () {
    [$owner, , $project] = taskWorkspaceContext();

    expect(fn () => app(CreateTask::class)->handle($owner, $project, [
        'title' => 'Task melewati deadline project',
        'due_at' => $project->deadline->copy()->addSecond(),
    ]))->toThrow(ValidationException::class);

    $overdue = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'due_at' => now()->subDay(),
            'status' => TaskStatus::InProgress,
        ]);

    expect($overdue->isOverdue())->toBeTrue();

    $overdue->forceFill(['status' => TaskStatus::Done])->save();

    expect($overdue->fresh()->isOverdue())->toBeFalse();
});

test('task status commands enforce the lifecycle and allow an explicit reopen', function () {
    [$owner, , $project] = taskWorkspaceContext();
    $task = Task::factory()->for($project)->for($owner, 'createdBy')->create();

    $inProgress = app(TransitionTaskStatus::class)->handle(
        $owner,
        $task,
        TaskStatus::InProgress,
    );
    $done = app(TransitionTaskStatus::class)->handle($owner, $inProgress, TaskStatus::Done);

    expect($done->status)->toBe(TaskStatus::Done);

    expect(fn () => app(TransitionTaskStatus::class)->handle(
        $owner,
        $done,
        TaskStatus::Blocked,
    ))->toThrow(InvalidTaskTransition::class);

    $reopened = app(TransitionTaskStatus::class)->handle(
        $owner,
        $done,
        TaskStatus::InProgress,
    );

    expect($reopened->status)->toBe(TaskStatus::InProgress)
        ->and(AuditLog::query()->where('operation', 'task.status_changed')->count())->toBe(3);
});

test('assignment commands only target a verified active project participant', function () {
    [$owner, $institution, $project] = taskWorkspaceContext();
    $task = Task::factory()->for($project)->for($owner, 'createdBy')->create();
    $member = taskActiveMember($project, $institution);
    $nonMember = taskVerifiedStudent($institution);

    $assignment = app(AssignTask::class)->handle($owner, $task, $member);

    expect($assignment->user_id)->toBe($member->getKey())
        ->and($task->fresh()->assignees()->whereKey($member)->exists())->toBeTrue();

    expect(fn () => app(AssignTask::class)->handle($owner, $task, $nonMember))
        ->toThrow(AuthorizationException::class);

    $removed = app(UnassignTask::class)->handle($owner, $task, $member);

    expect($removed?->getKey())->toBe($assignment->getKey())
        ->and($task->assignments()->count())->toBe(0)
        ->and(AuditLog::query()->where('operation', 'task.assigned')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'task.unassigned')->exists())->toBeTrue();
});

test('task policy denies a foreign tenant, a non-member, and a left member', function () {
    [$owner, $institution, $project] = taskWorkspaceContext();
    $task = Task::factory()->for($project)->for($owner, 'createdBy')->create();
    $nonMember = taskVerifiedStudent($institution);
    $leftMember = taskVerifiedStudent($institution);
    TeamMembership::factory()
        ->left()
        ->for($project)
        ->for($leftMember)
        ->create();

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = taskVerifiedStudent($foreignInstitution);

    expect(Gate::forUser($nonMember)->denies('view', $task))->toBeTrue()
        ->and(Gate::forUser($leftMember)->denies('view', $task))->toBeTrue()
        ->and(Gate::forUser($foreignStudent)->denies('view', $task))->toBeTrue();

    expect(fn () => app(UpdateTask::class)->handle($foreignStudent, $task, [
        'title' => 'Tidak boleh lintas tenant',
    ]))->toThrow(AuthorizationException::class);
});

test('task ordering is deterministic for blocked work, priority, due date, and completion', function () {
    [$owner, , $project] = taskWorkspaceContext();
    $blocked = Task::factory()
        ->blocked()
        ->lowPriority()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['due_at' => now()->addDays(4)]);
    $urgentInProgress = Task::factory()
        ->inProgress()
        ->urgent()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['due_at' => now()->addDays(6)]);
    $urgentTodo = Task::factory()
        ->todo()
        ->urgent()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['due_at' => now()->addDay()]);
    $done = Task::factory()
        ->done()
        ->urgent()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['due_at' => now()->subDay()]);

    $orderedIds = Task::query()
        ->forProject($project)
        ->ordered()
        ->pluck('id')
        ->all();

    expect($orderedIds)->toBe([
        $blocked->getKey(),
        $urgentInProgress->getKey(),
        $urgentTodo->getKey(),
        $done->getKey(),
    ]);
});

test('deleting a task removes current assignments while retaining audit evidence', function () {
    [$owner, $institution, $project] = taskWorkspaceContext();
    $member = taskActiveMember($project, $institution);
    $task = Task::factory()->for($project)->for($owner, 'createdBy')->create();
    app(AssignTask::class)->handle($owner, $task, $member);

    app(DeleteTask::class)->handle($owner, $task);

    expect(Task::query()->whereKey($task)->exists())->toBeFalse()
        ->and($task->assignments()->count())->toBe(0)
        ->and(AuditLog::query()->where('operation', 'task.deleted')->exists())->toBeTrue();
});
