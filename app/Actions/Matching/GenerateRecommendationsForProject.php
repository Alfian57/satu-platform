<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\InstitutionMembership;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\User;
use Throwable;

final class GenerateRecommendationsForProject
{
    public function __construct(
        private readonly GenerateRecommendation $generateRecommendation,
    ) {}

    /**
     * Generate recommendations for all eligible students for a given project.
     *
     * @return int Count of recommendations generated
     */
    public function handle(Project $project): int
    {
        $version = MatchScoreVersion::current();

        if ($version === null) {
            return 0;
        }

        $memberships = InstitutionMembership::query()
            ->where('institution_id', $project->institution_id)
            ->where('role', InstitutionMembershipRole::Student->value)
            ->where('status', InstitutionMembershipStatus::Verified->value)
            ->where('user_id', '!=', $project->owner_id)
            ->with('user')
            ->get();

        $count = 0;

        foreach ($memberships as $membership) {
            $student = $membership->user;

            if (! $student instanceof User) {
                continue;
            }

            $profile = StudentProfile::query()
                ->withCount(['skills', 'availabilityWindows'])
                ->where('user_id', $student->id)
                ->where('institution_id', $project->institution_id)
                ->first();

            if (
                $profile === null
                || (int) $profile->skills_count === 0
                || (int) $profile->availability_windows_count === 0
            ) {
                continue;
            }

            try {
                $this->generateRecommendation->execute(
                    actor: $student,
                    studentProfile: $profile,
                    project: $project,
                    version: $version,
                );
                $count++;
            } catch (Throwable) {
                // Skip individual failures
            }
        }

        return $count;
    }
}
