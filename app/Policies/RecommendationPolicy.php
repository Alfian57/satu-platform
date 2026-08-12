<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\MatchRun;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\User;

final class RecommendationPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Only the candidate or project owner in the same verified institution
     * may access a recommendation. Connectivity detail remains internal to
     * the server-side model and is removed by the safe explanation projection.
     */
    public function view(User $user, Recommendation $recommendation): bool
    {
        if (
            ! $user->exists
            || ! $recommendation->exists
            || $recommendation->isDirty([
                $recommendation->getKeyName(),
                'institution_id',
                'project_id',
                'candidate_id',
            ])
        ) {
            return false;
        }

        if ($user->is_platform_admin) {
            return true;
        }

        $projectOwnerId = $recommendation->relationLoaded('project')
            ? $recommendation->project?->owner_id
            : Project::query()->whereKey($recommendation->project_id)->value('owner_id');

        if (! in_array($user->getKey(), [$recommendation->candidate_id, $projectOwnerId], true)) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $recommendation,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function viewAny(User $user, Institution $institution): bool
    {
        if (! $user->exists || ! $institution->exists || $institution->isDirty($institution->getKeyName())) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function feedback(User $user, Recommendation $recommendation): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $recommendation->exists
            || $recommendation->isDirty([
                $recommendation->getKeyName(),
                'institution_id',
                'project_id',
                'candidate_id',
                'match_run_id',
            ])
            || $recommendation->candidate_id !== $user->getKey()
            || ! $this->belongsToTenantResources($recommendation)
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $recommendation,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function hide(User $user, Recommendation $recommendation): bool
    {
        return $this->feedback($user, $recommendation);
    }

    public function notRelevant(User $user, Recommendation $recommendation): bool
    {
        return $this->feedback($user, $recommendation);
    }

    public function profileFix(User $user, Recommendation $recommendation): bool
    {
        return $this->feedback($user, $recommendation);
    }

    private function belongsToTenantResources(Recommendation $recommendation): bool
    {
        return Project::query()
            ->whereKey($recommendation->project_id)
            ->where('institution_id', $recommendation->institution_id)
            ->exists()
            && MatchRun::query()
                ->whereKey($recommendation->match_run_id)
                ->where('institution_id', $recommendation->institution_id)
                ->exists();
    }
}
