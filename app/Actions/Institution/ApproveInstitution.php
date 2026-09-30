<?php

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ApproveInstitution
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    public function handle(User $actor, Institution $institution, string $reason): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can approve institutions.');
        }

        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'reason' => 'Alasan persetujuan wajib diisi.',
            ]);
        }

        DB::transaction(function () use ($actor, $institution, $reason): void {
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->first();

            if ($lockedInstitution === null || $lockedInstitution->status !== InstitutionStatus::Pending) {
                throw ValidationException::withMessages([
                    'institution' => 'Institusi ini tidak lagi menunggu persetujuan.',
                ]);
            }

            $lockedInstitution->update(['status' => InstitutionStatus::Active]);

            $this->auditRecorder->record(
                operation: 'institution.approved',
                auditable: $lockedInstitution,
                actor: $actor,
                institution: $lockedInstitution,
                before: ['status' => InstitutionStatus::Pending->value],
                after: ['status' => InstitutionStatus::Active->value],
                reason: $reason,
            );
        });
    }
}
