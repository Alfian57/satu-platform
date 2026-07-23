<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InstitutionMembership;
use App\Models\User;

final class InstitutionMembershipPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

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

    public function approve(User $user, InstitutionMembership $membership): bool
    {
        return $this->review($user, $membership);
    }

    public function reject(User $user, InstitutionMembership $membership): bool
    {
        return $this->review($user, $membership);
    }
}
