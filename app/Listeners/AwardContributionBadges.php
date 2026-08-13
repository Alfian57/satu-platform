<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Gamification\EvaluateContributionBadges;
use App\Events\ContributionApproved;
use App\Models\Contribution;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class AwardContributionBadges implements ShouldQueueAfterCommit
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 90;

    /**
     * @var array<int>
     */
    public array $backoff = [60, 300, 900, 1800, 3600];

    public function __construct(
        private readonly EvaluateContributionBadges $evaluate,
    ) {}

    public function handle(ContributionApproved $event): void
    {
        $contribution = Contribution::query()->find($event->contributionId);

        if (
            $contribution === null
            || $contribution->institution_id !== $event->institutionId
            || $contribution->current_version_id !== $event->contributionVersionId
        ) {
            Log::warning('gamification.badge_award_skipped', [
                'contribution_id' => $event->contributionId,
                'institution_id' => $event->institutionId,
                'reason' => 'approved_event_source_mismatch',
            ]);

            return;
        }

        $reviewer = User::query()->find($event->reviewerId);

        if ($reviewer === null) {
            Log::warning('gamification.badge_award_skipped', [
                'contribution_id' => $event->contributionId,
                'institution_id' => $event->institutionId,
                'reason' => 'reviewer_missing',
            ]);

            return;
        }

        $this->evaluate->handle($contribution, $reviewer);
    }

    public function failed(?Throwable $exception = null): void
    {
        Log::error('gamification.badge_award_failed', [
            'error_class' => $exception === null ? null : $exception::class,
            'error' => $exception?->getMessage(),
        ]);
    }
}
