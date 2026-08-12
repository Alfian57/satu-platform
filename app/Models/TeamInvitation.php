<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\TeamInvitationStatus;
use Database\Factories\TeamInvitationFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Authenticated invitation for a user to join a project team.
 *
 * @property int $id
 * @property int $project_id
 * @property int|null $project_role_id
 * @property int $inviter_id
 * @property int $invitee_id
 * @property TeamInvitationStatus $status
 * @property string|null $pending_key
 * @property Carbon $expires_at
 * @property Carbon|null $responded_at
 * @property string|null $response_reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'inviter_id', 'invitee_id', 'created_at', 'updated_at'])]
class TeamInvitation extends Model implements InstitutionOwned
{
    /** @use HasFactory<TeamInvitationFactory> */
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
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function invitee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invitee_id');
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    /**
     * @param  Builder<TeamInvitation>  $query
     */
    #[Scope]
    protected function pending(Builder $query): void
    {
        $query->where('status', TeamInvitationStatus::Pending);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TeamInvitationStatus::class,
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }
}
