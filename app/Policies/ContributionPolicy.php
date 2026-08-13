<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\TeamMembershipStatus;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;

final class ContributionPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution|Project $source): bool
    {
        if ($source instanceof Institution) {
            return $this->isCampusAdmin($user, $source);
        }

        return $this->canAccessProject($user, $source)
            || $this->isCampusAdmin($user, $source);
    }

    public function view(User $user, Contribution $contribution): bool
    {
        $project = $this->projectFor($contribution);

        return $project !== null
            && (
                $this->canAccessProject($user, $project)
                || $this->isCampusAdmin($user, $contribution)
            );
    }

    public function create(User $user, Project $project): bool
    {
        return $this->canCollaborate($user, $project);
    }

    public function update(User $user, Contribution $contribution): bool
    {
        $project = $this->projectFor($contribution);

        return $project !== null
            && $contribution->owner_id === $user->getKey()
            && $contribution->status->canCreateVersion()
            && $this->canCollaborate($user, $project);
    }

    public function submit(User $user, Contribution $contribution): bool
    {
        return $this->update($user, $contribution)
            && $contribution->status === ContributionStatus::Draft;
    }

    public function review(User $user, Contribution $contribution): bool
    {
        return $this->projectFor($contribution) !== null
            && $contribution->status === ContributionStatus::Pending
            && $this->isCampusAdmin($user, $contribution);
    }

    public function delete(User $user, Contribution $contribution): bool
    {
        return false;
    }

    public function restore(User $user, Contribution $contribution): bool
    {
        return false;
    }

    public function forceDelete(User $user, Contribution $contribution): bool
    {
        return false;
    }

    private function projectFor(Contribution $contribution): ?Project
    {
        if (
            ! $contribution->exists
            || $contribution->isDirty([
                $contribution->getKeyName(),
                'institution_id',
                'owner_id',
                'project_id',
            ])
        ) {
            return null;
        }

        return Project::query()
            ->whereKey($contribution->project_id)
            ->where('institution_id', $contribution->institution_id)
            ->first();
    }

    private function canAccessProject(User $user, Project $project): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $project->exists
            || $project->isDirty([
                $project->getKeyName(),
                'institution_id',
                'owner_id',
            ])
            || $this->institutionContextResolver->resolve(
                $user,
                $project,
                [InstitutionMembershipRole::Student],
            ) === null
        ) {
            return false;
        }

        return $project->owner_id === $user->getKey()
            || TeamMembership::query()
                ->where('project_id', $project->getKey())
                ->where('user_id', $user->getKey())
                ->where('status', TeamMembershipStatus::Active)
                ->exists();
    }

    private function canCollaborate(User $user, Project $project): bool
    {
        return $project->status->isActive() && $this->canAccessProject($user, $project);
    }

    private function isCampusAdmin(User $user, Institution|Project|Contribution $source): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $source,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
