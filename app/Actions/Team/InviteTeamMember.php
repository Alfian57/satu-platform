<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamInvitationStatus;
use App\Enums\TeamMembershipStatus;
use App\Exceptions\InvalidTeamTransition;
use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationReceivedNotification;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class InviteTeamMember
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        Project $project,
        User $invitee,
        ?int $projectRoleId = null,
        ?DateTimeInterface $expiresAt = null,
    ): TeamInvitation {
        Gate::forUser($actor)->authorize('invite', $project);

        if ($actor->is($invitee) || $project->owner_id === $invitee->getKey()) {
            throw new InvalidTeamTransition('Project owner tidak dapat diundang ke team-nya sendiri.');
        }

        $expiry = $expiresAt === null ? now()->addDays(7) : Carbon::instance($expiresAt);

        if (! $expiry->isFuture()) {
            throw ValidationException::withMessages([
                'expires_at' => 'Masa berlaku invitation harus berada di masa depan.',
            ]);
        }

        return DB::transaction(function () use (
            $actor,
            $project,
            $invitee,
            $projectRoleId,
            $expiry,
        ): TeamInvitation {
            $lockedProject = $this->transition->lockProject($project);
            Gate::forUser($actor)->authorize('invite', $lockedProject);
            $this->transition->ensureProjectAcceptsMembers($lockedProject);
            $this->transition->ensureVerifiedStudent($invitee, $lockedProject);

            $role = $this->transition->resolveRole($lockedProject, $projectRoleId);
            $membership = $this->transition->lockMembership($lockedProject, $invitee);

            if ($membership?->status === TeamMembershipStatus::Active) {
                throw new InvalidTeamTransition('User sudah menjadi anggota aktif pada project ini.');
            }

            $pending = TeamInvitation::query()
                ->lockForUpdate()
                ->where('project_id', $lockedProject->getKey())
                ->where('invitee_id', $invitee->getKey())
                ->where('status', TeamInvitationStatus::Pending)
                ->first();

            if ($pending !== null) {
                if ($pending->expires_at->isPast()) {
                    $before = $this->invitationSummary($pending);
                    $pending->forceFill([
                        'status' => TeamInvitationStatus::Expired,
                        'pending_key' => null,
                        'responded_at' => now(),
                    ])->save();
                    $this->audit->record(
                        operation: 'team.invitation.expired',
                        auditable: $pending,
                        actor: $actor,
                        institution: $lockedProject->institution,
                        before: $before,
                        after: $this->invitationSummary($pending),
                        reason: 'Invitation melewati masa berlaku sebelum diterbitkan ulang.',
                    );
                } else {
                    throw ValidationException::withMessages([
                        'invitee_id' => 'Masih ada invitation yang pending untuk user ini.',
                    ]);
                }
            }

            $invitation = TeamInvitation::query()->forceCreate([
                'project_id' => $lockedProject->getKey(),
                'project_role_id' => $role?->getKey(),
                'inviter_id' => $actor->getKey(),
                'invitee_id' => $invitee->getKey(),
                'status' => TeamInvitationStatus::Pending,
                'pending_key' => 'pending',
                'expires_at' => $expiry,
                'responded_at' => null,
                'response_reason' => null,
            ]);

            $this->audit->record(
                operation: 'team.invitation.created',
                auditable: $invitation,
                actor: $actor,
                institution: $lockedProject->institution,
                after: $this->invitationSummary($invitation),
            );

            $invitee->notify(new TeamInvitationReceivedNotification($invitation));

            return $invitation->refresh();
        }, attempts: 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function invitationSummary(TeamInvitation $invitation): array
    {
        return [
            'invitation_id' => $invitation->getKey(),
            'project_id' => $invitation->project_id,
            'invitee_id' => $invitation->invitee_id,
            'status' => $invitation->status->value,
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ];
    }
}
