<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\ProjectStatus;
use App\Models\Institution;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;
use Throwable;

final class GenerateRecommendationsForStudent
{
    public function __construct(
        private readonly GenerateRecommendation $generateRecommendation,
    ) {}

    /**
     * Generate recommendations for a specific student across open projects in an institution.
     *
     * @return int Count of recommendations generated
     */
    public function handle(User $user, Institution $institution): int
    {
        $version = MatchScoreVersion::current();

        if ($version === null) {
            return 0;
        }

        $profile = StudentProfile::query()
            ->withCount(['skills', 'availabilityWindows'])
            ->where('user_id', $user->id)
            ->where('institution_id', $institution->id)
            ->first();

        if (
            $profile === null
            || (int) $profile->skills_count === 0
            || (int) $profile->availability_windows_count === 0
        ) {
            return 0;
        }

        /** @var Collection<int, Project> $projects */
        $projects = Project::query()
            ->where('institution_id', $institution->id)
            ->where('owner_id', '!=', $user->id)
            ->whereIn('status', [ProjectStatus::Open->value, ProjectStatus::Forming->value])
            ->get();

        $count = 0;

        foreach ($projects as $project) {
            try {
                $this->generateRecommendation->execute(
                    actor: $user,
                    studentProfile: $profile,
                    project: $project,
                    version: $version,
                );
                $count++;
            } catch (Throwable) {
                // Skip if single recommendation fails
            }
        }

        return $count;
    }
}
