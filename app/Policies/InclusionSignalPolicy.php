<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionSignal;
use App\Models\User;

final class InclusionSignalPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Only CampusAdmin in the same institution can view inclusion signals.
     */
    public function viewAny(User $user, InclusionSignal $signal): bool
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            return false;
        }

        if (! $signal->exists || $signal->isDirty([$signal->getKeyName(), 'institution_id'])) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $signal,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function view(User $user, InclusionSignal $signal): bool
    {
        return $this->viewAny($user, $signal);
    }
}
