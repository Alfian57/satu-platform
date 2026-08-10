<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterEntitlementLog;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class GrantRecruiterEntitlement
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Grant or extend an entitlement for a recruiter organization.
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $issuer,
        RecruiterOrganization $organization,
        RecruiterEntitlementScope|string $scope,
        Carbon $startsAt,
        ?Carbon $endsAt = null,
        ?string $reason = null,
    ): RecruiterEntitlement {
        if (! $issuer->is_platform_admin) {
            throw new AuthorizationException('Only platform administrators can grant recruiter entitlements.');
        }

        if ($organization->status !== RecruiterOrganizationStatus::Verified) {
            throw new InvalidArgumentException('Entitlements can only be granted to verified recruiter organizations.');
        }

        $enumScope = $scope instanceof RecruiterEntitlementScope
            ? $scope
            : RecruiterEntitlementScope::tryFrom((string) $scope)
                ?? throw new InvalidArgumentException("Invalid recruiter entitlement scope: {$scope}");

        if ($endsAt !== null && $endsAt->isBefore($startsAt)) {
            throw new InvalidArgumentException('Entitlement end date must be after the start date.');
        }

        $trimmedReason = $reason !== null ? trim($reason) : null;

        return DB::transaction(function () use ($issuer, $organization, $enumScope, $startsAt, $endsAt, $trimmedReason) {
            $entitlement = RecruiterEntitlement::query()->create([
                'recruiter_organization_id' => $organization->id,
                'scope' => $enumScope->value,
                'status' => RecruiterEntitlementStatus::Active->value,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'issuer_id' => $issuer->id,
                'reason' => $trimmedReason,
            ]);

            RecruiterEntitlementLog::query()->create([
                'recruiter_entitlement_id' => $entitlement->id,
                'actor_id' => $issuer->id,
                'event' => 'granted',
                'reason' => $trimmedReason,
            ]);

            $this->auditRecorder->record(
                operation: 'recruiter_entitlement.granted',
                auditable: $entitlement,
                actor: $issuer,
                institution: null,
                before: [],
                after: [
                    'recruiter_organization_id' => $organization->id,
                    'scope' => $enumScope->value,
                    'starts_at' => $startsAt->toIso8601String(),
                    'ends_at' => $endsAt?->toIso8601String(),
                ],
                reason: $trimmedReason,
            );

            return $entitlement;
        });
    }
}
