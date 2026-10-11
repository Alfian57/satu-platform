<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\RecommendationFeedbackType;
use App\Models\Institution;
use App\Models\MatchingRefreshRequest;
use App\Models\MatchScoreVersion;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use App\Support\Matching\MatchingFreshness;
use App\Support\Matching\RecommendationQueryResult;
use App\Support\Project\ProjectOpportunityCapacity;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class RecommendationQuery
{
    public function __construct(private readonly MatchingFreshness $freshness, private readonly MatchingAvailability $availability) {}

    public function execute(User $user, Institution $institution, int $perPage = 20, int $page = 1): RecommendationQueryResult
    {
        Gate::forUser($user)->authorize('viewAny', [Recommendation::class, $institution]);
        if ($perPage < 1 || $perPage > 50 || $page < 1) {
            throw new InvalidArgumentException('Parameter pagination rekomendasi tidak valid.');
        }
        $version = MatchScoreVersion::current();
        $refresh = MatchingRefreshRequest::query()->where('institution_id', $institution->getKey())->where('candidate_id', $user->getKey())->first();
        $items = collect();
        $staleCount = 0;
        if ($version !== null && $this->availability->enabled() && $this->availability->supported($version) && $refresh?->status === 'ready' && $refresh->version_id === $version->getKey()) {
            $profile = StudentProfile::query()->where('institution_id', $institution->getKey())->where('user_id', $user->getKey())->with(['skills:id,student_profile_id,skill_taxonomy_id,proficiency', 'interests:id,student_profile_id,skill_taxonomy_id', 'availabilityWindows:id,student_profile_id,day_of_week,starts_at,ends_at,timezone'])->first();
            $hiddenProjects = Recommendation::query()->select('project_id')->where('institution_id', $institution->getKey())->where('candidate_id', $user->getKey())
                ->whereHas('feedback', fn ($feedback) => $feedback->where('institution_id', $institution->getKey())->where('actor_id', $user->getKey())
                    ->whereIn('feedback_type', [RecommendationFeedbackType::Hidden, RecommendationFeedbackType::NotRelevant]));
            if ($this->availability->profileReady($profile)) {
                $loaded = Recommendation::query()->forInstitution($institution)->whereBelongsTo($user, 'candidate')
                    ->where('expires_at', '>', now())->whereNotIn('project_id', $hiddenProjects)
                    ->whereRelation('project', 'institution_id', $institution->getKey())
                    ->whereRelation('matchRun', 'institution_id', $institution->getKey())
                    ->whereRelation('matchRun', 'version_id', $version->getKey())
                    ->whereRelation('matchRun', 'input_snapshot->refresh_revision', $refresh->revision)
                    ->whereDoesntHave('feedback', fn ($feedback) => $feedback->where('actor_id', $user->getKey()))
                    ->with([
                        'matchRun.version',
                        'project' => fn ($project) => $project->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeMembers(...)]),
                        'project.teamMemberships:id,project_id,user_id,project_role_id,status',
                        'project.roles' => fn ($roles) => $roles->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeRoleMembers(...)]),
                        'project.roles.skills.taxonomy',
                    ])->orderByDesc('total_score')->orderBy('project_id')->orderByDesc('id')->get();
                $items = $loaded->filter(fn (Recommendation $item): bool => $this->freshness->isFresh($item, $version->getKey(), $profile, $refresh))->values();
                $staleCount = $loaded->count() - $items->count();
            }
        }
        /** @var LengthAwarePaginator<int, Recommendation> $paginator */
        $paginator = new LengthAwarePaginator($items->forPage($page, $perPage)->values(), $items->count(), $perPage, $page);

        return new RecommendationQueryResult($institution, $version?->getKey(), $paginator, $staleCount);
    }
}
