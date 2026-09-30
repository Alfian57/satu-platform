<?php

declare(strict_types=1);

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionStatus;
use App\Enums\InvitationStatus;
use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Jobs\SendWhatsAppMessage;
use App\Models\Institution;
use App\Models\MessageOutbox;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class IssueInvitation
{
    private const EXPIRY_DAYS = 7;

    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        Institution $institution,
        string $phone,
        string $intendedRole,
    ): PrivilegedInvitation {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can issue invitations.');
        }

        if ($institution->status !== InstitutionStatus::Active) {
            throw ValidationException::withMessages([
                'institution' => 'Undangan hanya dapat diterbitkan untuk kampus yang aktif.',
            ]);
        }

        if ($intendedRole !== InstitutionMembershipRole::CampusAdmin->value) {
            throw ValidationException::withMessages([
                'intended_role' => 'Peran undangan tidak didukung.',
            ]);
        }

        try {
            $phone = PhoneIdentity::normalize($phone);
        } catch (\InvalidArgumentException) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor WhatsApp harus valid dan menggunakan format internasional.',
            ]);
        }

        return DB::transaction(function () use ($actor, $institution, $phone, $intendedRole): PrivilegedInvitation {
            $this->revokeExisting($actor, $institution, $phone, $intendedRole);

            $plainToken = Str::random(64);
            $expiresAt = Carbon::now()->addDays(self::EXPIRY_DAYS);

            $invitation = PrivilegedInvitation::query()->create([
                'institution_id' => $institution->id,
                'intended_role' => $intendedRole,
                'phone' => $phone,
                'token_hash' => Hash::make($plainToken),
                'status' => InvitationStatus::Issued,
                'expires_at' => $expiresAt,
                'delivery_status' => 'queued',
                'issued_by' => $actor->id,
                'audit_reference' => 'invitation_'.Str::ulid(),
            ]);

            $message = sprintf(
                'Undangan Admin Kampus SATU untuk %s. Buka %s sebelum %s.',
                $institution->name,
                route('invitation.show', ['token' => $plainToken]),
                $expiresAt->timezone($institution->timezone)->translatedFormat('d F Y H:i'),
            );

            $outbox = MessageOutbox::query()->create([
                'purpose' => MessagePurpose::Invitation,
                'recipient' => $phone,
                'template_name' => 'campus_admin_invitation',
                'template_version' => 'v1',
                'payload' => Crypt::encryptString(json_encode([
                    'message' => $message,
                ], JSON_THROW_ON_ERROR)),
                'status' => MessageStatus::Pending,
                'metadata' => [
                    'privileged_invitation_id' => $invitation->getKey(),
                ],
            ]);

            SendWhatsAppMessage::dispatch($outbox->getKey())->afterCommit();

            $this->audit->record(
                operation: 'institution.invitation.issued',
                auditable: $invitation,
                actor: $actor,
                institution: $institution,
                after: $this->summary($invitation),
            );

            return $invitation->refresh();
        }, attempts: 5);
    }

    private function revokeExisting(
        User $actor,
        Institution $institution,
        string $phone,
        string $intendedRole,
    ): void {
        $existingInvitations = PrivilegedInvitation::query()
            ->where('institution_id', $institution->id)
            ->where('phone', $phone)
            ->where('intended_role', $intendedRole)
            ->issued()
            ->lockForUpdate()
            ->get();

        foreach ($existingInvitations as $existingInvitation) {
            $before = $this->summary($existingInvitation);
            $existingInvitation->update([
                'status' => InvitationStatus::Revoked,
                'revoked_at' => Carbon::now(),
                'revoked_by' => $actor->id,
                'revoke_reason' => 'Superseded by new invitation',
            ]);

            $this->audit->record(
                operation: 'institution.invitation.revoked',
                auditable: $existingInvitation,
                actor: $actor,
                institution: $institution,
                before: $before,
                after: $this->summary($existingInvitation),
                reason: 'Superseded by new invitation.',
            );
        }
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
            'delivery_status' => $invitation->delivery_status,
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ];
    }
}
