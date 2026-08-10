<?php

namespace App\Actions\Institution;

use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class IssueInvitation
{
    private const EXPIRY_DAYS = 7;

    public function handle(User $actor, Institution $institution, string $phone, string $intendedRole): PrivilegedInvitation
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can issue invitations.');
        }

        return DB::transaction(function () use ($actor, $institution, $phone, $intendedRole) {
            $this->revokeExisting($institution, $phone, $intendedRole);

            $plainToken = Str::random(64);

            return PrivilegedInvitation::query()->create([
                'institution_id' => $institution->id,
                'intended_role' => $intendedRole,
                'phone' => $phone,
                'token_hash' => Hash::make($plainToken),
                'status' => InvitationStatus::Issued,
                'expires_at' => Carbon::now()->addDays(self::EXPIRY_DAYS),
                'issued_by' => $actor->id,
                'audit_reference' => 'invitation_'.Str::ulid(),
            ]);
        });
    }

    private function revokeExisting(Institution $institution, string $phone, string $intendedRole): void
    {
        PrivilegedInvitation::query()
            ->where('institution_id', $institution->id)
            ->where('phone', $phone)
            ->where('intended_role', $intendedRole)
            ->issued()
            ->update([
                'status' => InvitationStatus::Revoked,
                'revoked_at' => Carbon::now(),
                'revoke_reason' => 'Superseded by new invitation',
            ]);
    }
}
