<?php

namespace App\Policies;

use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\User;

final class RecruiterMembershipPolicy
{
    /**
     * Determine whether the user can view the membership.
     */
    public function view(User $user, RecruiterMembership $membership): bool
    {
        return $membership->organization->memberships()
            ->where('user_id', $user->getKey())
            ->exists();
    }

    /**
     * Determine whether the user can create memberships.
     */
    public function create(User $user, int $organizationId): bool
    {
        $org = RecruiterOrganization::find($organizationId);

        if (! $org || $org->status !== RecruiterOrganizationStatus::Verified) {
            return false;
        }

        return $org->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', RecruiterMembershipStatus::Active)
            ->whereIn('role', [RecruiterMembershipRole::Owner, RecruiterMembershipRole::Admin])
            ->exists();
    }

    /**
     * Determine whether the user can update the membership.
     */
    public function update(User $user, RecruiterMembership $membership): bool
    {
        if ($membership->organization->status !== RecruiterOrganizationStatus::Verified) {
            return false;
        }

        // Only Owner/Admin can update memberships, but they cannot demote the owner.
        if ($membership->role === RecruiterMembershipRole::Owner) {
            return false;
        }

        // Additional business logic may restrict this further.
        return $membership->organization->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', RecruiterMembershipStatus::Active)
            ->whereIn('role', [RecruiterMembershipRole::Owner, RecruiterMembershipRole::Admin])
            ->exists();
    }

    /**
     * Determine whether the user can delete the membership.
     */
    public function delete(User $user, RecruiterMembership $membership): bool
    {
        if ($membership->organization->status !== RecruiterOrganizationStatus::Verified) {
            return false;
        }

        if ($membership->role === RecruiterMembershipRole::Owner) {
            return false;
        }

        return $membership->organization->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', RecruiterMembershipStatus::Active)
            ->whereIn('role', [RecruiterMembershipRole::Owner, RecruiterMembershipRole::Admin])
            ->exists();
    }
}
