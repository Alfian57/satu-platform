<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $password
 * @property bool $is_platform_admin
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'username', 'password', 'is_platform_admin'])]
#[Hidden(['password', 'username', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Normalize username to lowercase and trim on assignment.
     */
    protected function setUsernameAttribute(?string $value): void
    {
        $this->attributes['username'] = $value !== null
            ? trim(Str::lower($value))
            : null;
    }

    /**
     * @return HasMany<InstitutionMembership, $this>
     */
    public function institutionMemberships(): HasMany
    {
        return $this->hasMany(InstitutionMembership::class);
    }

    /**
     * @return HasOne<PhoneNumber, $this>
     */
    public function phoneNumber(): HasOne
    {
        return $this->hasOne(PhoneNumber::class);
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
    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    /**
     * @return HasMany<TeamMembership, $this>
     */
    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMembership::class);
    }

    /**
     * @return HasMany<TeamInvitation, $this>
     */
    public function receivedTeamInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class, 'invitee_id');
    }

    /**
     * @return HasMany<TeamInvitation, $this>
     */
    public function sentTeamInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class, 'inviter_id');
    }

    /**
     * @return HasMany<TeamJoinRequest, $this>
     */
    public function teamJoinRequests(): HasMany
    {
        return $this->hasMany(TeamJoinRequest::class, 'requester_id');
    }

    /**
     * @return HasMany<Task, $this>
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by_id');
    }

    /**
     * @return HasMany<TaskAssignment, $this>
     */
    public function taskAssignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * @return HasMany<AuditLog, $this>
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    /**
     * @return HasMany<ConsentRecord, $this>
     */
    public function consentRecords(): HasMany
    {
        return $this->hasMany(ConsentRecord::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
        ];
    }
}
