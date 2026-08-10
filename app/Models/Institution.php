<?php

namespace App\Models;

use App\Enums\InstitutionStatus;
use Database\Factories\InstitutionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property InstitutionStatus $status
 * @property string $timezone
 * @property string $locale
 * @property array<string, mixed>|null $settings
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'status', 'timezone', 'locale', 'settings'])]
class Institution extends Model
{
    /** @use HasFactory<InstitutionFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => InstitutionStatus::Pending->value,
        'timezone' => 'Asia/Jakarta',
        'locale' => 'id',
    ];

    /**
     * @return HasMany<InstitutionDomain, $this>
     */
    public function domains(): HasMany
    {
        return $this->hasMany(InstitutionDomain::class);
    }

    /**
     * @return HasMany<InstitutionMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(InstitutionMembership::class);
    }

    /**
     * @return HasMany<InstitutionRoster, $this>
     */
    public function rosters(): HasMany
    {
        return $this->hasMany(InstitutionRoster::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InstitutionStatus::class,
            'settings' => 'array',
        ];
    }
}
