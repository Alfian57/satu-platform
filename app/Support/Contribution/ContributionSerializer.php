<?php

declare(strict_types=1);

namespace App\Support\Contribution;

use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;

final class ContributionSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function contribution(Contribution $contribution): array
    {
        $contribution->loadMissing([
            'owner:id,name',
            'project:id,title',
            'currentVersion.task:id,title,project_id',
            'currentVersion.evidence.attachment',
            'versions.createdBy:id,name',
            'versions.task:id,title,project_id',
            'versions.evidence.attachment',
            'reviews.reviewer:id,name',
        ]);

        return [
            'id' => $contribution->getKey(),
            'project' => [
                'id' => $contribution->project->getKey(),
                'title' => $contribution->project->title,
            ],
            'owner' => [
                'id' => $contribution->owner->getKey(),
                'name' => $contribution->owner->name,
            ],
            'status' => $contribution->status->value,
            'current_version_id' => $contribution->current_version_id,
            'current_version' => $contribution->currentVersion === null
                ? null
                : $this->version($contribution->currentVersion),
            'versions' => $contribution->versions
                ->map(fn (ContributionVersion $version): array => $this->version($version))
                ->values()
                ->all(),
            'reviews' => $contribution->reviews
                ->map(fn (ContributionReview $review): array => $this->review($review))
                ->values()
                ->all(),
            'created_at' => $contribution->created_at->toIso8601String(),
            'updated_at' => $contribution->updated_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function version(ContributionVersion $version): array
    {
        $version->loadMissing([
            'createdBy:id,name',
            'task:id,title,project_id',
            'evidence.attachment',
        ]);

        return [
            'id' => $version->getKey(),
            'version_number' => $version->version_number,
            'claim' => $version->claim,
            'summary' => $version->summary,
            'declaration' => $version->declaration,
            'task' => [
                'id' => $version->task->getKey(),
                'title' => $version->task->title,
            ],
            'created_by' => [
                'id' => $version->createdBy->getKey(),
                'name' => $version->createdBy->name,
            ],
            'evidence' => $version->evidence
                ->map(fn (ContributionEvidence $evidence): array => $this->evidence($evidence))
                ->values()
                ->all(),
            'created_at' => $version->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function evidence(ContributionEvidence $evidence): array
    {
        $attachment = $evidence->attachment;

        return [
            'id' => $evidence->getKey(),
            'attachment_id' => $evidence->attachment_id,
            'source_label' => $evidence->source_label,
            'notes' => $evidence->notes,
            'available' => $attachment !== null && ! $attachment->trashed(),
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
        $review->loadMissing('reviewer:id,name');

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
            'created_at' => $review->created_at->toIso8601String(),
        ];
    }
}
