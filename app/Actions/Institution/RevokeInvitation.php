<?php

declare(strict_types=1);

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InvitationStatus;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class RevokeInvitation
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, PrivilegedInvitation $invitation, string $reason): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can revoke invitations.');
        }

        DB::transaction(function () use ($actor, $invitation, $reason): void {
            $lockedInvitation = PrivilegedInvitation::query()
                ->lockForUpdate()
                ->with('institution')
                ->whereKey($invitation->getKey())
                ->first();

            if ($lockedInvitation === null || $lockedInvitation->status !== InvitationStatus::Issued) {
                return;
            }

            $before = $this->summary($lockedInvitation);
            $lockedInvitation->update([
                'status' => InvitationStatus::Revoked,
                'revoked_at' => Carbon::now(),
                'revoked_by' => $actor->id,
                'revoke_reason' => $reason,
            ]);

            $this->audit->record(
                operation: 'institution.invitation.revoked',
                auditable: $lockedInvitation,
                actor: $actor,
                institution: $lockedInvitation->institution,
                before: $before,
                after: $this->summary($lockedInvitation),
                reason: $reason,
            );
        }, attempts: 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(PrivilegedInvitation $invitation): array
    {
        return [
            'invitation_id' => $invitation->getKey(),
            'institution_id' => $invitation->institution_id,
            'intended_role' => $invitation->intended_role,
            'status' => $invitation->status->value,
        ];
    }
}
