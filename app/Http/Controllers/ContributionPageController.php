<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AttachmentPurpose;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TeamMembershipStatus;
use App\Http\Requests\Contribution\ShowContributionRequest;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\Contribution\ContributionSerializer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

final class ContributionPageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $this->user($request);
        $institutionIds = $this->verifiedStudentInstitutionIds($user);
        $projects = $this->availableProjects($user, $institutionIds);

        $contributions = Contribution::query()
            ->select([
                'id',
                'institution_id',
                'owner_id',
                'project_id',
                'status',
                'current_version_id',
                'created_at',
                'updated_at',
            ])
            ->whereBelongsTo($user, 'owner')
            ->whereIn('institution_id', $institutionIds)
            ->with([
                'project:id,title',
                'currentVersion:id,contribution_id,task_id,version_number',
                'currentVersion.task:id,title,project_id',
            ])
            ->latest('updated_at')
            ->latest('id')
            ->get();

        return Inertia::render('contributions/index', [
            'contributions' => $contributions
                ->map(fn (Contribution $contribution): array => $this->summary($contribution))
                ->values()
                ->all(),
            'can_create' => $projects->isNotEmpty(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $this->user($request);
        $projects = $this->availableProjects(
            $user,
            $this->verifiedStudentInstitutionIds($user),
        );

        return Inertia::render('contributions/create', [
            'projects' => $this->projectOptions($projects),
            'can_create' => $projects->isNotEmpty(),
        ]);
    }

    public function show(
        ShowContributionRequest $request,
        Contribution $contribution,
        ContributionSerializer $serializer,
    ): JsonResponse|Response {
        if ($request->expectsJson()) {
            return response()->json(['data' => $serializer->contribution($contribution)]);
        }

        $user = $this->user($request);
        $projects = $this->availableProjects(
            $user,
            $this->verifiedStudentInstitutionIds($user),
        );

        return Inertia::render('contributions/show', [
            'contribution' => $serializer->contribution($contribution),
            'projects' => $this->projectOptions($projects),
            'permissions' => [
                'can_update' => $user->can('update', $contribution),
                'can_submit' => $user->can('submit', $contribution),
            ],
        ]);
    }

    /**
     * @param  list<int>  $institutionIds
     * @return Collection<int, Project>
     */
    private function availableProjects(User $user, array $institutionIds): Collection
    {
        if ($institutionIds === []) {
            return collect();
        }

        return Project::query()
            ->select(['id', 'institution_id', 'owner_id', 'title', 'status'])
            ->whereIn('institution_id', $institutionIds)
            ->whereIn('status', [
                ProjectStatus::Open,
                ProjectStatus::Forming,
                ProjectStatus::Full,
            ])
            ->where(function (Builder $query) use ($user): void {
                $query
                    ->whereBelongsTo($user, 'owner')
                    ->orWhereHas('teamMemberships', function (Builder $query) use ($user): void {
                        $query
                            ->whereBelongsTo($user)
                            ->where('status', TeamMembershipStatus::Active);
                    });
            })
            ->with([
                'tasks' => function (Relation $query): void {
                    $query
                        ->select(['id', 'project_id', 'title', 'status'])
                        ->latest('id');
                },
                'attachments' => function (Relation $query): void {
                    $query
                        ->select([
                            'id',
                            'project_id',
                            'original_name',
                            'mime_type',
                            'size_bytes',
                            'created_at',
                        ])
                        ->where('purpose', AttachmentPurpose::Evidence->value)
                        ->latest('created_at')
                        ->latest('id');
                },
            ])
            ->orderBy('title')
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  Collection<int, Project>  $projects
     * @return list<array<string, mixed>>
     */
    private function projectOptions(Collection $projects): array
    {
        return array_values($projects
            ->map(static fn (Project $project): array => [
                'id' => $project->getKey(),
                'title' => $project->title,
                'status' => $project->status->value,
                'tasks' => $project->tasks
                    ->map(static fn (Task $task): array => [
                        'id' => $task->getKey(),
                        'title' => $task->title,
                        'status' => $task->status->value,
                    ])
                    ->values()
                    ->all(),
                'evidence' => $project->attachments
                    ->map(static fn (Attachment $attachment): array => [
                        'id' => $attachment->getKey(),
                        'original_name' => $attachment->original_name,
                        'mime_type' => $attachment->mime_type,
                        'size_bytes' => $attachment->size_bytes,
                        'created_at' => $attachment->created_at->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ])
            ->all());
    }

    /**
     * @return list<int>
     */
    private function verifiedStudentInstitutionIds(User $user): array
    {
        return array_values(InstitutionMembership::query()
            ->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::Student)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->pluck('institution_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all());
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Contribution $contribution): array
    {
        return [
            'id' => $contribution->getKey(),
            'project' => [
                'id' => $contribution->project->getKey(),
                'title' => $contribution->project->title,
            ],
            'status' => $contribution->status->value,
            'current_version' => $contribution->currentVersion === null
                ? null
                : [
                    'id' => $contribution->currentVersion->getKey(),
                    'version_number' => $contribution->currentVersion->version_number,
                    'task' => $contribution->currentVersion->task === null
                        ? null
                        : [
                            'id' => $contribution->currentVersion->task->getKey(),
                            'title' => $contribution->currentVersion->task->title,
                        ],
                ],
            'created_at' => $contribution->created_at->toIso8601String(),
            'updated_at' => $contribution->updated_at->toIso8601String(),
        ];
    }

    private function user(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
