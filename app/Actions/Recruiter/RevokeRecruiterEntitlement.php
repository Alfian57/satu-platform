<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecruiterEntitlementStatus;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterEntitlementLog;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class RevokeRecruiterEntitlement
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Revoke a recruiter entitlement.
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $actor,
        RecruiterEntitlement $entitlement,
        ?string $reason = null,
    ): RecruiterEntitlement {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform administrators can revoke recruiter entitlements.');
        }

        $trimmedReason = $reason !== null ? trim($reason) : null;
        if ($trimmedReason === null || $trimmedReason === '') {
            throw new InvalidArgumentException('A reason is required when revoking a recruiter entitlement.');
        }

        return DB::transaction(function () use ($actor, $entitlement, $trimmedReason) {
            $previousStatus = $entitlement->status;

            $entitlement->update([
                'status' => RecruiterEntitlementStatus::Revoked->value,
            ]);

            RecruiterEntitlementLog::query()->create([
                'recruiter_entitlement_id' => $entitlement->id,
                'actor_id' => $actor->id,
                'event' => 'revoked',
                'reason' => $trimmedReason,
            ]);

            $this->auditRecorder->record(
                operation: 'recruiter_entitlement.revoked',
                auditable: $entitlement,
                actor: $actor,
                institution: null,
                before: [
                    'status' => $previousStatus->value,
                ],
                after: [
                    'status' => RecruiterEntitlementStatus::Revoked->value,
                ],
                reason: $trimmedReason,
            );

            return $entitlement;
        });
    }
}
