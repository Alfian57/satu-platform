<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Institution-scoped collaboration project and its lifecycle metadata.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $owner_id
 * @property string $title
 * @property string|null $description
 * @property ProjectStatus $status
 * @property ProjectVisibility $visibility
 * @property int $capacity
 * @property Carbon $deadline
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'institution_id', 'owner_id', 'created_at', 'updated_at'])]
class Project extends Model implements InstitutionOwned
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => ProjectStatus::Open->value,
        'visibility' => ProjectVisibility::Institution->value,
        'capacity' => 5,
    ];

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<ProjectRole, $this>
     */
    public function roles(): HasMany
    {
        return $this->hasMany(ProjectRole::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function acceptsMembers(): bool
    {
        return $this->status->acceptsMembers() && $this->deadline->isFuture();
    }

    /**
     * Scope a query to one institution.
     *
     * @param  Builder<Project>  $query
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
            'status' => ProjectStatus::class,
            'visibility' => ProjectVisibility::class,
            'capacity' => 'integer',
            'deadline' => 'datetime',
        ];
    }
}
