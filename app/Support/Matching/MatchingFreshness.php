<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Models\MatchingRefreshRequest;
use App\Models\Recommendation;
use App\Models\StudentProfile;

final class MatchingFreshness
{
    public function __construct(private readonly MatchingSource $source, private readonly MatchingAvailability $availability) {}

    public function isFresh(Recommendation $recommendation, ?int $versionId, ?StudentProfile $profile = null, ?MatchingRefreshRequest $refresh = null): bool
    {
        if (! $this->availability->enabled() || $recommendation->isStaleAgainst($versionId)) {
            return false;
        }
        $recommendation->loadMissing(['matchRun', 'project.roles.skills.taxonomy', 'project.teamMemberships:id,project_id,user_id,project_role_id,status']);
        $snapshot = $recommendation->matchRun->input_snapshot;
        if (($snapshot['policy'] ?? null) !== MatchingAvailability::POLICY || ! is_string($snapshot['source_digest'] ?? null)) {
            return false;
        }
        $profile ??= StudentProfile::query()->where('institution_id', $recommendation->institution_id)->where('user_id', $recommendation->candidate_id)->first();
        $project = $recommendation->project;
        if ($profile === null || $project === null || $profile->user_id !== $recommendation->candidate_id || $project->institution_id !== $profile->institution_id
            || $recommendation->matchRun->institution_id !== $profile->institution_id || $recommendation->matchRun->actor_id !== $profile->user_id
            || $recommendation->matchRun->project_id !== $recommendation->project_id) {
            return false;
        }
        $this->source->loadProfile($profile);
        $this->source->loadProject($project);
        if (! $this->availability->profileReady($profile) || ! $this->source->eligible($project, $profile->user_id)
            || ! hash_equals($snapshot['source_digest'], $this->source->digest($profile, $project))) {
            return false;
        }
        $revision = $snapshot['refresh_revision'] ?? null;

        if ($revision === null) {
            return true;
        }
        $refresh ??= MatchingRefreshRequest::query()->where('institution_id', $profile->institution_id)->where('candidate_id', $profile->user_id)->first();

        return is_string($revision) && $refresh !== null && $refresh->institution_id === $profile->institution_id
            && $refresh->candidate_id === $profile->user_id && $refresh->revision === $revision && $refresh->status === 'ready' && $refresh->version_id === $versionId;
    }
}
