<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\IntegrationSync;
use App\Models\User;

final class IntegrationSyncPolicy
{
    public function __construct(
        private InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, IntegrationSync $sync): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $sync->connection,
            [InstitutionMembershipRole::CampusAdmin]
        ) !== null;
    }

    public function update(User $user, IntegrationSync $sync): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $sync->connection,
            [InstitutionMembershipRole::CampusAdmin]
        ) !== null;
    }
}
