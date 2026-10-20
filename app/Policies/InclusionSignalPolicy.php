<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionSignal;
use App\Models\User;

class InclusionSignalPolicy
{
    public function __construct(private readonly InstitutionContextResolver $context) {}

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, InclusionSignal $inclusionSignal): bool
    {
        return $this->context->resolve($user, $inclusionSignal, [InstitutionMembershipRole::CampusAdmin]) !== null;
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
