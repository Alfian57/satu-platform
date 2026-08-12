<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\ProjectStatus;
use App\Enums\TeamMembershipEventType;
use App\Enums\TeamMembershipStatus;
use App\Exceptions\InvalidTeamTransition;
use App\Models\Institution;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class TeamMembershipTransition
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function lockProject(Project $project): Project
    {
        return Project::query()
            ->lockForUpdate()
            ->whereKey($project->getKey())
            ->firstOrFail();
    }

    public function lockMembership(Project $project, User $user): ?TeamMembership
    {
        return TeamMembership::query()
            ->lockForUpdate()
            ->where('project_id', $project->getKey())
            ->where('user_id', $user->getKey())
            ->first();
    }

    public function ensureProjectAcceptsMembers(Project $project): void
    {
        if (! $project->acceptsMembers()) {
            throw ValidationException::withMessages([
                'project' => 'Project tidak sedang menerima anggota baru.',
            ]);
        }
    }

    public function ensureVerifiedStudent(User $user, Project $project): void
    {
        if ($this->institutionContextResolver->resolve(
            $user,
            $project,
            [InstitutionMembershipRole::Student],
        ) === null) {
            throw new AuthorizationException('User tidak memiliki afiliasi kampus aktif pada project ini.');
        }
    }

    public function resolveRole(Project $project, ?int $roleId): ?ProjectRole
    {
        if ($roleId === null) {
            return null;
        }

        return ProjectRole::query()
            ->lockForUpdate()
            ->whereKey($roleId)
            ->where('project_id', $project->getKey())
            ->first()
            ?? throw ValidationException::withMessages([
                'project_role_id' => 'Role harus berasal dari project yang sama.',
            ]);
    }

    public function ensureAvailableCapacity(
        Project $project,
        ?ProjectRole $role,
        ?TeamMembership $existingMembership,
    ): void {
        if ($existingMembership?->status === TeamMembershipStatus::Active) {
            throw new InvalidTeamTransition(
                'User sudah menjadi anggota aktif pada project ini.',
            );
        }

        $activeCount = TeamMembership::query()
            ->where('project_id', $project->getKey())
            ->where('status', TeamMembershipStatus::Active)
            ->count();

        if ($activeCount >= $project->capacity) {
            throw ValidationException::withMessages([
                'capacity' => 'Kapasitas project sudah penuh.',
            ]);
        }

        if ($role === null) {
            return;
        }

        $roleCount = TeamMembership::query()
            ->where('project_id', $project->getKey())
            ->where('project_role_id', $role->getKey())
            ->where('status', TeamMembershipStatus::Active)
            ->count();

        if ($roleCount >= $role->capacity) {
            throw ValidationException::withMessages([
                'project_role_id' => 'Kapasitas role pada project sudah penuh.',
            ]);
        }
    }

    public function saveMembership(
        Project $project,
        User $member,
        ?ProjectRole $role,
        User $actor,
        TeamMembershipEventType $eventType,
        string $operation,
        ?string $reason = null,
        ?int $sourceId = null,
    ): TeamMembership {
        $membership = $this->lockMembership($project, $member);
        $before = $membership === null ? [] : $this->membershipSummary($membership);
        $now = now();

        if ($membership === null) {
            $membership = TeamMembership::query()->forceCreate([
                'project_id' => $project->getKey(),
                'user_id' => $member->getKey(),
                'project_role_id' => $role?->getKey(),
                'status' => TeamMembershipStatus::Active,
                'joined_at' => $now,
                'left_at' => null,
                'removed_at' => null,
                'removed_by_id' => null,
                'removal_reason' => null,
            ]);
        } else {
            $membership->forceFill([
                'project_role_id' => $role?->getKey(),
                'status' => TeamMembershipStatus::Active,
                'joined_at' => $now,
                'left_at' => null,
                'removed_at' => null,
                'removed_by_id' => null,
                'removal_reason' => null,
            ])->save();
        }

        TeamMembershipEvent::query()->forceCreate([
            'team_membership_id' => $membership->getKey(),
            'actor_id' => $actor->getKey(),
            'event' => $eventType,
            'reason' => $reason,
            'metadata' => $sourceId === null ? null : ['source_id' => $sourceId],
            'created_at' => $now,
        ]);

        $this->audit->record(
            operation: $operation,
            auditable: $membership,
            actor: $actor,
            institution: $this->institution($project),
            before: $before,
            after: $this->membershipSummary($membership),
            reason: $reason,
        );

        $this->synchronizeProjectStatus($project, $actor);

        return $membership->refresh();
    }

    public function leaveMembership(
        Project $project,
        TeamMembership $membership,
        User $actor,
        ?string $reason = null,
    ): TeamMembership {
        $before = $this->membershipSummary($membership);
        $membership->forceFill([
            'status' => TeamMembershipStatus::Left,
            'left_at' => now(),
            'removed_at' => null,
            'removed_by_id' => null,
            'removal_reason' => null,
        ])->save();

        TeamMembershipEvent::query()->forceCreate([
            'team_membership_id' => $membership->getKey(),
            'actor_id' => $actor->getKey(),
            'event' => TeamMembershipEventType::Left,
            'reason' => $reason,
            'metadata' => null,
            'created_at' => now(),
        ]);

        $this->audit->record(
            operation: 'team.membership.left',
            auditable: $membership,
            actor: $actor,
            institution: $this->institution($project),
            before: $before,
            after: $this->membershipSummary($membership),
            reason: $reason,
        );

        $this->synchronizeProjectStatus($project, $actor);

        return $membership->refresh();
    }

    public function removeMembership(
        Project $project,
        TeamMembership $membership,
        User $actor,
        string $reason,
    ): TeamMembership {
        $reason = $this->normalizeReason($reason, required: true);
        $before = $this->membershipSummary($membership);
        $membership->forceFill([
            'status' => TeamMembershipStatus::Removed,
            'removed_at' => now(),
            'removed_by_id' => $actor->getKey(),
            'removal_reason' => $reason,
            'left_at' => null,
        ])->save();

        TeamMembershipEvent::query()->forceCreate([
            'team_membership_id' => $membership->getKey(),
            'actor_id' => $actor->getKey(),
            'event' => TeamMembershipEventType::Removed,
            'reason' => $reason,
            'metadata' => null,
            'created_at' => now(),
        ]);

        $this->audit->record(
            operation: 'team.membership.removed',
            auditable: $membership,
            actor: $actor,
            institution: $this->institution($project),
            before: $before,
            after: $this->membershipSummary($membership),
            reason: $reason,
        );

        $this->synchronizeProjectStatus($project, $actor);

        return $membership->refresh();
    }

    public function normalizeReason(?string $reason, bool $required = false): ?string
    {
        $normalized = $reason === null ? null : (string) Str::of($reason)->squish();

        if ($required && ($normalized === null || $normalized === '')) {
            throw ValidationException::withMessages([
                'reason' => 'Alasan wajib diisi.',
            ]);
        }

        if ($normalized === '') {
            return null;
        }

        if ($normalized !== null && Str::length($normalized) > 1000) {
            throw ValidationException::withMessages([
                'reason' => 'Alasan tidak boleh lebih dari 1000 karakter.',
            ]);
        }

        return $normalized;
    }

    /**
     * @return array{membership_id: int, project_id: int, user_id: int, status: string, project_role_id: int|null}
     */
    public function membershipSummary(TeamMembership $membership): array
    {
        return [
            'membership_id' => $membership->getKey(),
            'project_id' => $membership->project_id,
            'user_id' => $membership->user_id,
            'status' => $membership->status->value,
            'project_role_id' => $membership->project_role_id,
        ];
    }

    private function synchronizeProjectStatus(Project $project, User $actor): void
    {
        if (! in_array($project->status, [ProjectStatus::Open, ProjectStatus::Forming, ProjectStatus::Full], true)) {
            return;
        }

        $activeCount = TeamMembership::query()
            ->where('project_id', $project->getKey())
            ->where('status', TeamMembershipStatus::Active)
            ->count();
        $targetStatus = match (true) {
            $activeCount === 0 => ProjectStatus::Open,
            $activeCount >= $project->capacity => ProjectStatus::Full,
            default => ProjectStatus::Forming,
        };

        if ($project->status === $targetStatus) {
            return;
        }

        $before = ['project_id' => $project->getKey(), 'status' => $project->status->value];
        $project->forceFill(['status' => $targetStatus])->save();

        $this->audit->record(
            operation: 'project.capacity_status.synchronized',
            auditable: $project,
            actor: $actor,
            institution: $this->institution($project),
            before: $before,
            after: ['project_id' => $project->getKey(), 'status' => $targetStatus->value],
            reason: 'Status project disinkronkan dengan jumlah membership aktif.',
        );
    }

    private function institution(Project $project): Institution
    {
        return Institution::query()->findOrFail($project->institution_id);
    }
}
