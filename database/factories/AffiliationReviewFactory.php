<?php

namespace Database\Factories;

use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Models\AffiliationRequest;
use App\Models\AffiliationReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AffiliationReview> */
class AffiliationReviewFactory extends Factory
{
    protected $model = AffiliationReview::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'affiliation_request_id' => AffiliationRequest::factory(),
            'institution_id' => fn (array $attributes): int => (int) AffiliationRequest::query()
                ->whereKey($attributes['affiliation_request_id'])
                ->firstOrFail()
                ->institution_id,
            'reviewer_id' => User::factory(),
            'decision' => AffiliationReviewDecision::Approve,
            'reason_code' => AffiliationReviewReason::RecordsConfirmed,
            'note' => null,
            'policy_version' => 'affiliation-review-v1',
            'previous_status' => AffiliationRequestStatus::PendingReview,
            'new_status' => AffiliationRequestStatus::Verified,
            'request_version' => 1,
        ];
    }
}
