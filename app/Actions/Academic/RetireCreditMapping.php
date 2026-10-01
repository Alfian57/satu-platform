<?php

declare(strict_types=1);

namespace App\Actions\Academic;

use App\Actions\Audit\AuditRecorder;
use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class RetireCreditMapping
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Retire an active credit mapping ruleset with a reason.
     *
     * @throws InvalidArgumentException|AuthorizationException
     */
    public function execute(
        User $operator,
        AcademicCreditMapping $mapping,
        ?string $reason = null,
    ): AcademicCreditMapping {
        Gate::forUser($operator)->authorize('retire', $mapping);

        return DB::transaction(function () use ($operator, $mapping, $reason) {
            $institution = Institution::query()
                ->whereKey($mapping->institution_id)
                ->lockForUpdate()
                ->first();

            if ($institution === null) {
                throw new InvalidArgumentException('Institusi pemetaan kredit tidak ditemukan.');
            }

            $mapping = AcademicCreditMapping::query()
                ->whereKey($mapping->getKey())
                ->lockForUpdate()
                ->first();

            if ($mapping === null) {
                throw new InvalidArgumentException('Pemetaan kredit tidak ditemukan.');
            }

            Gate::forUser($operator)->authorize('retire', $mapping);

            if ($mapping->status !== CreditMappingStatus::Active) {
                throw new InvalidArgumentException('Hanya pemetaan kredit berstatus aktif yang dapat dipensiunkan.');
            }

            $now = Carbon::now();
            $before = [
                'activity_type' => $mapping->activity_type,
                'version' => $mapping->version,
                'status' => CreditMappingStatus::Active->value,
            ];

            $mapping->update([
                'status' => CreditMappingStatus::Retired,
                'effective_to' => $now,
                'reason' => $reason !== null ? trim($reason) : $mapping->reason,
            ]);

            $this->auditRecorder->record(
                operation: 'academic_credit_mapping.retired',
                auditable: $mapping,
                actor: $operator,
                institution: $institution,
                before: $before,
                after: [
                    'activity_type' => $mapping->activity_type,
                    'version' => $mapping->version,
                    'status' => CreditMappingStatus::Retired->value,
                    'effective_to' => $now->toIso8601String(),
                ],
                reason: 'Academic credit mapping retired by campus operator.',
            );

            return $mapping;
        });
    }
}
