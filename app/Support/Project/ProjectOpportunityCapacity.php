<?php

declare(strict_types=1);

namespace App\Support\Project;

use App\Enums\TeamMembershipStatus;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamMembership;
use Illuminate\Database\Eloquent\Builder;

final class ProjectOpportunityCapacity
{
    /**
     * @param  Builder<TeamMembership>  $memberships
     * @return Builder<TeamMembership>
     */
    public static function activeMembers(Builder $memberships): Builder
    {
        return $memberships->where('status', TeamMembershipStatus::Active);
    }

    /**
     * @param  Builder<TeamMembership>  $memberships
     * @return Builder<TeamMembership>
     */
    public static function activeRoleMembers(Builder $memberships): Builder
    {
        return self::activeMembers($memberships)->whereColumn('team_memberships.project_id', 'project_roles.project_id');
    }

    /** @return array{total:int, occupied:int, remaining:int, accepting:bool} */
    public static function project(Project $project): array
    {
        if (! array_key_exists('occupied_count', $project->getAttributes())) {
            $project->loadCount(['teamMemberships as occupied_count' => self::activeMembers(...)]);
        }
        $occupied = (int) $project->getAttribute('occupied_count');

        return [
            'total' => $project->capacity,
            'occupied' => $occupied,
            'remaining' => max(0, $project->capacity - $occupied),
            'accepting' => $project->acceptsMembers() && $occupied < $project->capacity,
        ];
    }

    /** @return array{total:int, occupied:int, remaining:int, accepting:bool} */
    public static function role(ProjectRole $role, Project $project): array
    {
        if (! array_key_exists('occupied_count', $role->getAttributes())) {
            $role->loadCount(['teamMemberships as occupied_count' => self::activeRoleMembers(...)]);
        }
        $occupied = (int) $role->getAttribute('occupied_count');

        return [
            'total' => $role->capacity,
            'occupied' => $occupied,
            'remaining' => max(0, $role->capacity - $occupied),
            'accepting' => self::project($project)['accepting'] && $occupied < $role->capacity,
        ];
    }
}
