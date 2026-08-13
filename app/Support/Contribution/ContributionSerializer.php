<?php

declare(strict_types=1);

namespace App\Support\Contribution;

use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\PortfolioEntry;

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
            'reviews.contributionVersion:id,version_number',
            'portfolioEntry:id,institution_id,user_id,contribution_id,contribution_version_id,title,summary,verification_level,visibility,published_at,withdrawn_at,updated_at',
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
            'provenance' => $this->provenance($contribution),
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

    /**
     * Build one chronological chain from task-linked versions through campus
     * decisions to the portfolio projection.
     *
     * @return array{timeline: list<array<string, mixed>>, portfolio: array<string, mixed>|null}
     */
    private function provenance(Contribution $contribution): array
    {
        $events = collect();

        foreach ($contribution->versions as $version) {
            $events->push([
                'id' => 'version-'.$version->getKey(),
                'type' => 'version_created',
                'label' => 'Versi '.$version->version_number.' dicatat',
                'occurred_at' => $version->created_at->toIso8601String(),
                'version_number' => $version->version_number,
                'task' => [
                    'id' => $version->task->getKey(),
                    'title' => $version->task->title,
                ],
            ]);
        }

        foreach ($contribution->reviews as $review) {
            $events->push([
                'id' => 'review-'.$review->getKey(),
                'type' => 'review_decision',
                'label' => 'Keputusan reviewer dicatat',
                'occurred_at' => $review->reviewed_at->toIso8601String(),
                'version_number' => $review->contributionVersion?->version_number,
                'decision' => $review->decision->value,
                'reviewer' => [
                    'id' => $review->reviewer->getKey(),
                    'name' => $review->reviewer->name,
                ],
                'policy_version' => $review->policy_version,
            ]);
        }

        $portfolio = $this->portfolio($contribution->portfolioEntry, $contribution);

        if ($portfolio !== null) {
            $events->push([
                'id' => 'portfolio-'.$portfolio['id'],
                'type' => 'portfolio_projection',
                'label' => 'Outcome portfolio tersedia',
                'occurred_at' => $portfolio['updated_at'],
                'version_number' => $contribution->portfolioEntry?->contribution_version_id === $contribution->current_version_id
                    ? $contribution->currentVersion?->version_number
                    : null,
                'portfolio' => $portfolio,
            ]);
        }

        return [
            'timeline' => array_values($events
                ->sortBy(fn (array $event): string => sprintf(
                    '%s|%02d|%s',
                    $event['occurred_at'],
                    $this->provenanceOrder($event['type']),
                    $event['id'],
                ))
                ->values()
                ->all()),
            'portfolio' => $portfolio,
        ];
    }

    private function provenanceOrder(string $type): int
    {
        return match ($type) {
            'version_created' => 10,
            'review_decision' => 20,
            'portfolio_projection' => 30,
            default => 99,
        };
    }

    /**
     * @return array<string, mixed>|null
     */
    private function portfolio(?PortfolioEntry $entry, Contribution $contribution): ?array
    {
        if (
            $entry === null
            || $entry->institution_id !== $contribution->institution_id
            || $entry->user_id !== $contribution->owner_id
            || $entry->contribution_id !== $contribution->getKey()
        ) {
            return null;
        }

        $status = $entry->withdrawn_at !== null
            ? 'withdrawn'
            : ($contribution->status->value !== 'approved'
                || $contribution->current_version_id !== $entry->contribution_version_id
                ? 'source_unavailable'
                : ($entry->visibility->value === 'private' ? 'private' : 'published'));

        return [
            'id' => $entry->getKey(),
            'title' => $entry->title,
            'verification_level' => $entry->verification_level->value,
            'verification_label' => $entry->verification_level->label(),
            'visibility' => $entry->visibility->value,
            'status' => $status,
            'published_at' => $entry->published_at?->toIso8601String(),
            'updated_at' => $entry->updated_at->toIso8601String(),
            'action_url' => route('portfolio.show', $entry),
        ];
    }
}
