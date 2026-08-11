<?php

declare(strict_types=1);

namespace App\Support\Project;

use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use Illuminate\Pagination\LengthAwarePaginator;

final class ProjectDiscoverySerializer
{
    /**
     * @param  LengthAwarePaginator<int, Project>  $paginator
     * @return array<string, mixed>
     */
    public function page(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => array_map(
                fn (Project $project): array => $this->summary($project),
                $paginator->items(),
            ),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(Project $project): array
    {
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
            'roles' => $project->roles->map(
                static fn (ProjectRole $role): array => [
                    'id' => $role->getKey(),
                    'title' => $role->title,
                    'description' => $role->description,
                    'capacity' => $role->capacity,
                    'skills' => $role->skills->map(
                        static fn (ProjectRoleSkill $skill): array => [
                            'id' => $skill->getKey(),
                            'name' => $skill->taxonomy->name,
                            'proficiency' => $skill->proficiency->value,
                        ],
                    )->values()->all(),
                ],
            )->values()->all(),
            'created_at' => $project->created_at->toIso8601String(),
            'updated_at' => $project->updated_at->toIso8601String(),
        ];
    }
}
