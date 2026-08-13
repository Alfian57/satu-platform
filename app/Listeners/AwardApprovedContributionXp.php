<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Events\ContributionApproved;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class AwardApprovedContributionXp implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 90;

    /**
     * @var array<int>
     */
    public array $backoff = [60, 300, 900, 1800, 3600];

    public function __construct(
        private readonly AwardVerifiedContributionXp $award,
    ) {}

    public function handle(ContributionApproved $event): void
    {
        $contribution = Contribution::query()->find($event->contributionId);

        if (
            $contribution === null
            || $contribution->institution_id !== $event->institutionId
            || $contribution->current_version_id !== $event->contributionVersionId
        ) {
            Log::warning('gamification.xp_award_skipped', [
                'contribution_id' => $event->contributionId,
                'institution_id' => $event->institutionId,
                'reason' => 'approved_event_source_mismatch',
            ]);

            return;
        }

        $reviewExists = ContributionReview::query()
            ->whereKey($event->reviewId)
            ->where('contribution_version_id', $event->contributionVersionId)
            ->where('decision', 'approved')
            ->exists();

        if (! $reviewExists) {
            Log::warning('gamification.xp_award_skipped', [
                'contribution_id' => $event->contributionId,
                'institution_id' => $event->institutionId,
                'reason' => 'approved_review_missing',
            ]);

            return;
        }

        $reviewer = User::query()->find($event->reviewerId);

        $this->award->handle(
            contribution: $contribution,
            actor: $reviewer,
        );
    }

    public function failed(?Throwable $exception = null): void
    {
        Log::error('gamification.xp_award_failed', [
            'error_class' => $exception === null ? null : $exception::class,
            'error' => $exception?->getMessage(),
        ]);
    }
}
