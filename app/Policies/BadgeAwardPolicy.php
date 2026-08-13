<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Models\BadgeAward;
use App\Models\Contribution;
use App\Models\User;

final class BadgeAwardPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user): bool
    {
        return $user->exists;
    }

    public function view(User $user, BadgeAward $award): bool
    {
        if (! $award->exists) {
            return false;
        }

        if (
            $award->user_id === $user->getKey()
            && $this->institutionContextResolver->resolve(
                $user,
                $award,
                [InstitutionMembershipRole::Student],
            ) !== null
        ) {
            return true;
        }

        return $this->isCampusOperator($user, $award);
    }

    public function issue(User $user, Contribution $source): bool
    {
        return $source->exists
            && $source->status === ContributionStatus::Approved
            && $this->isCampusOperator($user, $source);
    }

    public function revoke(User $user, BadgeAward $award): bool
    {
        return $award->exists && $this->isCampusOperator($user, $award);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, BadgeAward $award): bool
    {
        return false;
    }

    public function delete(User $user, BadgeAward $award): bool
    {
        return false;
    }

    public function restore(User $user, BadgeAward $award): bool
    {
        return false;
    }

    public function forceDelete(User $user, BadgeAward $award): bool
    {
        return false;
    }

    private function isCampusOperator(User $user, BadgeAward|Contribution $source): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $source,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
