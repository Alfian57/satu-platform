<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\RecommendationFeedbackType;
use Database\Factories\RecommendationFeedbackFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only student outcome for one recommendation.
 *
 * @property int $id
 * @property int $recommendation_id
 * @property int $institution_id
 * @property int $actor_id
 * @property RecommendationFeedbackType $feedback_type
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class RecommendationFeedback extends Model implements InstitutionOwned
{
    /** @use HasFactory<RecommendationFeedbackFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<Recommendation, $this>
     */
    public function recommendation(): BelongsTo
    {
        return $this->belongsTo(Recommendation::class);
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /**
     * @param  Builder<RecommendationFeedback>  $query
     */
    #[Scope]
    protected function forInstitution(Builder $query, Institution|int $institution): void
    {
        $query->where(
            'institution_id',
            $institution instanceof Institution ? $institution->getKey() : $institution,
        );
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Recommendation feedback is append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Recommendation feedback is append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'feedback_type' => RecommendationFeedbackType::class,
            'created_at' => 'datetime',
        ];
    }
}
