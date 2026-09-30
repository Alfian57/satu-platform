<?php

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SuspendInstitution
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    public function handle(User $actor, Institution $institution, string $reason): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can suspend institutions.');
        }

        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'reason' => 'Alasan penangguhan wajib diisi.',
            ]);
        }

        DB::transaction(function () use ($actor, $institution, $reason): void {
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->first();

            if ($lockedInstitution === null || $lockedInstitution->status !== InstitutionStatus::Active) {
                throw ValidationException::withMessages([
                    'institution' => 'Institusi ini tidak dapat ditangguhkan.',
                ]);
            }

            $lockedInstitution->update(['status' => InstitutionStatus::Suspended]);

            $this->auditRecorder->record(
                operation: 'institution.suspended',
                auditable: $lockedInstitution,
                actor: $actor,
                institution: $lockedInstitution,
                before: ['status' => InstitutionStatus::Active->value],
                after: ['status' => InstitutionStatus::Suspended->value],
                reason: $reason,
            );
        });
    }
}
