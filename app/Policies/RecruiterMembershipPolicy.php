<?php

namespace App\Policies;

use App\Models\RecruiterMembership;
use App\Models\User;

final class RecruiterMembershipPolicy
{
    /**
     * Determine whether the user can view the membership.
     */
    public function view(User $user, RecruiterMembership $membership): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create memberships.
     */
    public function create(User $user, int $organizationId): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the membership.
     */
    public function update(User $user, RecruiterMembership $membership): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the membership.
     */
    public function delete(User $user, RecruiterMembership $membership): bool
    {
        return false;
    }
}
