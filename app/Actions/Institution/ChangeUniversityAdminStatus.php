<?php

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
use App\Support\Auth\UniversityAdminRevision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ChangeUniversityAdminStatus
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity, private readonly AuditRecorder $audit) {}

    public function handle(User $actor, InstitutionMembership $membership, InstitutionMembershipStatus $status, string $revision, string $reason): InstitutionMembership
    {
        $university = $this->resolveUniversity->handle($membership);
        $reason = trim($reason);
        if (! in_array($status, [InstitutionMembershipStatus::Verified, InstitutionMembershipStatus::Suspended], true)
            || mb_strlen($reason) < 3 || mb_strlen($reason) > 1000) {
            throw ValidationException::withMessages(['reason' => 'Pilih status yang valid dan alasan 3 sampai 1000 karakter.']);
        }

        return DB::transaction(function () use ($university, $actor, $membership, $status, $revision, $reason): InstitutionMembership {
            $university = Institution::query()->whereKey($university->id)->lockForUpdate()->firstOrFail();
            $this->resolveUniversity->handle($university);
            $locked = InstitutionMembership::query()->forInstitution($university)->whereKey($membership->id)->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize('manageAdmin', $locked);
            if (! hash_equals(UniversityAdminRevision::make($locked), $revision)) {
                throw new ConflictHttpException('Akses admin berubah. Muat ulang sebelum menyimpan keputusan.');
            }
            if ($locked->status === $status) {
                return $locked;
            }
            if ($locked->verified_at === null || ! in_array($locked->status, [InstitutionMembershipStatus::Verified, InstitutionMembershipStatus::Suspended], true)) {
                throw ValidationException::withMessages(['status' => 'Admin belum mempunyai riwayat verifikasi. Gunakan undangan berotorisasi.']);
            }
            if ($status === InstitutionMembershipStatus::Suspended) {
                self::ensureAnotherAdmin($university, $locked);
            } elseif (! PhoneNumber::query()->where('user_id', $locked->user_id)->verified()->exists()) {
                throw ValidationException::withMessages(['status' => 'Admin harus mempunyai WhatsApp terverifikasi sebelum diaktifkan kembali.']);
            }
            $before = ['status' => $locked->status->value];
            $locked->forceFill(['status' => $status])->save();
            $this->audit->record('university.admin.status.changed', $locked, $actor, $university, $before, ['status' => $status->value], $reason);
            if ($status === InstitutionMembershipStatus::Suspended) {
                $this->revokePendingInvitations($actor, $university, $locked->user_id, $reason);
            }

            return $locked->refresh();
        }, attempts: 5);
    }

    public static function ensureAnotherAdmin(Institution $university, InstitutionMembership $membership): void
    {
        if (InstitutionMembership::query()->forInstitution($university)->where('role', InstitutionMembershipRole::CampusAdmin)
            ->where('status', InstitutionMembershipStatus::Verified)->whereNotNull('verified_at')->whereKeyNot($membership->id)
            ->lockForUpdate()->first(['id']) === null) {
            throw ValidationException::withMessages(['status' => 'Admin aktif terakhir tidak dapat dinonaktifkan. Aktifkan admin lain terlebih dahulu.']);
        }
    }

    private function revokePendingInvitations(User $actor, Institution $university, int $userId, string $reason): void
    {
        foreach (PrivilegedInvitation::query()->where('institution_id', $university->id)->where('issued_by', $userId)
            ->where('status', InvitationStatus::Issued)->lockForUpdate()->get() as $invitation) {
            $invitation->forceFill(['status' => InvitationStatus::Revoked, 'revoked_at' => now(), 'revoked_by' => $actor->id, 'revoke_reason' => 'Akses pengundang dinonaktifkan.'])->save();
            $this->audit->record('institution.invitation.revoked', $invitation, $actor, $university,
                ['status' => InvitationStatus::Issued->value], ['status' => InvitationStatus::Revoked->value], $reason);
        }
    }
}
