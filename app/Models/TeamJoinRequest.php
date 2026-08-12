<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\TeamJoinRequestStatus;
use Database\Factories\TeamJoinRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A student's request to join a project team.
 *
 * @property int $id
 * @property int $project_id
 * @property int|null $project_role_id
 * @property int $requester_id
 * @property TeamJoinRequestStatus $status
 * @property string|null $pending_key
 * @property string|null $message
 * @property Carbon $requested_at
 * @property Carbon|null $responded_at
 * @property string|null $response_reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'requester_id', 'created_at', 'updated_at'])]
class TeamJoinRequest extends Model implements InstitutionOwned
{
    /** @use HasFactory<TeamJoinRequestFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
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
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    /**
     * @param  Builder<TeamJoinRequest>  $query
     */
    #[Scope]
    protected function pending(Builder $query): void
    {
        $query->where('status', TeamJoinRequestStatus::Pending);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TeamJoinRequestStatus::class,
            'requested_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }
}
