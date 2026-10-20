<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Models\MatchingRefreshRequest;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use Illuminate\Support\Facades\DB;

final class RebuildCandidateRecommendations
{
    public function __construct(private readonly GenerateRecommendation $generate, private readonly MatchingAvailability $availability) {}

    public function handle(int $refreshId, int $institutionId, int $candidateId, string $revision): void
    {
        DB::transaction(function () use ($refreshId, $institutionId, $candidateId, $revision): void {
            $target = MatchingRefreshRequest::query()->whereKey($refreshId)->where('institution_id', $institutionId)
                ->where('candidate_id', $candidateId)->where('revision', $revision)->where('status', 'queued');
            if (! (clone $target)->exists()) {
                return;
            }
            if (! $this->availability->enabled() || ! $this->availability->candidateAllowed($institutionId, $candidateId)) {
                $target->update(['status' => 'blocked', 'outcome' => 'context_unavailable', 'completed_at' => now()]);

                return;
            }
            $profile = StudentProfile::query()->where('institution_id', $institutionId)->where('user_id', $candidateId)
                ->lockForUpdate()->with(['skills:id,student_profile_id,skill_taxonomy_id,proficiency', 'interests:id,student_profile_id,skill_taxonomy_id', 'availabilityWindows:id,student_profile_id,day_of_week,starts_at,ends_at,timezone'])->first();
            $refresh = MatchingRefreshRequest::query()->whereKey($refreshId)->where('institution_id', $institutionId)
                ->where('candidate_id', $candidateId)->where('revision', $revision)->lockForUpdate()->first();
            if ($refresh === null || $refresh->status !== 'queued') {
                return;
            }
            $version = MatchScoreVersion::current();
            if ($profile === null || $version === null || ! $this->availability->profileReady($profile) || ! $this->availability->supported($version)) {
                $refresh->forceFill(['status' => 'blocked', 'outcome' => 'context_unavailable', 'completed_at' => now()])->save();

                return;
            }
            $actor = User::query()->findOrFail($candidateId);
            $count = 0;
            Project::query()->where('institution_id', $institutionId)->where('owner_id', '!=', $candidateId)
                ->whereIn('visibility', ['institution', 'public'])->whereIn('status', ['open', 'forming'])
                ->where('deadline', '>', now())->orderBy('id')->chunkById(50, function ($projects) use ($actor, $profile, $version, $revision, &$count): void {
                    foreach ($projects as $project) {
                        if ($this->generate->executeOpportunity($actor, $profile, $project, $version, $revision) !== null) {
                            $count++;
                        }
                    }
                });
            $refresh->forceFill(['status' => 'ready', 'version_id' => $version->getKey(), 'completed_at' => now(), 'outcome' => $count === 0 ? 'empty' : 'available'])->save();
        }, attempts: 3);
    }
}
