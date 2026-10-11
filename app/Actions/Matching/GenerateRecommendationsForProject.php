<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Support\Matching\MatchingAvailability;
use Illuminate\Database\Eloquent\Collection;

final class GenerateRecommendationsForProject
{
    public function __construct(
        private readonly RequestMatchingRefresh $requestRefresh,
        private readonly MatchingAvailability $availability,
    ) {}

    /** Jumlah kandidat yang pembaruannya berada dalam antrean, bukan jumlah hasil. */
    public function handle(Project $project): int
    {
        if (! $this->availability->enabled() || ! in_array($project->status, [ProjectStatus::Open, ProjectStatus::Forming], true)) {
            return 0;
        }

        $count = 0;
        StudentProfile::query()->where('institution_id', $project->institution_id)
            ->where('user_id', '!=', $project->owner_id)
            ->select(['id', 'institution_id', 'user_id'])
            ->chunkById(100, function (Collection $profiles) use (&$count): void {
                foreach ($profiles as $profile) {
                    if ($this->availability->candidateAllowed($profile->institution_id, $profile->user_id)) {
                        $refresh = $this->requestRefresh->handle($profile->institution_id, $profile->user_id);
                        $count += $refresh->status === 'queued' ? 1 : 0;
                    }
                }
            });

        return $count;
    }
}
