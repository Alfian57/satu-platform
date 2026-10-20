<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Enums\RecruiterEntitlementScope;
use App\Models\RecruiterOrganization;
use Illuminate\Support\Carbon;

final class VerifyRecruiterEntitlement
{
    /**
     * Batas kompatibilitas riwayat. Role perekrut tidak tersedia pada runtime.
     */
    public function check(
        RecruiterOrganization $organization,
        RecruiterEntitlementScope|string $scope,
        ?Carbon $at = null,
    ): bool {
        return false;
    }
}
