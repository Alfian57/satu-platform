<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InstitutionDomain;
use App\Models\User;

final class InstitutionDomainPolicy
{
    public function __construct(
        private InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function update(User $user, InstitutionDomain $institutionDomain): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institutionDomain,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
