<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\ContributionEvidenceFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable private evidence reference for a contribution version.
 *
 * @property int $id
 * @property int $contribution_version_id
 * @property int $attachment_id
 * @property string $source_label
 * @property string|null $notes
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class ContributionEvidence extends Model implements InstitutionOwned
{
    /** @use HasFactory<ContributionEvidenceFactory> */
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
     * @return BelongsTo<Attachment, $this>
     */
    public function attachment(): BelongsTo
    {
        return $this->belongsTo(Attachment::class)->withTrashed();
    }

    public function institutionId(): int
    {
        return $this->contributionVersion->institutionId();
    }

    /**
     * Prevent changes to evidence provenance.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty([
            'contribution_version_id',
            'attachment_id',
            'source_label',
            'notes',
        ])) {
            throw new LogicException('Contribution evidence is immutable. Add a new evidence record instead.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Contribution evidence is immutable.');
    }
}
