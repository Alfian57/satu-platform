<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\TalentCandidateProjection;

class RecruiterSafeCandidateSerializer
{
    /**
     * Transform a TalentCandidateProjection into a strictly allowlisted recruiter-safe projection.
     *
     * @return array<string, mixed>
     */
    public function toArray(TalentCandidateProjection $projection): array
    {
        $projection->loadMissing('institution');

        return [
            'id' => $projection->id,
            'headline' => $projection->headline,
            'bio' => $projection->bio,
            'skills' => is_array($projection->skills) ? array_values($projection->skills) : [],
            'badges' => is_array($projection->badges) ? array_values($projection->badges) : [],
            'contributions' => is_array($projection->contributions) ? array_values($projection->contributions) : [],
            'availability_status' => $projection->availability_status,
            'verified_at' => $projection->verified_at?->toIso8601String(),
            'institution_name' => $projection->institution?->name,
        ];
    }
}
