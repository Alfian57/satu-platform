<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\IntegrationSyncMetricFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Aggregated, institution-scoped metrics for academic sync health.
 *
 * @property int $id
 * @property int $integration_connection_id
 * @property int $institution_id
 * @property int $total_syncs
 * @property int $succeeded_count
 * @property int $reconciled_count
 * @property int $dead_letter_count
 * @property int $total_retries
 * @property int $queue_age_seconds
 * @property Carbon|null $last_sync_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class IntegrationSyncMetric extends Model implements InstitutionOwned
{
    /** @use HasFactory<IntegrationSyncMetricFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'total_syncs' => 0,
        'succeeded_count' => 0,
        'reconciled_count' => 0,
        'dead_letter_count' => 0,
        'total_retries' => 0,
        'queue_age_seconds' => 0,
    ];

    /**
     * @return BelongsTo<IntegrationConnection, $this>
     */
    public function connection(): BelongsTo
    {
        return $this->belongsTo(IntegrationConnection::class, 'integration_connection_id');
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }
}
