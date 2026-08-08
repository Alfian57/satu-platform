<?php

namespace App\Models;

use App\Enums\IntegrationSyncStatus;
use Database\Factories\IntegrationSyncFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A synchronization request to an academic provider.
 *
 * @property int $id
 * @property int $integration_connection_id
 * @property string $source
 * @property string $mapping_version
 * @property string $idempotency_key
 * @property string $payload_digest
 * @property IntegrationSyncStatus $status
 * @property string|null $external_reference
 * @property int $attempts
 * @property Carbon|null $last_attempt_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class IntegrationSync extends Model
{
    /** @use HasFactory<IntegrationSyncFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => IntegrationSyncStatus::Queued->value,
        'attempts' => 0,
    ];

    /**
     * @return BelongsTo<IntegrationConnection, $this>
     */
    public function connection(): BelongsTo
    {
        return $this->belongsTo(IntegrationConnection::class, 'integration_connection_id');
    }

    /**
     * @return HasMany<IntegrationSyncEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(IntegrationSyncEvent::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => IntegrationSyncStatus::class,
            'last_attempt_at' => 'datetime',
        ];
    }
}
