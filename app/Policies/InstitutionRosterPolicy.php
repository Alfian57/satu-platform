<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\User;

final class InstitutionRosterPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->canManage($user, $institution);
    }

    public function manage(User $user, Institution $institution): bool
    {
        return $this->canManage($user, $institution);
    }

    private function canManage(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
