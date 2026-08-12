<?php

declare(strict_types=1);

use App\Actions\Discussion\CreateDiscussion;
use App\Actions\Task\CreateTask;
use App\Events\WorkspaceDiscussionChanged;
use App\Events\WorkspaceTaskChanged;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\Factory as BroadcastingFactory;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

/**
 * @return array{owner: User, member: User, nonMember: User, foreignStudent: User, institution: Institution, foreignInstitution: Institution, project: Project}
 */
function workspaceRealtimeContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = workspaceRealtimeStudent($institution, 'Realtime Owner');
    $member = workspaceRealtimeStudent($institution, 'Realtime Member');
    $nonMember = workspaceRealtimeStudent($institution, 'Realtime Non Member');

    $project = Project::factory()
        ->open()
        ->for($owner, 'owner')
        ->for($institution)
        ->create();

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = workspaceRealtimeStudent($foreignInstitution, 'Foreign Realtime Student');

    return compact('owner', 'member', 'nonMember', 'foreignStudent', 'institution', 'foreignInstitution', 'project');
}

function workspaceRealtimeStudent(Institution $institution, string $name): User
{
    $student = User::factory()->create(['name' => $name]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

test('workspace channel authorization is restricted to the active project team', function () {
    [
        'owner' => $owner,
        'member' => $member,
        'nonMember' => $nonMember,
        'foreignStudent' => $foreignStudent,
        'foreignInstitution' => $foreignInstitution,
        'institution' => $institution,
        'project' => $project,
    ] = workspaceRealtimeContext();

    $workspaceChannel = Broadcast::getChannels()->get('institutions.{institution}.projects.{project}.workspace');
    $presenceChannel = Broadcast::getChannels()->get('institutions.{institution}.projects.{project}.presence');

    expect($workspaceChannel)->toBeCallable()
        ->and($presenceChannel)->toBeCallable()
        ->and($workspaceChannel($owner, $institution, $project))->toBeTrue()
        ->and($workspaceChannel($member, $institution, $project))->toBeTrue()
        ->and($workspaceChannel($nonMember, $institution, $project))->toBeFalse()
        ->and($workspaceChannel($foreignStudent, $institution, $project))->toBeFalse()
        ->and($workspaceChannel($member, $foreignInstitution, $project))->toBeFalse()
        ->and($presenceChannel($member, $institution, $project))->toBe([
            'id' => (string) $member->getKey(),
            'name' => $member->name,
        ])
        ->and($presenceChannel($nonMember, $institution, $project))->toBeFalse()
        ->and($presenceChannel($foreignStudent, $institution, $project))->toBeFalse();
});

test('workspace deltas use private channels and an allowlisted payload', function () {
    $taskEvent = new WorkspaceTaskChanged(
        institutionId: 9,
        projectId: 17,
        resourceId: 42,
        operation: 'task.updated',
        version: '2026-08-12T10:00:00+00:00',
        occurredAt: '2026-08-12T10:00:01+00:00',
    );
    $discussionEvent = new WorkspaceDiscussionChanged(
        institutionId: 9,
        projectId: 17,
        resourceId: 43,
        operation: 'discussion.created',
        version: '2026-08-12T10:00:00+00:00',
        occurredAt: '2026-08-12T10:00:01+00:00',
    );

    expect($taskEvent)->toBeInstanceOf(ShouldBroadcast::class)
        ->and($taskEvent)->toBeInstanceOf(ShouldDispatchAfterCommit::class)
        ->and($taskEvent->broadcastAs())->toBe('workspace.task.changed')
        ->and($taskEvent->broadcastQueue())->toBe('default')
        ->and($taskEvent->tries)->toBe(3)
        ->and($taskEvent->backoff)->toBe([1, 5, 10])
        ->and($taskEvent->broadcastOn()[0])->toBeInstanceOf(PrivateChannel::class)
        ->and((string) $taskEvent->broadcastOn()[0])->toBe('private-institutions.9.projects.17.workspace')
        ->and($taskEvent->broadcastWith())->toBe([
            'resource' => 'task',
            'operation' => 'task.updated',
            'resource_id' => 42,
            'project_id' => 17,
            'institution_id' => 9,
            'version' => '2026-08-12T10:00:00+00:00',
            'occurred_at' => '2026-08-12T10:00:01+00:00',
        ])
        ->and($discussionEvent->broadcastAs())->toBe('workspace.discussion.changed')
        ->and($discussionEvent->broadcastWith()['resource'])->toBe('discussion');
});

test('workspace mutations dispatch task and discussion deltas after a successful commit', function () {
    ['owner' => $owner, 'project' => $project] = workspaceRealtimeContext();
    Event::fake([
        WorkspaceTaskChanged::class,
        WorkspaceDiscussionChanged::class,
    ]);

    $task = app(CreateTask::class)->handle($owner, $project, [
        'title' => 'Publish workspace delta contract',
    ]);
    $message = app(CreateDiscussion::class)->handle($owner, $project, [
        'body' => 'Realtime contract is ready for review.',
    ]);

    Event::assertDispatched(WorkspaceTaskChanged::class, fn (WorkspaceTaskChanged $event): bool => $event->projectId === $project->getKey()
        && $event->institutionId === $project->institution_id
        && $event->resourceId === $task->getKey()
        && $event->operation === 'task.created');
    Event::assertDispatched(WorkspaceDiscussionChanged::class, fn (WorkspaceDiscussionChanged $event): bool => $event->projectId === $project->getKey()
        && $event->institutionId === $project->institution_id
        && $event->resourceId === $message->getKey()
        && $event->operation === 'discussion.created');
});

test('workspace deltas are discarded when the transaction rolls back', function () {
    Event::fake([
        WorkspaceTaskChanged::class,
    ]);

    expect(fn () => DB::transaction(function (): void {
        WorkspaceTaskChanged::dispatch(
            institutionId: 9,
            projectId: 17,
            resourceId: 42,
            operation: 'task.updated',
            version: null,
            occurredAt: now()->toIso8601String(),
        );

        throw new RuntimeException('rollback workspace mutation');
    }))->toThrow(RuntimeException::class);

    Event::assertNotDispatched(WorkspaceTaskChanged::class);
});

test('workspace mutations queue a broadcast job without making the database depend on delivery', function () {
    ['owner' => $owner, 'project' => $project] = workspaceRealtimeContext();
    $task = Task::factory()->for($project)->for($owner, 'createdBy')->create();
    $event = new WorkspaceTaskChanged(
        institutionId: (int) $project->institution_id,
        projectId: (int) $project->getKey(),
        resourceId: (int) $task->getKey(),
        operation: 'task.updated',
        version: $task->updated_at?->toIso8601String(),
        occurredAt: now()->toIso8601String(),
    );
    $broadcastJob = new BroadcastEvent($event);
    expect($broadcastJob->tries)->toBe(3)
        ->and($broadcastJob->backoff)->toBe([1, 5, 10]);

    $failingFactory = Mockery::mock(BroadcastingFactory::class);
    $failingFactory->shouldReceive('connection')
        ->once()
        ->andThrow(new RuntimeException('Reverb unavailable'));

    expect(fn () => $broadcastJob->handle($failingFactory))
        ->toThrow(RuntimeException::class);
    expect(Task::query()->whereKey($task)->exists())->toBeTrue();

    Queue::fake();
    $transactions = app()->bound('db.transactions') ? app('db.transactions') : null;
    app()->forgetInstance('db.transactions');

    try {
        WorkspaceTaskChanged::dispatch(
            institutionId: (int) $project->institution_id,
            projectId: (int) $project->getKey(),
            resourceId: (int) $task->getKey(),
            operation: 'task.updated',
            version: $task->updated_at?->toIso8601String(),
            occurredAt: now()->toIso8601String(),
        );

        Queue::assertPushedOn('default', BroadcastEvent::class, function (BroadcastEvent $job) use ($project, $task): bool {
            return $job->event instanceof WorkspaceTaskChanged
                && $job->event->projectId === $project->getKey()
                && $job->event->resourceId === $task->getKey();
        });
    } finally {
        if ($transactions !== null) {
            app()->instance('db.transactions', $transactions);
        }
    }
});
