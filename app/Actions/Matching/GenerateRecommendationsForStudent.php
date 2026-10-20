<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Models\Institution;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;

final class GenerateRecommendationsForStudent
{
    public function __construct(
        private readonly RequestMatchingRefresh $requestRefresh,
        private readonly MatchingAvailability $availability,
    ) {}

    /** Jumlah kandidat yang pembaruannya berada dalam antrean, bukan jumlah hasil. */
    public function handle(User $user, Institution $institution): int
    {
        if (! $this->availability->enabled() || ! $this->availability->candidateAllowed($institution->id, $user->id)) {
            return 0;
        }

        return $this->requestRefresh->handle($institution->id, $user->id)->status === 'queued' ? 1 : 0;
    }
}
