<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\PortfolioVisibility;
use Database\Factories\StudentProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Institution-scoped student profile and privacy preferences.
 *
 * @property int $id
 * @property int $user_id
 * @property int $institution_id
 * @property string $public_identifier
 * @property string|null $bio
 * @property string|null $study_program
 * @property int|null $study_year
 * @property PortfolioVisibility $portfolio_visibility
 * @property bool $recruiter_discoverable
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'user_id', 'institution_id', 'public_identifier', 'created_at', 'updated_at'])]
class StudentProfile extends Model implements InstitutionOwned
{
    /** @use HasFactory<StudentProfileFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'portfolio_visibility' => PortfolioVisibility::Private->value,
        'recruiter_discoverable' => false,
    ];

    protected static function booted(): void
    {
        static::creating(function (StudentProfile $profile): void {
            $profile->public_identifier ??= (string) Str::ulid();
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return HasMany<ProfileSkill, $this>
     */
    public function skills(): HasMany
    {
        return $this->hasMany(ProfileSkill::class);
    }

    /**
     * @return HasMany<ProfileInterest, $this>
     */
    public function interests(): HasMany
    {
        return $this->hasMany(ProfileInterest::class);
    }

    /**
     * @return HasMany<AvailabilityWindow, $this>
     */
    public function availabilityWindows(): HasMany
    {
        return $this->hasMany(AvailabilityWindow::class);
    }

    /**
     * @return HasMany<PortfolioEntry, $this>
     */
    public function portfolioEntries(): HasMany
    {
        return $this->hasMany(PortfolioEntry::class, 'user_id', 'user_id')
            ->where('institution_id', $this->institution_id);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /**
     * Scope the query to one institution.
     *
     * @param  Builder<StudentProfile>  $query
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
            'portfolio_visibility' => PortfolioVisibility::class,
            'recruiter_discoverable' => 'boolean',
            'study_year' => 'integer',
        ];
    }
}
