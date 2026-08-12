<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Task\AssignTask;
use App\Actions\Task\CreateTask;
use App\Actions\Task\DeleteTask;
use App\Actions\Task\TransitionTaskStatus;
use App\Actions\Task\UnassignTask;
use App\Actions\Task\UpdateTask;
use App\Enums\TaskStatus;
use App\Exceptions\InvalidTaskTransition;
use App\Http\Requests\Task\AssignTaskRequest;
use App\Http\Requests\Task\DeleteTaskRequest;
use App\Http\Requests\Task\ShowTaskWorkspaceRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\TransitionTaskRequest;
use App\Http\Requests\Task\UnassignTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Discussion\DiscussionFilters;
use App\Support\Discussion\DiscussionSerializer;
use App\Support\Task\TaskWorkspaceSerializer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectWorkspaceController extends Controller
{
    public function show(
        ShowTaskWorkspaceRequest $request,
        Project $project,
        TaskWorkspaceSerializer $serializer,
        DiscussionSerializer $discussionSerializer,
    ): Response {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();

        $query = Task::query()
            ->forProject($project)
            ->with([
                'createdBy:id,name',
                'assignments.assignee:id,name',
            ])
            ->when(
                $filters->search !== null,
                function (Builder $query) use ($filters): void {
                    $like = '%'.$filters->search.'%';

                    $query->where(function (Builder $query) use ($like): void {
                        $query
                            ->where('title', 'like', $like)
                            ->orWhere('description', 'like', $like);
                    });
                },
            )
            ->when(
                $filters->status !== null,
                fn (Builder $query): Builder => $query->where('status', $filters->status->value),
            )
            ->when(
                $filters->priority !== null,
                fn (Builder $query): Builder => $query->where('priority', $filters->priority->value),
            )
            ->ordered();

        $tasks = $query
            ->paginate($filters->perPage, ['*'], 'page', $filters->page)
            ->appends($filters->queryParameters());

        $discussionFilters = new DiscussionFilters;
        $discussion = Message::query()
            ->forProject($project)
            ->with([
                'author:id,name',
                'attachments.uploadedBy:id,name',
            ])
            ->ordered()
            ->paginate(
                $discussionFilters->perPage,
                ['*'],
                'discussion_page',
                $discussionFilters->page,
            )
            ->appends($discussionFilters->queryParameters());

        $project->loadMissing('owner:id,name');
        $members = collect([
            [
                'id' => $project->owner->getKey(),
                'name' => $project->owner->name,
                'role' => 'Owner project',
            ],
        ])->merge(
            $project->teamMemberships()
                ->with(['user:id,name', 'projectRole:id,title'])
                ->active()
                ->oldest('joined_at')
                ->oldest('id')
                ->get()
                ->map(static function (TeamMembership $membership): array {
                    $role = $membership->projectRole;

                    return [
                        'id' => $membership->user->getKey(),
                        'name' => $membership->user->name,
                        'role' => $role === null ? 'Anggota team' : $role->title,
                    ];
                }),
        )->unique('id')->values()->all();

        return Inertia::render('projects/workspace', [
            'project' => $serializer->project($project),
            'tasks' => $serializer->page($tasks),
            'discussion' => $discussionSerializer->page($discussion),
            'members' => $members,
            'filters' => $filters->toArray(),
            'permissions' => [
                'can_create' => Gate::forUser($user)->allows('create', [Task::class, $project]),
                'can_manage_tasks' => Gate::forUser($user)->allows('create', [Task::class, $project]),
            ],
        ]);
    }

    public function store(
        StoreTaskRequest $request,
        Project $project,
        CreateTask $createTask,
        TaskWorkspaceSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $task = $createTask->handle($user, $project, $request->validated());

        return response()->json(['data' => $serializer->task($task)], 201);
    }

    public function update(
        UpdateTaskRequest $request,
        Project $project,
        Task $task,
        UpdateTask $updateTask,
        TaskWorkspaceSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $task = $updateTask->handle($user, $task, $request->validated());

        return response()->json(['data' => $serializer->task($task)]);
    }

    public function transition(
        TransitionTaskRequest $request,
        Project $project,
        Task $task,
        TransitionTaskStatus $transitionTaskStatus,
        TaskWorkspaceSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $task = $transitionTaskStatus->handle(
                actor: $user,
                task: $task,
                targetStatus: TaskStatus::from((string) $data['status']),
                expectedUpdatedAt: $data['expected_updated_at'] ?? null,
            );
        } catch (InvalidTaskTransition $exception) {
            throw ValidationException::withMessages(['status' => $exception->getMessage()]);
        }

        return response()->json(['data' => $serializer->task($task)]);
    }

    public function assign(
        AssignTaskRequest $request,
        Project $project,
        Task $task,
        AssignTask $assignTask,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $assignee = User::query()->findOrFail($request->integer('assignee_id'));
        $assignment = $assignTask->handle($user, $task, $assignee);

        return response()->json([
            'data' => [
                'id' => $assignment->getKey(),
                'task_id' => $assignment->task_id,
                'user' => [
                    'id' => $assignment->assignee->getKey(),
                    'name' => $assignment->assignee->name,
                ],
            ],
        ]);
    }

    public function unassign(
        UnassignTaskRequest $request,
        Project $project,
        Task $task,
        UnassignTask $unassignTask,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $assignee = User::query()->findOrFail($request->integer('assignee_id'));
        $unassignTask->handle($user, $task, $assignee);

        return response()->json(['data' => ['task_id' => $task->getKey(), 'user_id' => $assignee->getKey()]]);
    }

    public function destroy(
        DeleteTaskRequest $request,
        Project $project,
        Task $task,
        DeleteTask $deleteTask,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $deleteTask->handle($user, $task);

        return response()->json(['data' => ['deleted' => true, 'task_id' => $task->getKey()]]);
    }
}
