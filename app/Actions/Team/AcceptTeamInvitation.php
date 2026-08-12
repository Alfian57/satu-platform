<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamInvitationStatus;
use App\Enums\TeamMembershipEventType;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationRespondedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class AcceptTeamInvitation
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, TeamInvitation $invitation): TeamInvitation
    {
        Gate::forUser($actor)->authorize('accept', $invitation);
        $expired = false;

        $result = DB::transaction(function () use ($actor, $invitation, &$expired): TeamInvitation {
            $project = $this->transition->lockProject($invitation->project);
            $lockedInvitation = TeamInvitation::query()
                ->lockForUpdate()
                ->whereKey($invitation->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('accept', $lockedInvitation);

            if ($lockedInvitation->expires_at->isPast()) {
                $before = $this->summary($lockedInvitation);
                $lockedInvitation->forceFill([
                    'status' => TeamInvitationStatus::Expired,
                    'pending_key' => null,
                    'responded_at' => now(),
                ])->save();
                $this->audit->record(
                    operation: 'team.invitation.expired',
                    auditable: $lockedInvitation,
                    actor: $actor,
                    institution: $project->institution,
                    before: $before,
                    after: $this->summary($lockedInvitation),
                    reason: 'Invitation sudah melewati masa berlaku.',
                );
                $expired = true;

                return $lockedInvitation->refresh();
            }

            $this->transition->ensureProjectAcceptsMembers($project);
            $this->transition->ensureVerifiedStudent($actor, $project);
            $role = $this->transition->resolveRole($project, $lockedInvitation->project_role_id);
            $existingMembership = $this->transition->lockMembership($project, $actor);
            $this->transition->ensureAvailableCapacity($project, $role, $existingMembership);

            $membership = $this->transition->saveMembership(
                project: $project,
                member: $actor,
                role: $role,
                actor: $actor,
                eventType: $existingMembership === null
                    ? TeamMembershipEventType::Joined
                    : TeamMembershipEventType::Rejoined,
                operation: $existingMembership === null
                    ? 'team.membership.joined'
                    : 'team.membership.rejoined',
                sourceId: $lockedInvitation->getKey(),
            );

            $before = $this->summary($lockedInvitation);
            $lockedInvitation->forceFill([
                'status' => TeamInvitationStatus::Accepted,
                'pending_key' => null,
                'responded_at' => now(),
                'response_reason' => null,
            ])->save();

            $this->audit->record(
                operation: 'team.invitation.accepted',
                auditable: $lockedInvitation,
                actor: $actor,
                institution: $project->institution,
                before: $before,
                after: $this->summary($lockedInvitation),
            );

            $lockedInvitation->load('inviter');
            $lockedInvitation->inviter->notify(
                new TeamInvitationRespondedNotification($lockedInvitation, $actor, 'accepted'),
            );

            return $lockedInvitation->refresh()->loadMissing('project');
        }, attempts: 5);

        if ($expired) {
            throw ValidationException::withMessages([
                'invitation' => 'Invitation sudah kedaluwarsa.',
            ]);
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(TeamInvitation $invitation): array
    {
        return [
            'invitation_id' => $invitation->getKey(),
            'project_id' => $invitation->project_id,
            'invitee_id' => $invitation->invitee_id,
            'status' => $invitation->status->value,
        ];
    }
}
