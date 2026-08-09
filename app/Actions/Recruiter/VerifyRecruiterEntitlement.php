<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterOrganization;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

final class VerifyRecruiterEntitlement
{
    /**
     * Determine whether an organization holds an active, valid entitlement for a scope.
     */
    public function check(
        RecruiterOrganization $organization,
        RecruiterEntitlementScope|string $scope,
        ?Carbon $at = null,
    ): bool {
        if ($organization->status !== RecruiterOrganizationStatus::Verified) {
            return false;
        }

        $enumScope = $scope instanceof RecruiterEntitlementScope
            ? $scope
            : RecruiterEntitlementScope::tryFrom((string) $scope)
                ?? throw new InvalidArgumentException("Invalid recruiter entitlement scope: {$scope}");

        $now = $at ?? Carbon::now();

        $activeScopes = [
            $enumScope->value,
            RecruiterEntitlementScope::FullSuite->value,
        ];

        return RecruiterEntitlement::query()
            ->where('recruiter_organization_id', $organization->id)
            ->where('status', RecruiterEntitlementStatus::Active->value)
            ->whereIn('scope', array_unique($activeScopes))
            ->where('starts_at', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->exists();
    }
}
