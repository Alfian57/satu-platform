<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\RecruiterEntitlement;
use App\Models\RecruiterEntitlementLog;

class RecruiterEntitlementSerializer
{
    /**
     * Transform a RecruiterEntitlement model into an allowlisted projection array.
     *
     * @return array<string, mixed>
     */
    public function toArray(RecruiterEntitlement $entitlement, bool $includeLogs = true): array
    {
        $entitlement->loadMissing(['issuer', 'logs.actor']);

        $logs = $includeLogs
            ? $entitlement->logs->map(fn (RecruiterEntitlementLog $log): array => [
                'id' => $log->id,
                'actor_id' => $log->actor_id,
                'actor_name' => $log->actor?->name,
                'event' => $log->event,
                'reason' => $log->reason,
                'created_at' => $log->created_at->toIso8601String(),
            ])->values()->all()
            : [];

        return [
            'id' => $entitlement->id,
            'recruiter_organization_id' => $entitlement->recruiter_organization_id,
            'scope' => $entitlement->scope->value,
            'status' => $entitlement->status->value,
            'starts_at' => $entitlement->starts_at->toIso8601String(),
            'ends_at' => $entitlement->ends_at?->toIso8601String(),
            'issuer_id' => $entitlement->issuer_id,
            'issuer_name' => $entitlement->issuer?->name,
            'reason' => $entitlement->reason,
            'is_active' => $entitlement->isActiveAt(),
            'created_at' => $entitlement->created_at->toIso8601String(),
            'logs' => $logs,
        ];
    }
}
