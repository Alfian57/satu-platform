<?php

namespace App\Actions\User;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Models\ConsentRecord;
use App\Models\PhoneNumber;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeleteUserAccount
{
    public function __construct(
        private readonly ConsentRecorder $consentRecorder,
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Anonymize subject-facing user account while preserving append-only audit records.
     */
    public function handle(User $user): void
    {
        DB::transaction(function () use ($user): void {
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
        });
    }
}
