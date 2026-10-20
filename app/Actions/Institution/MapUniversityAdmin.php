<?php

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InvitationStatus;
use App\Exceptions\UniversityProvisioningConflict;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class MapUniversityAdmin
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity, private readonly AuditRecorder $audit) {}

    /** @return array{status: string, user_id: int, institution_id: int, receipt: string|null} */
    public function handle(int $userId, string $reason, bool $apply = false): array
    {
        $this->ensureDeployment($reason);
        $university = $this->resolveUniversity->handle();
        if (! $apply) {
            $user = User::query()->find($userId) ?? throw new UniversityProvisioningConflict('Akun tidak ditemukan.');
            $membership = $this->eligible($user, $university);

            return $this->result($user, $university, $membership !== null && ! $user->is_platform_admin ? 'already_mapped' : 'dry_run');
        }

        return DB::transaction(function () use ($userId, $reason, $university): array {
            $university = Institution::query()->whereKey($university->id)->lockForUpdate()->firstOrFail();
            $this->resolveUniversity->handle($university);
            $user = User::query()->whereKey($userId)->lockForUpdate()->firstOrFail();
            $user->institutionMemberships()->lockForUpdate()->get();
            PhoneNumber::query()->where('user_id', $userId)->lockForUpdate()->get();
            $membership = $this->eligible($user, $university);
            if ($membership !== null && ! $user->is_platform_admin) {
                return $this->result($user, $university, 'already_mapped');
            }
            $receipt = 'university-transitions/'.Str::uuid().'.enc';
            $payload = ['version' => 1, 'institution_id' => $university->id, 'user_id' => $user->id,
                'platform_flag' => (bool) $user->is_platform_admin, 'membership_id' => $membership?->id];
            if (! Storage::disk('private')->put($receipt, Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR)))) {
                throw new UniversityProvisioningConflict('Cadangan privat gagal ditulis. Tidak ada hak yang diubah.');
            }
            $membership ??= InstitutionMembership::query()->forceCreate([
                'institution_id' => $university->id, 'user_id' => $user->id, 'role' => InstitutionMembershipRole::CampusAdmin,
                'status' => InstitutionMembershipStatus::Verified, 'verified_at' => now(), 'reviewed_at' => now(),
            ]);
            $user->forceFill(['is_platform_admin' => false])->save();
            $this->audit->record('university.admin.mapped', $membership, null, $university,
                ['platform_flag' => $payload['platform_flag'], 'membership_id' => $payload['membership_id']],
                ['platform_flag' => false, 'membership_id' => $membership->id, 'receipt' => $receipt], $reason);

            return $this->result($user, $university, 'mapped', $receipt);
        }, attempts: 5);
    }

    /** @return array{status: string, user_id: int, institution_id: int, receipt: string|null} */
    public function rollback(string $receipt, string $reason, bool $apply = false): array
    {
        $this->ensureDeployment($reason);
        if (preg_match('/^university-transitions\/[a-f0-9-]{36}\.enc$/D', $receipt) !== 1) {
            throw new UniversityProvisioningConflict('Referensi cadangan tidak valid.');
        }
        $payload = json_decode(Crypt::decryptString(Storage::disk('private')->get($receipt)), true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($payload) || ($payload['version'] ?? null) !== 1 || ! is_int($payload['institution_id'] ?? null)
            || ! is_int($payload['user_id'] ?? null) || ! is_bool($payload['platform_flag'] ?? null)
            || ! array_key_exists('membership_id', $payload) || (! is_int($payload['membership_id']) && $payload['membership_id'] !== null)) {
            throw new UniversityProvisioningConflict('Isi cadangan tidak sesuai kontrak.');
        }
        $university = $this->resolveUniversity->handle();
        if ($university->id !== $payload['institution_id']) {
            throw new UniversityProvisioningConflict('Cadangan berasal dari universitas yang berbeda.');
        }

        return DB::transaction(function () use ($receipt, $reason, $apply, $payload, $university): array {
            $university = Institution::query()->whereKey($university->id)->lockForUpdate()->firstOrFail();
            $this->resolveUniversity->handle($university);
            $user = User::query()->whereKey($payload['user_id'])->lockForUpdate()->firstOrFail();
            if (AuditLog::query()->forInstitution($university)->where('operation', 'university.admin.mapping.rolled_back')
                ->where('after_summary->receipt', $receipt)->sharedLock()->first(['id']) !== null) {
                return $this->result($user, $university, 'already_rolled_back', $receipt);
            }
            $mapping = AuditLog::query()->forInstitution($university)->where('operation', 'university.admin.mapped')
                ->where('after_summary->receipt', $receipt)->sharedLock()->first();
            $membership = $mapping === null ? null : InstitutionMembership::query()->forInstitution($university)
                ->whereKey($mapping->auditable_id)->where('user_id', $user->id)->lockForUpdate()->first();
            $lastAuditId = $membership === null ? null : AuditLog::query()->where('auditable_type', $membership->getMorphClass())
                ->where('auditable_id', $membership->id)->latest('id')->sharedLock()->first(['id'])?->id;
            if ($membership === null || $membership->role !== InstitutionMembershipRole::CampusAdmin
                || $membership->status !== InstitutionMembershipStatus::Verified || $user->is_platform_admin
                || $lastAuditId !== $mapping->id) {
                throw new UniversityProvisioningConflict('Sumber pemetaan berubah atau belum diterapkan. Rollback tidak menimpa keputusan baru.');
            }
            if ($payload['membership_id'] === null) {
                ChangeUniversityAdminStatus::ensureAnotherAdmin($university, $membership);
            }
            if (! $apply) {
                return $this->result($user, $university, 'rollback_dry_run', $receipt);
            }
            if ($payload['membership_id'] === null) {
                $membership->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
                foreach (PrivilegedInvitation::query()->where('institution_id', $university->id)->where('issued_by', $user->id)
                    ->where('status', InvitationStatus::Issued)->lockForUpdate()->get() as $invitation) {
                    $invitation->forceFill(['status' => InvitationStatus::Revoked, 'revoked_at' => now(), 'revoke_reason' => 'Pemulihan pemetaan admin melalui deployment.'])->save();
                    $this->audit->record('institution.invitation.revoked', $invitation, null, $university,
                        ['status' => InvitationStatus::Issued->value], ['status' => InvitationStatus::Revoked->value], $reason);
                }
            }
            $user->forceFill(['is_platform_admin' => $payload['platform_flag']])->save();
            $this->audit->record('university.admin.mapping.rolled_back', $membership, null, $university,
                ['mapping_id' => $mapping->id], ['receipt' => $receipt, 'status' => $membership->status->value], $reason);

            return $this->result($user, $university, 'rolled_back', $receipt);
        }, attempts: 5);
    }

    private function eligible(User $user, Institution $university): ?InstitutionMembership
    {
        if (! is_string($user->getRawOriginal('username')) || $user->username === '' || ! is_string($user->getRawOriginal('password'))
            || $user->password === '' || ! PhoneNumber::query()->where('user_id', $user->id)->verified()->exists()) {
            throw new UniversityProvisioningConflict('Identitas masuk lengkap dan WhatsApp terverifikasi diperlukan.');
        }
        if ($user->institutionMemberships()->where('institution_id', '!=', $university->id)->exists()) {
            throw new UniversityProvisioningConflict('Akun institusi lain memerlukan peninjauan terpisah. Tidak memindahkan membership atau data.');
        }
        $membership = $user->institutionMemberships()->forInstitution($university)->where('role', InstitutionMembershipRole::CampusAdmin)->first();
        if ($membership !== null && ($membership->status !== InstitutionMembershipStatus::Verified || $membership->verified_at === null)) {
            throw new UniversityProvisioningConflict('Pemetaan tidak mengaktifkan ulang hak admin yang belum verified atau dicabut.');
        }
        if ($membership === null && (! $user->is_platform_admin || $user->institutionMemberships()->exists())) {
            throw new UniversityProvisioningConflict('Akun tidak mempunyai sumber admin lama yang sah. Gunakan undangan, bukan pemetaan mahasiswa.');
        }

        return $membership;
    }

    private function ensureDeployment(string $reason): void
    {
        if (! app()->runningInConsole()) {
            throw new AuthorizationException('Pemetaan hanya melalui operasi deployment terkontrol.');
        }
        if (mb_strlen(trim($reason)) < 3 || mb_strlen($reason) > 1000) {
            throw new UniversityProvisioningConflict('Alasan 3 sampai 1000 karakter diperlukan.');
        }
    }

    /** @return array{status: string, user_id: int, institution_id: int, receipt: string|null} */
    private function result(User $user, Institution $university, string $status, ?string $receipt = null): array
    {
        return ['status' => $status, 'user_id' => $user->id, 'institution_id' => $university->id, 'receipt' => $receipt];
    }
}
