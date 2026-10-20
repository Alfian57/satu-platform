<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\PrivilegedInvitation;
use App\Models\User;

class PrivilegedInvitationPolicy
{
    public function __construct(private readonly InstitutionContextResolver $context) {}

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, ?Institution $institution = null): bool
    {
        return $user->isUniversityAdmin($institution);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PrivilegedInvitation $privilegedInvitation): bool
    {
        return $this->context->resolve($user, $privilegedInvitation, [InstitutionMembershipRole::CampusAdmin]) !== null;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Institution $institution): bool
    {
        return $user->isUniversityAdmin($institution);
    }

    public function revoke(User $user, PrivilegedInvitation $invitation): bool
    {
        return in_array($invitation->status, [InvitationStatus::Issued, InvitationStatus::Revoked], true)
            && $this->context->resolve($user, $invitation, [InstitutionMembershipRole::CampusAdmin]) !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PrivilegedInvitation $privilegedInvitation): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PrivilegedInvitation $privilegedInvitation): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PrivilegedInvitation $privilegedInvitation): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PrivilegedInvitation $privilegedInvitation): bool
    {
        return false;
    }
}
