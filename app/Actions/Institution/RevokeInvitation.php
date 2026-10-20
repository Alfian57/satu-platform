<?php

declare(strict_types=1);

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class RevokeInvitation
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, PrivilegedInvitation $invitation, string $reason): void
    {
        Gate::forUser($actor)->authorize('revoke', $invitation);

        DB::transaction(function () use ($actor, $invitation, $reason): void {
            $institution = Institution::query()->whereKey($invitation->institution_id)->lockForUpdate()->firstOrFail();
            if (! $actor->isUniversityAdmin($institution)) {
                throw new AuthorizationException('Akses admin atau universitas telah berubah.');
            }
            $lockedInvitation = PrivilegedInvitation::query()
                ->lockForUpdate()
                ->with('institution')
                ->whereKey($invitation->getKey())
                ->where('institution_id', $institution->id)
                ->first();

            if ($lockedInvitation === null) {
                throw new AuthorizationException('Undangan tidak lagi tersedia.');
            }
            Gate::forUser($actor)->authorize('revoke', $lockedInvitation);
            if ($lockedInvitation->status === InvitationStatus::Revoked) {
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
