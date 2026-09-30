<?php

declare(strict_types=1);

namespace App\Actions\Academic;

use App\Actions\Audit\AuditRecorder;
use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class ActivateCreditMapping
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Activate a draft credit mapping ruleset, retiring any existing active mapping for the same activity type to preserve history.
     *
     * @throws InvalidArgumentException|AuthorizationException
     */
    public function execute(
        User $approver,
        AcademicCreditMapping $mapping,
    ): AcademicCreditMapping {
        Gate::forUser($approver)->authorize('activate', $mapping);

        return DB::transaction(function () use ($approver, $mapping) {
            $mapping = AcademicCreditMapping::query()
                ->whereKey($mapping->getKey())
                ->lockForUpdate()
                ->first();

            if ($mapping === null) {
                throw new InvalidArgumentException('Pemetaan kredit tidak ditemukan.');
            }

            Gate::forUser($approver)->authorize('activate', $mapping);

            if ($mapping->status !== CreditMappingStatus::Draft) {
                throw new InvalidArgumentException('Hanya pemetaan kredit berstatus draft yang dapat diaktifkan.');
            }

            $now = Carbon::now();

            // Retire currently active mapping for the same institution & activity type
            AcademicCreditMapping::query()
                ->where('institution_id', $mapping->institution_id)
                ->where('activity_type', $mapping->activity_type)
                ->where('status', CreditMappingStatus::Active)
                ->update([
                    'status' => CreditMappingStatus::Retired,
                    'effective_to' => $now,
                ]);

            $mapping->update([
                'status' => CreditMappingStatus::Active,
                'effective_from' => $now,
                'approver_user_id' => $approver->id,
            ]);

            $this->auditRecorder->record(
                operation: 'academic_credit_mapping.activated',
                auditable: $mapping,
                actor: $approver,
                before: ['status' => CreditMappingStatus::Draft->value],
                after: [
                    'status' => CreditMappingStatus::Active->value,
                    'approver_user_id' => $approver->id,
                    'effective_from' => $now->toIso8601String(),
                ],
                reason: 'Academic credit mapping activated by campus approver.',
            );

            return $mapping;
        });
    }
}
