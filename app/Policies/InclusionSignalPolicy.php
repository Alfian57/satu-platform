<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionSignal;
use App\Models\InstitutionMembership;
use App\Models\User;

class InclusionSignalPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, InclusionSignal $inclusionSignal): bool
    {
        $membership = InstitutionMembership::where('user_id', $user->id)
            ->where('institution_id', $inclusionSignal->institution_id)
            ->first();

        if (! $membership || $membership->status !== \App\Enums\InstitutionMembershipStatus::Verified) {
            return false;
        }

        return $membership->role === InstitutionMembershipRole::CampusAdmin;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, InclusionSignal $inclusionSignal): bool
    {
        return false;
    }

    public function delete(User $user, InclusionSignal $inclusionSignal): bool
    {
        return false;
    }

    public function restore(User $user, InclusionSignal $inclusionSignal): bool
    {
        return false;
    }

    public function forceDelete(User $user, InclusionSignal $inclusionSignal): bool
    {
        return false;
    }
}
