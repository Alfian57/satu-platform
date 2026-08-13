<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Actions\Portfolio\SyncApprovedPortfolioEntry;
use App\Events\ContributionApproved;
use App\Models\Institution;
use App\Models\User;
use App\Notifications\PortfolioEntryReadyNotification;

final class SyncApprovedContributionPortfolio
{
    public function __construct(
        private readonly SyncApprovedPortfolioEntry $syncEntry,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
    ) {}

    public function handle(ContributionApproved $event): void
    {
        $entry = $this->syncEntry->handle($event);

        if ($entry === null) {
            return;
        }

        $owner = User::query()->findOrFail($entry->user_id);

        $this->rebuildProjection->handle(
            $owner,
            Institution::query()->findOrFail($entry->institution_id),
        );

        $owner->notify(new PortfolioEntryReadyNotification($entry));
    }
}
