<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Models\Institution;
use App\Models\MatchScoreVersion;
use App\Models\Recommendation;
use App\Models\User;
use App\Support\Matching\RecommendationQueryResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class RecommendationQuery
{
    public function execute(
        User $user,
        Institution $institution,
        int $perPage = 20,
        int $page = 1,
    ): RecommendationQueryResult {
        Gate::forUser($user)->authorize('viewAny', [Recommendation::class, $institution]);

        if ($perPage < 1 || $perPage > 50) {
            throw new InvalidArgumentException('Jumlah recommendation per halaman harus berada di antara 1 dan 50.');
        }

        if ($page < 1) {
            throw new InvalidArgumentException('Halaman recommendation harus bernilai positif.');
        }

        $currentVersionId = MatchScoreVersion::current()?->getKey();
        $query = Recommendation::query()
            ->select([
                'recommendations.id',
                'recommendations.match_run_id',
                'recommendations.institution_id',
                'recommendations.project_id',
                'recommendations.candidate_id',
                'recommendations.component_scores',
                'recommendations.total_score',
                'recommendations.reason_candidates',
                'recommendations.expires_at',
                'recommendations.created_at',
                'recommendations.updated_at',
            ])
            ->forInstitution($institution)
            ->whereBelongsTo($user, 'candidate')
            ->whereRelation('project', 'institution_id', $institution->getKey())
            ->whereRelation('matchRun', 'institution_id', $institution->getKey())
            ->whereDoesntHave('feedback', function (Builder $feedback) use ($user): void {
                $feedback->whereBelongsTo($user, 'actor');
            })
            ->where(function (Builder $recommendations): void {
                $recommendations
                    ->whereNull('recommendations.expires_at')
                    ->orWhere('recommendations.expires_at', '>', now());
            })
            ->with([
                'project:id,institution_id,title,status,deadline',
                'matchRun:id,version_id',
                'matchRun.version:id,version,activated_at',
            ])
            ->orderByDesc('recommendations.total_score')
            ->orderBy('recommendations.project_id')
            ->orderBy('recommendations.id');

        /** @var LengthAwarePaginator<int, Recommendation> $paginator */
        $paginator = $query->paginate(
            $perPage,
            ['*'],
            'page',
            $page,
        );

        return new RecommendationQueryResult($institution, $currentVersionId, $paginator);
    }
}
