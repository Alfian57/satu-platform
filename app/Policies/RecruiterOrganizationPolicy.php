<?php

namespace App\Policies;

use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterOrganization;
use App\Models\User;

final class RecruiterOrganizationPolicy
{
    /**
     * Determine whether the user can view the organization.
     */
    public function view(User $user, RecruiterOrganization $organization): bool
    {
        return $organization->memberships()->where('user_id', $user->getKey())->exists();
    }

    /**
     * Determine whether the user can update the organization details.
     */
    public function update(User $user, RecruiterOrganization $organization): bool
    {
        if ($organization->status === RecruiterOrganizationStatus::Suspended ||
            $organization->status === RecruiterOrganizationStatus::Rejected) {
            return false;
        }

        return $organization->memberships()
            ->where('user_id', $user->getKey())
            ->whereIn('role', [RecruiterMembershipRole::Owner, RecruiterMembershipRole::Admin])
            ->exists();
    }

    /**
     * Determine whether the user can review the organization verification.
     * (Platform Admins only, stubbed as Gate or property check)
     */
    public function review(User $user, RecruiterOrganization $organization): bool
    {
        // For now, assume a Gate or a property determines platform admin status.
        return $user->getAttribute('is_platform_admin') === true;
    }

    /**
     * Determine whether the user can view sensitive evidence.
     * (Platform Admins only)
     */
    public function viewEvidence(User $user, RecruiterOrganization $organization): bool
    {
        return $this->review($user, $organization);
    }
}
