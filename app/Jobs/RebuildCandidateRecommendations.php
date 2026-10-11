<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Matching\RebuildCandidateRecommendations as RebuildAction;
use App\Models\MatchingRefreshRequest;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class RebuildCandidateRecommendations implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /** @var list<int> */
    public array $backoff = [10, 60, 120];

    public function __construct(public readonly int $refreshId, public readonly int $institutionId, public readonly int $candidateId, public readonly string $revision) {}

    public function handle(RebuildAction $rebuild): void
    {
        $rebuild->handle($this->refreshId, $this->institutionId, $this->candidateId, $this->revision);
    }

    public function failed(?Throwable $exception = null): void
    {
        MatchingRefreshRequest::query()->whereKey($this->refreshId)->where('institution_id', $this->institutionId)
            ->where('candidate_id', $this->candidateId)->where('revision', $this->revision)->where('status', 'queued')
            ->update(['status' => 'failed', 'outcome' => 'processing_failed']);
        Log::warning('matching.refresh_failed', ['institution_id' => $this->institutionId, 'refresh_id' => $this->refreshId, 'error_class' => $exception === null ? null : $exception::class]);
    }
}
