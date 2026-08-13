<?php

declare(strict_types=1);

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array{owner: User, member: User, institution: Institution, project: Project}
 */
function workspaceControllerContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create(['name' => 'Owner Workspace']);
    $member = User::factory()->create(['name' => 'Member Workspace']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($member)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($owner, 'owner')
        ->for($institution)
        ->create([
            'title' => 'Workspace API project',
        ]);

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    return compact('owner', 'member', 'institution', 'project');
}

test('owner and active member receive a tenant-safe workspace projection', function () {
    ['owner' => $owner, 'member' => $member, 'project' => $project] = workspaceControllerContext();
    $task = Task::factory()
        ->inProgress()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task yang terlihat team',
            'priority' => TaskPriority::High,
        ]);
    Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create(['body' => 'Catatan awal workspace']);

    $this->actingAs($owner)
        ->get(route('projects.workspace', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/workspace')
            ->where('project.id', $project->getKey())
            ->where('project.institution_id', $project->institution_id)
            ->where('project.title', 'Workspace API project')
            ->where('tasks.data.0.id', $task->getKey())
            ->where('tasks.data.0.title', 'Task yang terlihat team')
            ->where('tasks.data.0.created_by.name', $owner->name)
            ->where('discussion.data.0.body', 'Catatan awal workspace')
            ->where('members.0.id', $owner->getKey())
            ->where('permissions.can_manage_tasks', true));

    $this->actingAs($member)
        ->get(route('projects.workspace', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/workspace')
            ->where('tasks.data.0.id', $task->getKey())
            ->where('permissions.can_create', true));
});

test('workspace denies a non-member and keeps child task binding inside the project', function () {
    ['owner' => $owner, 'institution' => $institution, 'project' => $project] = workspaceControllerContext();
    $reader = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($reader)
        ->for($institution)
        ->create();
    $otherProject = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $foreignTask = Task::factory()
        ->for($otherProject)
        ->for($owner, 'createdBy')
        ->create();

    $this->actingAs($reader)
        ->get(route('projects.workspace', $project))
        ->assertForbidden();

    $this->actingAs($owner)
        ->patchJson(route('projects.workspace.tasks.update', [
            'project' => $project,
            'task' => $foreignTask,
        ]), [
            'title' => 'Tidak boleh lintas project',
        ])
        ->assertNotFound();
});

test('team can manage a task through the workspace commands', function () {
    ['owner' => $owner, 'member' => $member, 'project' => $project] = workspaceControllerContext();
    $this->actingAs($member);

    $created = $this->postJson(
        route('projects.workspace.tasks.store', $project),
        [
            'title' => 'Susun alur handoff',
            'description' => 'Catat hasil dan next action untuk anggota berikutnya.',
            'priority' => TaskPriority::High->value,
            'due_at' => now()->addDays(2)->toDateTimeString(),
        ],
    );

    $created
        ->assertCreated()
        ->assertJsonPath('data.title', 'Susun alur handoff')
        ->assertJsonPath('data.status', TaskStatus::Todo->value);

    $task = Task::query()->findOrFail($created->json('data.id'));

    $this->patchJson(
        route('projects.workspace.tasks.update', [
            'project' => $project,
            'task' => $task,
        ]),
        [
            'title' => 'Susun alur handoff final',
            'description' => null,
            'priority' => TaskPriority::Urgent->value,
            'due_at' => now()->addDays(3)->toDateTimeString(),
            'expected_updated_at' => $task->updated_at->toIso8601String(),
        ],
    )
        ->assertOk()
        ->assertJsonPath('data.title', 'Susun alur handoff final')
        ->assertJsonPath('data.priority', TaskPriority::Urgent->value);

    $task->refresh();

    $this->postJson(
        route('projects.workspace.tasks.transition', [
            'project' => $project,
            'task' => $task,
        ]),
        [
            'status' => TaskStatus::InProgress->value,
            'expected_updated_at' => $task->updated_at->toIso8601String(),
        ],
    )
        ->assertOk()
        ->assertJsonPath('data.status', TaskStatus::InProgress->value);

    $this->postJson(
        route('projects.workspace.tasks.assign', [
            'project' => $project,
            'task' => $task,
        ]),
        ['assignee_id' => $owner->getKey()],
    )
        ->assertOk()
        ->assertJsonPath('data.user.id', $owner->getKey());

    $this->deleteJson(
        route('projects.workspace.tasks.unassign', [
            'project' => $project,
            'task' => $task,
        ]),
        ['assignee_id' => $owner->getKey()],
    )
        ->assertOk()
        ->assertJsonPath('data.user_id', $owner->getKey());

    $this->deleteJson(
        route('projects.workspace.tasks.destroy', [
            'project' => $project,
            'task' => $task,
        ]),
    )
        ->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(Task::query()->whereKey($task)->exists())->toBeFalse();
});

