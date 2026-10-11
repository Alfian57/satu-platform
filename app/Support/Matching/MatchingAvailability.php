<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\InstitutionMembership;
use App\Models\MatchScoreVersion;
use App\Models\StudentProfile;

final class MatchingAvailability
{
    public const POLICY = 'opportunity-v2-neutral';

    public function enabled(): bool
    {
        return (bool) config('matching.enabled')
            && (! app()->isProduction() || (bool) config('matching.production_approved'));
    }

    public function supported(?MatchScoreVersion $version): bool
    {
        return $version !== null && ($version->parameters['policy'] ?? null) === self::POLICY;
    }

    public function candidateAllowed(int $institutionId, int $candidateId): bool
    {
        return InstitutionMembership::query()
            ->where('institution_id', $institutionId)->where('user_id', $candidateId)
            ->where('role', InstitutionMembershipRole::Student)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->whereRelation('institution', 'status', InstitutionStatus::Active)->exists();
    }

    public function profileReady(?StudentProfile $profile): bool
    {
        return $profile !== null
            && ($profile->relationLoaded('skills') ? $profile->skills->isNotEmpty() : $profile->skills()->exists())
            && ($profile->relationLoaded('availabilityWindows') ? $profile->availabilityWindows->isNotEmpty() : $profile->availabilityWindows()->exists());
    }
}
