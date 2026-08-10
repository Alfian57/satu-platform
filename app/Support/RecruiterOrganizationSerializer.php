<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;

class RecruiterOrganizationSerializer
{
    /**
     * Transform a RecruiterOrganization model into an allowlisted projection.
     *
     * @return array<string, mixed>
     */
    public function toArray(RecruiterOrganization $organization, bool $includeReviews = true): array
    {
        $organization->loadMissing(['reviews.reviewer', 'memberships.user']);

        $reviews = $includeReviews
            ? $organization->reviews->map(fn (RecruiterVerificationReview $review): array => [
                'id' => $review->id,
                'reviewer_id' => $review->reviewer_id,
                'reviewer_name' => $review->reviewer?->name,
                'conclusion' => $review->conclusion->value,
                'reason' => $review->reason,
                'created_at' => $review->created_at->toIso8601String(),
            ])->values()->all()
            : [];

        $evidenceMetadata = is_array($organization->evidence_metadata)
            ? array_intersect_key($organization->evidence_metadata, array_flip([
                'document_type',
                'business_license_number_masked',
                'verification_notes',
                'submitted_at',
            ]))
            : null;

        return [
            'id' => $organization->id,
            'name' => $organization->name,
            'industry' => $organization->industry,
            'website' => $organization->website,
            'status' => $organization->status->value,
            'evidence_metadata' => $evidenceMetadata,
            'created_at' => $organization->created_at->toIso8601String(),
            'reviews' => $reviews,
        ];
    }
}
