<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamInvitationStatus;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationRespondedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class RejectTeamInvitation
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        TeamInvitation $invitation,
        ?string $reason = null,
    ): TeamInvitation {
        Gate::forUser($actor)->authorize('reject', $invitation);
        $reason = $this->transition->normalizeReason($reason);
        $expired = false;

        $result = DB::transaction(function () use ($actor, $invitation, $reason, &$expired): TeamInvitation {
            $project = $this->transition->lockProject($invitation->project);
            $lockedInvitation = TeamInvitation::query()
                ->lockForUpdate()
                ->whereKey($invitation->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('reject', $lockedInvitation);

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

            $before = $this->summary($lockedInvitation);
            $lockedInvitation->forceFill([
                'status' => TeamInvitationStatus::Rejected,
                'pending_key' => null,
                'responded_at' => now(),
                'response_reason' => $reason,
            ])->save();

            $this->audit->record(
                operation: 'team.invitation.rejected',
                auditable: $lockedInvitation,
                actor: $actor,
                institution: $project->institution,
                before: $before,
                after: $this->summary($lockedInvitation),
                reason: $reason,
            );

            $lockedInvitation->load('inviter');
            $lockedInvitation->inviter->notify(
                new TeamInvitationRespondedNotification($lockedInvitation, $actor, 'rejected'),
            );

            return $lockedInvitation->refresh();
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
