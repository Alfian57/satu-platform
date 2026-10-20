<?php

namespace App\Policies;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;

final class InstitutionMembershipPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
        private readonly ResolveConfiguredUniversity $resolveUniversity,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $user->isUniversityAdmin($institution);
    }

    public function create(User $user, Institution $institution): bool
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            return false;
        }
        try {
            $university = $this->resolveUniversity->handle($institution);
        } catch (InvalidUniversityConfiguration) {
            return false;
        }

        return ! InstitutionMembership::query()->forInstitution($university)->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::Student)->where('status', InstitutionMembershipStatus::Suspended)->exists();
    }

    public function review(User $user, InstitutionMembership $membership): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $membership->exists
            || $membership->isDirty([$membership->getKeyName(), 'institution_id'])
            || $membership->role !== InstitutionMembershipRole::Student
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $membership,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function manageAdmin(User $user, InstitutionMembership $membership): bool
    {
        return $membership->role === InstitutionMembershipRole::CampusAdmin
            && $this->institutionContextResolver->resolve($user, $membership, [InstitutionMembershipRole::CampusAdmin]) !== null;
    }

    public function approve(User $user, InstitutionMembership $membership): bool
    {
        return $this->review($user, $membership);
    }

    public function reject(User $user, InstitutionMembership $membership): bool
    {
        return $this->review($user, $membership);
    }
}
