<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;

final class AcademicCreditMappingPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->canManageInstitution($user, $institution);
    }

    public function create(User $user, Institution $institution): bool
    {
        return $this->canManageInstitution($user, $institution);
    }

    public function activate(User $user, AcademicCreditMapping $mapping): bool
    {
        return $this->canManageMapping($user, $mapping);
    }

    public function retire(User $user, AcademicCreditMapping $mapping): bool
    {
        return $this->canManageMapping($user, $mapping);
    }

    private function canManageInstitution(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    private function canManageMapping(User $user, AcademicCreditMapping $mapping): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $mapping,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
