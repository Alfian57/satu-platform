<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\OpportunitySupportRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $institution_id
 * @property int $owner_id
 * @property string $command_key
 * @property string $need
 * @property string|null $explanation
 * @property string $status
 * @property int $revision
 * @property string $purpose
 * @property string $consent_purpose
 * @property string $notice_version
 * @property string $approval_reference
 * @property string $dataset_kind
 * @property string $dataset_manifest
 * @property Carbon $expires_at
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class OpportunitySupportRequest extends Model implements InstitutionOwned
{
    /** @use HasFactory<OpportunitySupportRequestFactory> */
    use HasFactory;

    protected $attributes = ['status' => 'requested', 'revision' => 1];

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /** @return BelongsTo<Institution, $this> */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return HasMany<OpportunitySupportEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(OpportunitySupportEvent::class);
    }

    public function consentPurpose(): string
    {
        return $this->consent_purpose;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['revision' => 'integer', 'expires_at' => 'datetime'];
    }
}
