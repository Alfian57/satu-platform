<?php

declare(strict_types=1);

namespace App\Support\Portfolio;

use App\Models\StudentProfile;

final class PublicPortfolioSerializer
{
    /**
     * Serialize only the profile fields explicitly approved for the public
     * portfolio surface.
     *
     * @return array{display_name: string, study_program: string|null, bio: string|null, institution_name: string}
     */
    public function profile(StudentProfile $profile): array
    {
        $profile->loadMissing([
            'user:id,name',
            'institution:id,name',
        ]);

        return [
            'display_name' => $profile->user->name,
            'study_program' => $profile->study_program,
            'bio' => $profile->bio,
            'institution_name' => $profile->institution->name,
        ];
    }
}
