<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;

final class StudentProfilePolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, StudentProfile $studentProfile): bool
    {
        return $this->ownsProfileInActiveInstitution($user, $studentProfile);
    }

    public function create(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function update(User $user, StudentProfile $studentProfile): bool
    {
        return $this->ownsProfileInActiveInstitution($user, $studentProfile);
    }

    private function ownsProfileInActiveInstitution(User $user, StudentProfile $studentProfile): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $studentProfile->exists
            || $studentProfile->isDirty([
                $studentProfile->getKeyName(),
                'user_id',
                'institution_id',
            ])
            || $studentProfile->user_id !== $user->getKey()
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $studentProfile,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }
}
