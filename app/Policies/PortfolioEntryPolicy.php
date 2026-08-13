<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\User;

final class PortfolioEntryPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, ?StudentProfile $studentProfile = null): bool
    {
        if ($studentProfile === null) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $studentProfile,
            [
                InstitutionMembershipRole::Student,
                InstitutionMembershipRole::CampusAdmin,
            ],
        ) !== null;
    }

    public function viewAll(User $user, StudentProfile $studentProfile): bool
    {
        $roles = $studentProfile->user_id === $user->getKey()
            ? [InstitutionMembershipRole::Student]
            : [InstitutionMembershipRole::CampusAdmin];

        return $this->institutionContextResolver->resolve($user, $studentProfile, $roles) !== null;
    }

    public function view(User $user, PortfolioEntry $portfolioEntry): bool
    {
        if (! $this->isConsistent($portfolioEntry)) {
            return false;
        }

        if ($portfolioEntry->user_id === $user->getKey()) {
            return $this->institutionContextResolver->resolve(
                $user,
                $portfolioEntry,
                [InstitutionMembershipRole::Student],
            ) !== null;
        }

        if ($this->institutionContextResolver->resolve(
            $user,
            $portfolioEntry,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null) {
            return true;
        }

        return PortfolioEntry::query()
            ->whereKey($portfolioEntry->getKey())
            ->visibleToInstitution()
            ->where('institution_id', $portfolioEntry->institution_id)
            ->exists()
            && $this->institutionContextResolver->resolve(
                $user,
                $portfolioEntry,
                [InstitutionMembershipRole::Student],
            ) !== null;
    }

    public function create(User $user, ?Institution $institution = null): bool
    {
        return false;
    }

    public function update(User $user, PortfolioEntry $portfolioEntry): bool
    {
        return $portfolioEntry->user_id === $user->getKey()
            && $this->isConsistent($portfolioEntry)
            && $this->institutionContextResolver->resolve(
                $user,
                $portfolioEntry,
                [InstitutionMembershipRole::Student],
            ) !== null;
    }

    public function delete(User $user, PortfolioEntry $portfolioEntry): bool
    {
        return false;
    }

    public function restore(User $user, PortfolioEntry $portfolioEntry): bool
    {
        return false;
    }

    public function forceDelete(User $user, PortfolioEntry $portfolioEntry): bool
    {
        return false;
    }

    private function isConsistent(PortfolioEntry $portfolioEntry): bool
    {
        if (
            ! $portfolioEntry->exists
            || $portfolioEntry->isDirty([
                $portfolioEntry->getKeyName(),
                'institution_id',
                'user_id',
                'contribution_id',
                'contribution_version_id',
            ])
        ) {
            return false;
        }

        return PortfolioEntry::query()
            ->whereKey($portfolioEntry->getKey())
            ->where('institution_id', $portfolioEntry->institution_id)
            ->where('user_id', $portfolioEntry->user_id)
            ->whereHas('contribution', function ($query) use ($portfolioEntry): void {
                $query
                    ->where('id', $portfolioEntry->contribution_id)
                    ->where('institution_id', $portfolioEntry->institution_id)
                    ->where('owner_id', $portfolioEntry->user_id);
            })
            ->whereHas('sourceVersion', function ($query) use ($portfolioEntry): void {
                $query->where('id', $portfolioEntry->contribution_version_id)
                    ->where('contribution_id', $portfolioEntry->contribution_id);
            })
            ->exists();
    }
}
