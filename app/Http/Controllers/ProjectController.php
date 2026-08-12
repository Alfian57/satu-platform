<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Project\ArchiveProject;
use App\Actions\Project\CancelProject;
use App\Actions\Project\CreateProject;
use App\Actions\Project\OpenProject;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Actions\Project\UpdateProject;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\ProjectStatus;
use App\Exceptions\InvalidProjectTransition;
use App\Http\Requests\Project\ListProjectsRequest;
use App\Http\Requests\Project\ProjectTransitionRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\Task;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Project\ProjectDiscoverySerializer;
use App\Support\Team\TeamFormationSerializer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectController extends Controller
{
    public function __construct(
        private readonly TeamFormationSerializer $teamFormationSerializer,
    ) {}

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

    public function create(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $institution = $this->institutionForCreation(
            $user,
            $request->filled('institution_id') ? $request->integer('institution_id') : null,
        );

        return Inertia::render('projects/create', [
            'institution' => [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
        ]);
    }

    public function show(Request $request, Project $project): JsonResponse|Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        Gate::authorize('view', $project);
        $payload = $this->payload($project);
        $team = $this->teamFormationSerializer->serialize($project, $user);

        if ($request->expectsJson()) {
            return response()->json(['data' => [...$payload, 'team' => $team]]);
        }

        return Inertia::render('projects/show', [
            'project' => $payload,
            'team' => $team,
            'can_edit' => Gate::allows('update', $project)
                && in_array($project->status, [ProjectStatus::Draft, ProjectStatus::Open], true),
            'can_transition' => Gate::allows('transition', $project),
            'can_workspace' => Gate::allows('viewAny', [Task::class, $project]),
        ]);
    }

    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        if (! in_array($project->status, [ProjectStatus::Draft, ProjectStatus::Open], true)) {
            abort(409, 'Project hanya dapat diedit saat berstatus draft atau open.');
        }

        return Inertia::render('projects/edit', [
            'project' => $this->payload($project),
        ]);
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
        $project->load([
            'institution:id,name',
            'owner:id,name',
            'roles.skills.taxonomy',
        ]);

        return [
            'id' => $project->getKey(),
            'institution_id' => $project->institution_id,
            'institution' => [
                'id' => $project->institution->getKey(),
                'name' => $project->institution->name,
            ],
            'owner_id' => $project->owner_id,
            'owner' => [
                'id' => $project->owner->getKey(),
                'name' => $project->owner->name,
            ],
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

    private function institutionForCreation(User $user, ?int $institutionId): Institution
    {
        $membership = InstitutionMembership::query()
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->where('role', InstitutionMembershipRole::Student)
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->when(
                $institutionId !== null,
                fn (Builder $query): Builder => $query->where('institution_id', $institutionId),
            )
            ->latest('requested_at')
            ->latest('id')
            ->first();

        if ($membership?->institution === null) {
            abort(403, 'Tidak ada konteks kampus yang dapat dipakai untuk membuat project.');
        }

        Gate::forUser($user)->authorize('create', [Project::class, $membership->institution]);

        return $membership->institution;
    }

    private function throwTransitionValidation(InvalidProjectTransition $exception): never
    {
        throw ValidationException::withMessages([
            'status' => $exception->getMessage(),
        ]);
    }
}
