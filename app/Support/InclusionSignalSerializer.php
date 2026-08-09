<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\InclusionReview;
use App\Models\InclusionSignal;

class InclusionSignalSerializer
{
    /**
     * Transform an InclusionSignal model into a restricted, allowlisted projection.
     *
     * @return array<string, mixed>
     */
    public function toRestrictedArray(InclusionSignal $signal): array
    {
        $signal->loadMissing(['subject', 'version', 'reviews.reviewer']);

        $reviews = $signal->reviews->map(fn (InclusionReview $review): array => [
            'id' => $review->id,
            'inclusion_signal_id' => $review->inclusion_signal_id,
            'reviewer_id' => $review->reviewer_id,
            'reviewer_name' => $review->reviewer?->name,
            'human_conclusion' => $review->human_conclusion,
            'support_action' => $review->support_action,
            'reason' => $review->reason,
            'created_at' => $review->created_at?->toIso8601String(),
        ])->values()->all();

        return [
            'id' => $signal->id,
            'institution_id' => $signal->institution_id,
            'subject_id' => $signal->subject_id,
            'subject_name' => $signal->subject?->name,
            'version_id' => $signal->version_id,
            'version' => $signal->version?->version,
            'period' => $signal->period,
            'restricted_feature_state' => (bool) $signal->restricted_feature_state,
            'data_sufficiency_met' => (bool) $signal->data_sufficiency_met,
            'evidence_summary' => $signal->evidence_summary,
            'created_at' => $signal->created_at?->toIso8601String(),
            'reviews' => $reviews,
        ];
    }
}
