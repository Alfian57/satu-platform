<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\MatchingDimension;
use Database\Factories\RecommendationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Explainable recommendation projection for one match run.
 *
 * @property int $id
 * @property int $match_run_id
 * @property int $institution_id
 * @property int $project_id
 * @property int $candidate_id
 * @property array<string, float> $component_scores
 * @property float $total_score
 * @property list<array{dimension: string, score: float, type: string, reason: string}> $reason_candidates
 * @property Carbon|null $expires_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable([
    'match_run_id',
    'institution_id',
    'project_id',
    'candidate_id',
    'component_scores',
    'total_score',
    'reason_candidates',
    'expires_at',
])]
class Recommendation extends Model implements InstitutionOwned
{
    /** @use HasFactory<RecommendationFactory> */
    use HasFactory;

    /**
     * Keep internal connectivity detail out of accidental model serialization.
     * The matching service retains it for authorized server-side use.
     *
     * @var list<string>
     */
    protected $hidden = ['component_scores', 'reason_candidates'];

    /**
     * @return BelongsTo<MatchRun, $this>
     */
    public function matchRun(): BelongsTo
    {
        return $this->belongsTo(MatchRun::class);
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    /**
     * @return HasMany<RecommendationFeedback, $this>
     */
    public function feedback(): HasMany
    {
        return $this->hasMany(RecommendationFeedback::class);
    }

    /**
     * Scope the query to one institution.
     *
     * @param  Builder<Recommendation>  $query
     */
    #[Scope]
    protected function forInstitution(Builder $query, Institution|int $institution): void
    {
        $query->where(
            'institution_id',
            $institution instanceof Institution ? $institution->getKey() : $institution,
        );
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function scoreVersionId(): ?int
    {
        if ($this->relationLoaded('matchRun')) {
            return $this->matchRun?->version_id;
        }

        $versionId = $this->matchRun()->value('version_id');

        return $versionId === null ? null : (int) $versionId;
    }

    public function isStaleAgainst(?int $currentVersionId): bool
    {
        return $currentVersionId === null || $this->scoreVersionId() !== $currentVersionId;
    }

    /**
     * Return the explanation safe for student/project surfaces.
     *
     * @return array<string, mixed>
     */
    public function safeExplanation(): array
    {
        $publicDimensions = [
            MatchingDimension::SkillFit->value,
            MatchingDimension::ProjectNeed->value,
            MatchingDimension::Availability->value,
        ];
        $components = array_intersect_key(
            $this->component_scores,
            array_fill_keys($publicDimensions, true),
        );
        $reasons = array_values(array_filter(
            $this->reason_candidates,
            fn (array $reason): bool => in_array($reason['dimension'], $publicDimensions, true),
        ));

        return [
            'recommendation_id' => $this->getKey(),
            'project_id' => $this->project_id,
            'total_score' => $this->total_score,
            'component_scores' => $components,
            'reason_candidates' => $reasons,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'component_scores' => 'array',
            'total_score' => 'float',
            'reason_candidates' => 'array',
            'expires_at' => 'datetime',
        ];
    }
}
