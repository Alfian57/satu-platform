<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use Database\Factories\IntegrationConnectionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Connection settings for an academic provider.
 *
 * @property int $id
 * @property int $institution_id
 * @property string $provider_key
 * @property IntegrationProviderMode $mode
 * @property array<string, mixed>|null $encrypted_config
 * @property IntegrationConnectionStatus $status
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class IntegrationConnection extends Model implements InstitutionOwned
{
    /** @use HasFactory<IntegrationConnectionFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'mode' => IntegrationProviderMode::Sandbox->value,
        'status' => IntegrationConnectionStatus::Disconnected->value,
    ];

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

    /**
     * @return HasMany<IntegrationSync, $this>
     */
    public function syncs(): HasMany
    {
        return $this->hasMany(IntegrationSync::class);
    }

    /**
     * Scope the query to a single explicit institution.
     *
     * @param  Builder<IntegrationConnection>  $query
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
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mode' => IntegrationProviderMode::class,
            'status' => IntegrationConnectionStatus::class,
            'encrypted_config' => 'encrypted:array',
        ];
    }
}
