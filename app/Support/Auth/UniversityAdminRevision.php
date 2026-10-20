<?php

namespace App\Support\Auth;

use App\Models\AuditLog;
use App\Models\InstitutionMembership;
use Illuminate\Support\Facades\DB;

final class UniversityAdminRevision
{
    public static function make(InstitutionMembership $membership, ?int $lastAuditId = null): string
    {
        $attributes = $membership->getAttributes();
        ksort($attributes);
        if ($lastAuditId === null) {
            $query = AuditLog::query()->where('auditable_type', $membership->getMorphClass())
                ->where('auditable_id', $membership->id)->latest('id');
            if (DB::transactionLevel() > 0) {
                $query->sharedLock();
            }
            $lastAudit = $query->first(['id']);
            $lastAuditId = $lastAudit === null ? 0 : $lastAudit->id;
        }

        return hash('sha256', json_encode([
            $attributes,
            $lastAuditId,
        ], JSON_THROW_ON_ERROR));
    }
}
