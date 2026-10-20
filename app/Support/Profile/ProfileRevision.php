<?php

declare(strict_types=1);

namespace App\Support\Profile;

use App\Models\AvailabilityWindow;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\StudentProfile;

final class ProfileRevision
{
    public static function for(StudentProfile $profile): string
    {
        $profile->loadMissing(['skills', 'interests', 'availabilityWindows']);

        return hash('sha256', json_encode([
            'profile' => $profile->only(['id', 'institution_id', 'user_id', 'bio', 'study_program', 'study_year', 'faculty', 'admission_year', 'portfolio_visibility', 'recruiter_discoverable', 'updated_at']),
            'skills' => $profile->skills->sortBy('skill_taxonomy_id')->map(static fn (ProfileSkill $skill): array => [
                $skill->skill_taxonomy_id, $skill->proficiency->value, $skill->evidence_metadata,
            ])->values()->all(),
            'interests' => $profile->interests->sortBy('skill_taxonomy_id')->map(static fn (ProfileInterest $interest): int => $interest->skill_taxonomy_id)->values()->all(),
            'availability' => $profile->availabilityWindows->sortBy(fn (AvailabilityWindow $window): array => [$window->day_of_week, $window->timezone, $window->starts_at, $window->ends_at])
                ->map(static fn (AvailabilityWindow $window): array => [$window->day_of_week, $window->starts_at, $window->ends_at, $window->timezone])->values()->all(),
        ], JSON_THROW_ON_ERROR));
    }
}