test('workspace rejects a stale task edit without changing the database state', function () {
    ['owner' => $owner, 'project' => $project] = workspaceControllerContext();
    $task = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Judul dari snapshot lama',
        ]);
    $expectedUpdatedAt = $task->updated_at->toIso8601String();

    $task->forceFill([
        'title' => 'Judul yang sudah diperbarui sesi lain',
        'updated_at' => now()->addMinute(),
    ])->save();

    $this->actingAs($owner)
        ->patchJson(
            route('projects.workspace.tasks.update', [
                'project' => $project,
                'task' => $task,
            ]),
            [
                'title' => 'Draft lokal yang stale',
                'expected_updated_at' => $expectedUpdatedAt,
            ],
        )
        ->assertConflict();

    expect($task->refresh()->title)->toBe('Judul yang sudah diperbarui sesi lain');
});

test('workspace query budget stays bounded as task and discussion volume grows', function () {
    ['owner' => $owner, 'project' => $project] = workspaceControllerContext();

    collect(range(1, 3))->each(function (int $number) use ($project, $owner): void {
        Task::factory()
            ->todo()
            ->for($project)
            ->for($owner, 'createdBy')
            ->create([
                'title' => 'Baseline workspace task '.$number,
            ]);

        Message::factory()
            ->for($project)
            ->for($owner, 'author')
            ->create([
                'body' => 'Baseline workspace discussion '.$number,
            ]);
    });

    $baseline = measureDatabaseQueries(function () use ($owner, $project): void {
        $this->actingAs($owner)
            ->get(route('projects.workspace', [
                'project' => $project,
                'per_page' => 2,
            ]))
            ->assertSuccessful();
    });

    collect(range(4, 251))->each(function (int $number) use ($project, $owner): void {
        Task::factory()
            ->todo()
            ->for($project)
            ->for($owner, 'createdBy')
            ->create([
                'title' => 'Workspace volume task '.$number,
            ]);

        Message::factory()
            ->for($project)
            ->for($owner, 'author')
            ->create([
                'body' => 'Workspace volume discussion '.$number,
            ]);
    });

    $expanded = measureDatabaseQueries(function () use ($owner, $project): void {
        $this->actingAs($owner)
            ->get(route('projects.workspace', [
                'project' => $project,
                'per_page' => 2,
            ]))
            ->assertSuccessful();
    });

    expect($expanded['total'])->toBe($baseline['total']);
});

test('workspace filters and paginates tasks from the database snapshot', function () {
    ['owner' => $owner, 'project' => $project] = workspaceControllerContext();
    Task::factory()
        ->blocked()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['title' => 'Task terblokir']);
    Task::factory()
        ->done()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create(['title' => 'Task selesai']);

    $this->actingAs($owner)
        ->get(route('projects.workspace', [
            'project' => $project,
            'status' => TaskStatus::Blocked->value,
            'per_page' => 1,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tasks.meta.total', 1)
            ->where('tasks.meta.per_page', 1)
            ->where('tasks.data.0.title', 'Task terblokir')
            ->where('filters.status', TaskStatus::Blocked->value));
});

test('workspace keeps large task and discussion ranges paginated', function () {
    ['owner' => $owner, 'project' => $project] = workspaceControllerContext();

    Task::factory()
        ->count(250)
        ->for($project)
        ->for($owner, 'createdBy')
        ->create();
    Message::factory()
        ->count(250)
        ->for($project)
        ->for($owner, 'author')
        ->create();

    $this->actingAs($owner)
        ->get(route('projects.workspace', [
            'project' => $project,
            'per_page' => 50,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tasks.meta.total', 250)
            ->where('tasks.meta.per_page', 50)
            ->where('tasks.meta.last_page', 5)
            ->has('tasks.data', 50)
            ->where('discussion.meta.total', 250)
            ->where('discussion.meta.last_page', 13)
            ->has('discussion.data', 20));

    $this->actingAs($owner)
        ->getJson(route('projects.workspace.discussions.index', [
            'project' => $project,
            'per_page' => 50,
            'page' => 5,
        ]))
        ->assertSuccessful()
        ->assertJsonCount(50, 'data')
        ->assertJsonPath('meta.total', 250)
        ->assertJsonPath('meta.current_page', 5)
        ->assertJsonPath('meta.last_page', 5);
});
