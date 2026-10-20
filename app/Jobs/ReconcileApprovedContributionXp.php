<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\ContributionReviewDecision;
use App\Events\ContributionApproved;
use App\Listeners\AwardApprovedContributionXp;
use App\Models\Contribution;
use App\Models\Institution;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ReconcileApprovedContributionXp implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 120;

    public int $uniqueFor = 3600;

    /** @var list<int> */
    public array $backoff = [60, 300, 900, 1800];

    public function __construct(public readonly int $institutionId) {}

    public function uniqueId(): string
    {
        return 'xp-reconcile:'.$this->institutionId;
    }

    /** @return list<WithoutOverlapping> */
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->uniqueId()))->releaseAfter(30)->expireAfter(180)];
    }

    public function handle(ResolveConfiguredUniversity $university, AwardApprovedContributionXp $consumer): void
    {
        $institution = Institution::query()->findOrFail($this->institutionId);
        $university->handle($institution);

        Contribution::query()->whereBelongsTo($institution)->awaitingXp()
            ->with('currentVersion.reviews')
            ->chunkById(100, function (Collection $contributions) use ($consumer): void {
                foreach ($contributions as $contribution) {
                    $version = $contribution->currentVersion;
                    $review = $version?->reviews->firstWhere('decision', ContributionReviewDecision::Approved);

                    if ($version === null || $review === null) {
                        continue;
                    }

                    $consumer->handle(new ContributionApproved(
                        contributionId: $contribution->getKey(),
                        contributionVersionId: $version->getKey(),
                        reviewId: $review->getKey(),
                        reviewerId: $review->reviewer_id,
                        institutionId: $contribution->institution_id,
                        policyVersion: $review->policy_version,
                    ));
                }
            });
    }

    public function failed(?Throwable $exception = null): void
    {
        Log::error('gamification.xp_reconciliation_failed', [
            'institution_id' => $this->institutionId,
            'error_class' => $exception === null ? null : $exception::class,
        ]);
    }
}
