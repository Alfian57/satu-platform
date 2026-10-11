<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Jobs\RebuildCandidateRecommendations;
use App\Models\MatchingRefreshRequest;
use App\Models\MatchScoreVersion;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Support\Matching\MatchingAvailability;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RequestMatchingRefresh
{
    public function __construct(private readonly MatchingAvailability $availability) {}

    public function handle(int $institutionId, int $candidateId): MatchingRefreshRequest
    {
        if (! $this->availability->enabled() || ! $this->availability->candidateAllowed($institutionId, $candidateId)) {
            throw new AuthorizationException('Pembaruan rekomendasi tidak tersedia dalam konteks ini.');
        }

        return DB::transaction(function () use ($institutionId, $candidateId): MatchingRefreshRequest {
            $profile = StudentProfile::query()->where('institution_id', $institutionId)->where('user_id', $candidateId)->lockForUpdate()->firstOrFail();
            $refresh = MatchingRefreshRequest::query()->where('institution_id', $institutionId)->where('candidate_id', $candidateId)->lockForUpdate()->first();
            if ($refresh?->status === 'queued') {
                return $refresh;
            }
            $version = MatchScoreVersion::current();
            $ready = $this->availability->profileReady($profile);
            $supported = $this->availability->supported($version);
            $refresh ??= new MatchingRefreshRequest;
            $refresh->forceFill([
                'institution_id' => $institutionId, 'candidate_id' => $candidateId,
                'revision' => (string) Str::uuid(), 'status' => $ready && $supported ? 'queued' : 'blocked',
                'version_id' => $version?->getKey(), 'requested_at' => now(), 'completed_at' => null,
                'outcome' => ! $ready ? 'profile_incomplete' : (! $supported ? 'version_unavailable' : null),
            ])->save();
            Recommendation::query()->where('institution_id', $institutionId)->where('candidate_id', $candidateId)
                ->where(fn ($recommendations) => $recommendations->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->update(['expires_at' => now()]);
            if ($refresh->status === 'queued') {
                RebuildCandidateRecommendations::dispatch($refresh->getKey(), $institutionId, $candidateId, $refresh->revision)->afterCommit();
            }

            return $refresh;
        }, attempts: 3);
    }
}
