<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\ContributionReviewDecision;
use Database\Factories\ContributionReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only campus decision for one immutable contribution version.
 *
 * @property int $id
 * @property int $contribution_version_id
 * @property int $reviewer_id
 * @property ContributionReviewDecision $decision
 * @property string $policy_version
 * @property string|null $reason
 * @property string|null $note
 * @property Carbon $reviewed_at
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class ContributionReview extends Model implements InstitutionOwned
{
    /** @use HasFactory<ContributionReviewFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<ContributionVersion, $this>
     */
    public function contributionVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function institutionId(): int
    {
        return $this->contributionVersion->institutionId();
    }

    /**
     * Prevent changes to a campus decision. A later version carries a later decision.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty([
            'contribution_version_id',
            'reviewer_id',
            'decision',
            'reason',
            'note',
            'reviewed_at',
        ])) {
            throw new LogicException('Contribution reviews are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Contribution reviews are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'decision' => ContributionReviewDecision::class,
            'reviewed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
