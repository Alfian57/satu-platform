<?php

declare(strict_types=1);

namespace App\Support\Portfolio;

use App\Enums\ContributionStatus;
use App\Models\PortfolioEntry;

final class PortfolioEntrySerializer
{
    /**
     * Serialize an entry for its student or an authorized campus viewer.
     * Evidence, review notes, audit fields, and storage metadata stay outside
     * this boundary.
     *
     * @return array<string, mixed>
     */
    public function toArray(PortfolioEntry $entry): array
    {
        $entry->loadMissing([
            'contribution:id,institution_id,owner_id,status,current_version_id',
            'sourceVersion:id,contribution_id,version_number',
        ]);

        return [
            'id' => $entry->getKey(),
            'title' => $entry->title,
            'summary' => $entry->summary,
            'verification_level' => $entry->verification_level->value,
            'verification_label' => $entry->verification_level->label(),
            'visibility' => $entry->visibility->value,
            'status' => $this->status($entry),
            'source' => [
                'type' => 'approved_contribution',
                'contribution_id' => $entry->contribution_id,
                'version_id' => $entry->contribution_version_id,
                'version_number' => $entry->sourceVersion?->version_number,
                'status' => $entry->contribution?->status->value,
            ],
            'published_at' => $entry->published_at?->toIso8601String(),
            'withdrawn_at' => $entry->withdrawn_at?->toIso8601String(),
            'updated_at' => $entry->updated_at->toIso8601String(),
        ];
    }

    /**
     * Serialize only the recruiter-safe visible projection of an entry.
     *
     * @return array<string, mixed>
     */
    public function recruiter(PortfolioEntry $entry): array
    {
        return [
            'id' => $entry->getKey(),
            'title' => $entry->title,
            'summary' => $entry->summary,
            'verification_level' => $entry->verification_level->value,
            'verification_label' => $entry->verification_level->label(),
            'published_at' => $entry->published_at?->toIso8601String(),
        ];
    }

    /**
     * Serialize the public allowlist without source identifiers or private metadata.
     *
     * @return array<string, mixed>
     */
    public function publicProjection(PortfolioEntry $entry): array
    {
        return [
            'id' => $entry->getKey(),
            'title' => $entry->title,
            'summary' => $entry->summary,
            'verification_level' => $entry->verification_level->value,
            'verification_label' => $entry->verification_level->label(),
            'published_at' => $entry->published_at?->toIso8601String(),
        ];
    }

    private function status(PortfolioEntry $entry): string
    {
        if ($entry->withdrawn_at !== null) {
            return 'withdrawn';
        }

        if (
            $entry->contribution === null
            || $entry->contribution->status !== ContributionStatus::Approved
            || $entry->contribution->current_version_id !== $entry->contribution_version_id
        ) {
            return 'source_unavailable';
        }

        return $entry->visibility->value === 'private' ? 'private' : 'published';
    }
}
