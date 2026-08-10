<?php

namespace App\Actions\Institution;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InvitationStatus;
use App\Models\InstitutionMembership;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

final class AcceptInvitation
{
    public function handle(User $user, string $plainToken): void
    {
        $invitations = PrivilegedInvitation::query()
            ->issued()
            ->notExpired()
            ->get();

        $matchedInvitation = null;

        foreach ($invitations as $invitation) {
            if (Hash::check($plainToken, $invitation->token_hash)) {
                $matchedInvitation = $invitation;
                break;
            }
        }

        if ($matchedInvitation === null) {
            throw new RuntimeException('Invalid or expired invitation.');
        }

        DB::transaction(function () use ($matchedInvitation, $user) {
            $matchedInvitation->update([
                'status' => InvitationStatus::Accepted,
                'accepted_at' => Carbon::now(),
                'accepted_by' => $user->id,
            ]);

            InstitutionMembership::query()->create([
                'institution_id' => $matchedInvitation->institution_id,
                'user_id' => $user->id,
                'role' => InstitutionMembershipRole::CampusAdmin,
                'status' => InstitutionMembershipStatus::Verified,
            ]);
        });
    }
}
