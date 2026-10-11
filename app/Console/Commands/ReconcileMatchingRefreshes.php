<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Matching\RequestMatchingRefresh;
use App\Jobs\RebuildCandidateRecommendations;
use App\Models\MatchingRefreshRequest;
use App\Models\MatchScoreVersion;
use App\Support\Matching\MatchingAvailability;
use Illuminate\Console\Command;

final class ReconcileMatchingRefreshes extends Command
{
    protected $signature = 'matching:reconcile-refreshes';

    protected $description = 'Rekonsiliasi antrean pencocokan tertunda, versi berubah dan masa berlaku hasil';

    public function handle(RequestMatchingRefresh $requestRefresh, MatchingAvailability $availability): int
    {
        if (! $availability->enabled()) {
            $this->info('Pembaruan dinamis tidak aktif.');

            return self::SUCCESS;
        }
        $versionId = MatchScoreVersion::current()?->getKey();
        MatchingRefreshRequest::query()->orderBy('id')->chunkById(100, function ($requests) use ($versionId, $requestRefresh, $availability): void {
            foreach ($requests as $request) {
                if (! $availability->candidateAllowed($request->institution_id, $request->candidate_id)) {
                    continue;
                }
                if ($request->status === 'queued' && $request->requested_at->lte(now()->subMinutes(3))) {
                    RebuildCandidateRecommendations::dispatch($request->getKey(), $request->institution_id, $request->candidate_id, $request->revision)->afterCommit();
                } elseif ($request->version_id !== $versionId || ($request->status === 'ready' && $request->completed_at?->lte(now()->subMinutes((int) config('matching.ttl_minutes', 360))))) {
                    $requestRefresh->handle($request->institution_id, $request->candidate_id);
                }
            }
        });
        $this->info('Rekonsiliasi selesai. GET tidak menjalankan command ini.');

        return self::SUCCESS;
    }
}
