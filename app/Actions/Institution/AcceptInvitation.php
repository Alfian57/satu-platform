<?php

declare(strict_types=1);

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

final class AcceptInvitation
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ResolveConfiguredUniversity $resolveUniversity,
    ) {}

    public function handle(User $user, string $plainToken): void
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            throw new AuthorizationException('Identitas akun tidak valid.');
        }
        $university = $this->resolveUniversity->handle();
        $invitationId = null;
        $invitations = PrivilegedInvitation::query()
            ->where('institution_id', $university->id)
            ->issued()
            ->notExpired()
            ->get(['id', 'token_hash']);

        foreach ($invitations as $invitation) {
            if (Hash::check($plainToken, $invitation->token_hash)) {
                $invitationId = $invitation->getKey();
                break;
            }
        }

        if ($invitationId === null) {
            throw new RuntimeException('Invalid or expired invitation.');
        }

        DB::transaction(function () use ($invitationId, $user, $university): void {
            $institution = Institution::query()->whereKey($university->id)->lockForUpdate()->firstOrFail();
            $this->resolveUniversity->handle($institution);
            $invitation = PrivilegedInvitation::query()
                ->lockForUpdate()
                ->with('institution')
                ->whereKey($invitationId)
                ->first();

            if (
                $invitation === null
                || ! $invitation->isIssued()
                || $invitation->isExpired()
                || $invitation->institution_id !== $institution->id
            ) {
                throw new RuntimeException('Invalid or expired invitation.');
            }

            if ($invitation->intended_role !== InstitutionMembershipRole::CampusAdmin->value) {
                throw new RuntimeException('Invitation role is not supported.');
            }

            $issuer = User::query()->find($invitation->issued_by);
            if ($issuer === null || ! $issuer->isUniversityAdmin($institution)) {
                throw new AuthorizationException('Pengundang tidak lagi memiliki akses admin. Minta undangan baru.');
            }
            $user = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($user->institutionMemberships()->where('institution_id', '!=', $institution->id)->exists()) {
                throw new AuthorizationException('Akun institusi lain memerlukan pemetaan berotorisasi terlebih dahulu.');
            }

            $phoneNumber = PhoneNumber::query()
                ->verified()
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (
                $phoneNumber === null
                || ! hash_equals(
                    $phoneNumber->number_hash,
                    PhoneIdentity::hash($invitation->phone),
                )
            ) {
                throw new AuthorizationException(
                    'Nomor WhatsApp terverifikasi tidak sesuai dengan undangan ini.',
                );
            }

            $membership = InstitutionMembership::query()
                ->where('institution_id', $institution->getKey())
                ->where('user_id', $user->getKey())
                ->where('role', InstitutionMembershipRole::CampusAdmin->value)
                ->lockForUpdate()
                ->first();

            if ($membership?->status === InstitutionMembershipStatus::Verified) {
                throw new RuntimeException('Akun sudah mempunyai akses Admin Universitas.');
            }

            if ($membership?->status === InstitutionMembershipStatus::Suspended) {
                throw new AuthorizationException('Akses Admin Universitas sedang ditangguhkan.');
            }

            $membership ??= new InstitutionMembership;
            $membership->forceFill([
                'institution_id' => $institution->getKey(),
                'user_id' => $user->getKey(),
                'role' => InstitutionMembershipRole::CampusAdmin,
                'status' => InstitutionMembershipStatus::Verified,
                'verified_at' => Carbon::now(),
                'reviewed_at' => Carbon::now(),
            ])->save();

            $before = $this->summary($invitation);
            $invitation->update([
                'status' => InvitationStatus::Accepted,
                'accepted_at' => Carbon::now(),
                'accepted_by' => $user->getKey(),
            ]);

            $this->audit->record(
                operation: 'institution.invitation.accepted',
                auditable: $invitation,
                actor: $user,
                institution: $institution,
                before: $before,
                after: $this->summary($invitation),
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
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ];
    }
}
