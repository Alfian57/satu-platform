<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\IntegrationConnection;
use App\Models\User;

final class IntegrationConnectionPolicy
{
    public function __construct(
        private InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::CampusAdmin]
        ) !== null;
    }

    public function view(User $user, IntegrationConnection $connection): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $connection,
            [InstitutionMembershipRole::CampusAdmin]
        ) !== null;
    }

    public function update(User $user, IntegrationConnection $connection): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $connection,
            [InstitutionMembershipRole::CampusAdmin]
        ) !== null;
    }
}
