<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class CreateProject
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ProjectRequirements $requirements,
    ) {}

    /**
     * Create an institution-scoped project with its role and skill requirements.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Institution $institution, array $data): Project
    {
        Gate::forUser($actor)->authorize('create', [Project::class, $institution]);

        $projectCapacity = $this->requirements->boundedInteger(
            $data['capacity'] ?? 5,
            'capacity',
            1,
            20,
        );
        $deadline = $this->requirements->futureDeadline($data['deadline'] ?? null);
        $roles = $this->requirements->normalizeAndValidate(
            $data['roles'] ?? null,
            $projectCapacity,
        );
        $visibility = $this->requirements->visibility(
            $data['visibility'] ?? ProjectVisibility::Institution,
        );

        return DB::transaction(function () use (
            $actor,
            $institution,
            $data,
            $deadline,
            $projectCapacity,
            $roles,
            $visibility,
        ): Project {
            $project = Project::query()->forceCreate([
                'institution_id' => $institution->getKey(),
                'owner_id' => $actor->getKey(),
                'title' => $this->requirements->requiredText($data['title'] ?? null, 'title', 160),
                'description' => $this->requirements->nullableText(
                    $data['description'] ?? null,
                    'description',
                    5000,
                ),
                'status' => ProjectStatus::Draft,
                'visibility' => $visibility,
                'capacity' => $projectCapacity,
                'deadline' => $deadline,
            ]);

            $this->requirements->persist($project, $roles);
            $project = $project->load(['roles.skills.taxonomy']);

            $this->audit->record(
                operation: 'project.created',
                auditable: $project,
                actor: $actor,
                institution: $institution,
                after: [
                    'project_id' => $project->getKey(),
                    'status' => $project->status->value,
                    'roles_count' => $project->roles->count(),
                    'capacity' => $project->capacity,
                ],
            );

            return $project;
        }, attempts: 3);
    }
}
