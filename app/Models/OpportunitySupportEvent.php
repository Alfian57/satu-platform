<?php

namespace App\Models;

use Database\Factories\OpportunitySupportEventFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * @property int $id
 * @property int $actor_id
 * @property string $action
 * @property string|null $reason
 * @property int|null $project_role_id
 * @property int $revision
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class OpportunitySupportEvent extends Model
{
    /** @use HasFactory<OpportunitySupportEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /** @return BelongsTo<OpportunitySupportRequest, $this> */
    public function request(): BelongsTo
    {
        return $this->belongsTo(OpportunitySupportRequest::class, 'opportunity_support_request_id');
    }

    /** @return BelongsTo<ProjectRole, $this> */
    public function projectRole(): BelongsTo
    {
        return $this->belongsTo(ProjectRole::class);
    }

    /** @param array<string, mixed> $options */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Support events are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Support events are append-only.');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['revision' => 'integer', 'created_at' => 'datetime'];
    }
}
