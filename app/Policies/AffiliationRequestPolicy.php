<?php

namespace App\Policies;

use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipRole;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\User;

final class AffiliationRequestPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function review(User $user, AffiliationRequest $request): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $request->exists
            || $request->isDirty([$request->getKeyName(), 'institution_id'])
            || $request->status !== AffiliationRequestStatus::PendingReview
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $request,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
