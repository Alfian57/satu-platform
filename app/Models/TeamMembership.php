<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\TeamMembershipStatus;
use Database\Factories\TeamMembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Current membership state for a project team participant.
 *
 * @property int $id
 * @property int $project_id
 * @property int $user_id
 * @property int|null $project_role_id
 * @property TeamMembershipStatus $status
 * @property Carbon|null $joined_at
 * @property Carbon|null $left_at
 * @property Carbon|null $removed_at
 * @property int|null $removed_by_id
 * @property string|null $removal_reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'user_id', 'created_at', 'updated_at'])]
class TeamMembership extends Model implements InstitutionOwned
{
    /** @use HasFactory<TeamMembershipFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<ProjectRole, $this>
     */
    public function projectRole(): BelongsTo
    {
        return $this->belongsTo(ProjectRole::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function removedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'removed_by_id');
    }

    /**
     * @return HasMany<TeamMembershipEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(TeamMembershipEvent::class);
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    /**
     * @param  Builder<TeamMembership>  $query
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('status', TeamMembershipStatus::Active);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TeamMembershipStatus::class,
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }
}
