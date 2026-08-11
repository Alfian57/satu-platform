<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Project\ArchiveProject;
use App\Actions\Project\CancelProject;
use App\Actions\Project\CreateProject;
use App\Actions\Project\OpenProject;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Actions\Project\UpdateProject;
use App\Exceptions\InvalidProjectTransition;
use App\Http\Requests\Project\ListProjectsRequest;
use App\Http\Requests\Project\ProjectTransitionRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Institution;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Project\ProjectDiscoverySerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectController extends Controller
{
    public function index(
        ListProjectsRequest $request,
        ProjectDiscoveryQuery $discoveryQuery,
        ProjectDiscoverySerializer $serializer,
    ): Response {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $result = $discoveryQuery->execute($user, $request->filters());

        return Inertia::render('projects/index', [
            'institution' => [
                'id' => $result->institution->getKey(),
                'name' => $result->institution->name,
            ],
            'projects' => $serializer->page($result->paginator),
            'filters' => $result->filters->toArray(),
            'filter_options' => [
                'status' => array_map(
                    static fn (\BackedEnum $status): string => (string) $status->value,
                    ProjectDiscoveryFilters::discoverableStatuses(),
                ),
                'visibility' => array_map(
                    static fn (\BackedEnum $visibility): string => (string) $visibility->value,
                    ProjectDiscoveryFilters::discoverableVisibilities(),
                ),
                'sort' => ProjectDiscoveryFilters::sortableFields(),
                'direction' => ['asc', 'desc'],
                'per_page' => ['default' => 20, 'max' => 50],
            ],
        ]);
    }

    public function show(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        return response()->json(['data' => $this->payload($project)]);
    }

    public function store(
        StoreProjectRequest $request,
        CreateProject $createProject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $institution = Institution::query()->findOrFail($request->integer('institution_id'));
        $project = $createProject->handle($user, $institution, $request->validated());

        return response()->json(['data' => $this->payload($project)], 201);
    }

    public function update(
        UpdateProjectRequest $request,
        Project $project,
        UpdateProject $updateProject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $project = $updateProject->handle($user, $project, $request->validated());

        return response()->json(['data' => $this->payload($project)]);
    }

    public function open(
        ProjectTransitionRequest $request,
        Project $project,
        OpenProject $openProject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $project = $openProject->handle(
                actor: $user,
                project: $project,
                occupiedCapacity: $data['occupied_capacity'] ?? null,
                reason: $data['reason'] ?? null,
                expectedUpdatedAt: $data['expected_updated_at'] ?? null,
            );
        } catch (InvalidProjectTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->payload($project)]);
    }

    public function cancel(
        ProjectTransitionRequest $request,
        Project $project,
        CancelProject $cancelProject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $project = $cancelProject->handle(
                actor: $user,
                project: $project,
                reason: $data['reason'] ?? null,
                expectedUpdatedAt: $data['expected_updated_at'] ?? null,
            );
        } catch (InvalidProjectTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->payload($project)]);
    }

    public function archive(
        ProjectTransitionRequest $request,
        Project $project,
        ArchiveProject $archiveProject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        try {
            $project = $archiveProject->handle(
                actor: $user,
                project: $project,
                reason: $data['reason'] ?? null,
                expectedUpdatedAt: $data['expected_updated_at'] ?? null,
            );
        } catch (InvalidProjectTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->payload($project)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Project $project): array
    {
        $project->load(['roles.skills.taxonomy']);

        return [
            'id' => $project->getKey(),
            'institution_id' => $project->institution_id,
            'owner_id' => $project->owner_id,
            'title' => $project->title,
            'description' => $project->description,
            'status' => $project->status->value,
            'visibility' => $project->visibility->value,
            'capacity' => $project->capacity,
            'deadline' => $project->deadline->toIso8601String(),
            'created_at' => $project->created_at->toIso8601String(),
            'updated_at' => $project->updated_at->toIso8601String(),
            'roles' => $project->roles->map(static fn (ProjectRole $role): array => [
                'id' => $role->getKey(),
                'title' => $role->title,
                'description' => $role->description,
                'capacity' => $role->capacity,
                'skills' => $role->skills->map(static fn (ProjectRoleSkill $skill): array => [
                    'id' => $skill->getKey(),
                    'taxonomy_id' => $skill->skill_taxonomy_id,
                    'name' => $skill->taxonomy->name,
                    'proficiency' => $skill->proficiency->value,
                ])->values()->all(),
            ])->values()->all(),
        ];
    }

    private function throwTransitionValidation(InvalidProjectTransition $exception): never
    {
        throw ValidationException::withMessages([
            'status' => $exception->getMessage(),
        ]);
    }
}
