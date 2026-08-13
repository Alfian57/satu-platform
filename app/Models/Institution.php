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
     * @return HasMany<AffiliationRequest, $this>
     */
    public function affiliationRequests(): HasMany
    {
        return $this->hasMany(AffiliationRequest::class);
    }

    /**
     * @return HasMany<StudentProfile, $this>
     */
    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    /**
     * @return HasMany<Project, $this>
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * @return HasMany<Contribution, $this>
     */
    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }

    /**
     * @return HasMany<BadgeAward, $this>
     */
    public function badgeAwards(): HasMany
    {
        return $this->hasMany(BadgeAward::class);
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
