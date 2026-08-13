<?php

declare(strict_types=1);

namespace App\Support\Contribution;

use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;

final class ContributionReviewQueueSerializer
{
    /**
     * Serialize only the campus review projection. Storage internals and raw
     * audit metadata never cross this boundary.
     *
     * @return array<string, mixed>
     */
    public function item(Contribution $contribution): array
    {
        return [
            'id' => $contribution->getKey(),
            'reference' => sprintf('CN-%06d', $contribution->getKey()),
            'project' => [
                'id' => $contribution->project->getKey(),
                'title' => $contribution->project->title,
            ],
            'contributor' => [
                'id' => $contribution->owner->getKey(),
                'name' => $contribution->owner->name,
            ],
            'status' => $contribution->status->value,
            'updated_at' => $contribution->updated_at->toIso8601String(),
            'current_version' => $contribution->currentVersion === null
                ? null
                : $this->version($contribution->currentVersion),
            'reviews' => $contribution->reviews
                ->map(fn (ContributionReview $review): array => $this->review($review))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function version(ContributionVersion $version): array
    {
        return [
            'id' => $version->getKey(),
            'version_number' => $version->version_number,
            'claim' => $version->claim,
            'summary' => $version->summary,
            'declaration' => $version->declaration,
            'task' => $version->task === null
                ? null
                : [
                    'id' => $version->task->getKey(),
                    'title' => $version->task->title,
                ],
            'created_by' => [
                'id' => $version->createdBy->getKey(),
                'name' => $version->createdBy->name,
            ],
            'created_at' => $version->created_at->toIso8601String(),
            'evidence' => $version->evidence
                ->map(fn (ContributionEvidence $evidence): array => $this->evidence($evidence))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function evidence(ContributionEvidence $evidence): array
    {
        $attachment = $evidence->attachment;
        $available = $attachment !== null && ! $attachment->trashed();

        return [
            'id' => $evidence->getKey(),
            'source_label' => $evidence->source_label,
            'notes' => $evidence->notes,
            'available' => $available,
            'attachment' => $attachment === null
                ? null
                : [
                    'id' => $attachment->getKey(),
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'size_bytes' => $attachment->size_bytes,
                ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function review(ContributionReview $review): array
    {
        return [
            'id' => $review->getKey(),
            'contribution_version_id' => $review->contribution_version_id,
            'reviewer' => [
                'id' => $review->reviewer->getKey(),
                'name' => $review->reviewer->name,
            ],
            'decision' => $review->decision->value,
            'policy_version' => $review->policy_version,
            'reason' => $review->reason,
            'note' => $review->note,
            'reviewed_at' => $review->reviewed_at->toIso8601String(),
        ];
    }
}
