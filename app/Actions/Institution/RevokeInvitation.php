<?php

namespace App\Actions\Institution;

use App\Enums\InvitationStatus;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;

final class RevokeInvitation
{
    public function handle(User $actor, PrivilegedInvitation $invitation, string $reason): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can revoke invitations.');
        }

        if ($invitation->status !== InvitationStatus::Issued) {
            return;
        }

        $invitation->update([
            'status' => InvitationStatus::Revoked,
            'revoked_at' => Carbon::now(),
            'revoked_by' => $actor->id,
            'revoke_reason' => $reason,
        ]);
    }
}
