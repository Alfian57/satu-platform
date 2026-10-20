<?php

namespace App\Actions\User;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Actions\Institution\ChangeUniversityAdminStatus;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\ConsentRecord;
use App\Models\Institution;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\Auth\UniversityAdminRevision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DeleteUserAccount
{
    public function __construct(
        private readonly ConsentRecorder $consentRecorder,
        private readonly AuditRecorder $auditRecorder,
        private readonly ChangeUniversityAdminStatus $changeAdminStatus,
        private readonly ResolveConfiguredUniversity $resolveUniversity,
    ) {}

    /**
     * Anonymize subject-facing user account while preserving append-only audit records.
     */
    public function handle(User $user): void
    {
        try {
            $university = $this->resolveUniversity->handle();
        } catch (InvalidUniversityConfiguration) {
            $university = null;
            if ($user->institutionMemberships()->where('role', InstitutionMembershipRole::CampusAdmin)
                ->where('status', InstitutionMembershipStatus::Verified)->exists()) {
                throw ValidationException::withMessages(['status' => 'Konteks universitas belum aktif. Pulihkan konfigurasi sebelum mencabut atau menghapus akun admin.']);
            }
        }
        DB::transaction(function () use ($user, $university): void {
            if ($university !== null) {
                $lockedUniversity = Institution::query()->whereKey($university->id)->lockForUpdate()->firstOrFail();
                $this->resolveUniversity->handle($lockedUniversity);
            }
            $user = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $admin = $user->universityAdminMembership();
            if ($admin !== null) {
                $this->changeAdminStatus->handle($user, $admin, InstitutionMembershipStatus::Suspended,
                    UniversityAdminRevision::make($admin), 'Pencabutan akses admin sebelum penghapusan akun mandiri.');
            }
            $userId = $user->getKey();

            // 1. Withdraw all active consents
            $activeConsents = ConsentRecord::query()
                ->where('user_id', $userId)
                ->whereNotNull('granted_at')
                ->whereNull('withdrawn_at')
                ->get();

            foreach ($activeConsents as $consent) {
                try {
                    $this->consentRecorder->withdraw(
                        $user,
                        $consent->purpose,
                        $consent->policy_version,
                        'account_deletion',
                    );
                } catch (\Throwable) {
                    // Ignore if already withdrawn or invalid state
                }
            }

            // 2. Remove phone numbers so the phone can be registered again
            PhoneNumber::query()->where('user_id', $userId)->delete();

            // 3. Delete student profile if exists
            if ($user->studentProfile) {
                $user->studentProfile->delete();
            }

            // 4. Anonymize user identity
            $user->forceFill([
                'name' => 'Pengguna Dihapus',
                'username' => 'deleted_'.Str::lower(Str::random(12)),
                'password' => bcrypt(Str::random(32)),
            ])->save();

            // 5. Record audit trail
            $this->auditRecorder->record(
                operation: 'user.account_deleted',
                auditable: $user,
                actor: $user,
                institution: null,
                before: [
                    'user_id' => $userId,
                ],
                after: [
                    'status' => 'anonymized',
                ],
                reason: 'Pengguna meminta penghapusan akun mandiri.',
            );
        }, attempts: 5);
    }
}
