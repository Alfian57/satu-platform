<?php

declare(strict_types=1);

namespace App\Actions\Portfolio;

use App\Enums\InstitutionStatus;
use App\Enums\PortfolioVisibility;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Support\Portfolio\PortfolioEntrySerializer;
use App\Support\Portfolio\PublicPortfolioSerializer;

final class BuildPublicPortfolioProjection
{
    public function __construct(
        private readonly PortfolioEntrySerializer $entrySerializer,
        private readonly PublicPortfolioSerializer $profileSerializer,
    ) {}

    /**
     * Build the public projection for one shareable profile identifier.
     *
     * @return array{state: 'published'|'unavailable', profile: array<string, mixed>|null, entries: list<array<string, mixed>>}|null
     */
    public function handle(string $publicIdentifier): ?array
    {
        $profile = StudentProfile::query()
            ->with([
                'user:id,name',
                'institution:id,name,status',
            ])
            ->where('public_identifier', $publicIdentifier)
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->first();

        if ($profile === null) {
            return null;
        }

        $entries = PortfolioEntry::query()
            ->select([
                'id',
                'institution_id',
                'user_id',
                'title',
                'summary',
                'verification_level',
                'published_at',
                'withdrawn_at',
            ])
            ->where('user_id', $profile->user_id)
            ->forInstitution($profile->institution_id)
            ->visibleToPublic()
            ->latest('published_at')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (PortfolioEntry $entry): array => $this->entrySerializer->publicProjection($entry))
            ->values()
            ->all();

        if (
            $profile->portfolio_visibility !== PortfolioVisibility::Public
            || $entries === []
        ) {
            return [
                'state' => 'unavailable',
                'profile' => null,
                'entries' => [],
            ];
        }

        return [
            'state' => 'published',
            'profile' => $this->profileSerializer->profile($profile),
            'entries' => array_values($entries),
        ];
    }
}
