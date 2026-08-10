<?php

declare(strict_types=1);

namespace App\Actions\Academic;

use App\Actions\Audit\AuditRecorder;
use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class RetireCreditMapping
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Retire an active credit mapping ruleset with a reason.
     *
     * @throws InvalidArgumentException
     */
    public function execute(
        User $operator,
        int $mappingId,
        ?string $reason = null,
    ): AcademicCreditMapping {
        $mapping = AcademicCreditMapping::query()->find($mappingId);

        if ($mapping === null) {
            throw new InvalidArgumentException('Credit mapping not found.');
        }

        if ($mapping->status !== CreditMappingStatus::Active) {
            throw new InvalidArgumentException('Only active credit mappings can be retired.');
        }

        return DB::transaction(function () use ($operator, $mapping, $reason) {
            $now = Carbon::now();

            $mapping->update([
                'status' => CreditMappingStatus::Retired,
                'effective_to' => $now,
                'reason' => $reason !== null ? trim($reason) : $mapping->reason,
            ]);

            $this->auditRecorder->record(
                operation: 'academic_credit_mapping.retired',
                auditable: $mapping,
                actor: $operator,
                before: ['status' => CreditMappingStatus::Active->value],
                after: [
                    'status' => CreditMappingStatus::Retired->value,
                    'effective_to' => $now->toIso8601String(),
                ],
                reason: 'Academic credit mapping retired by campus operator.',
            );

            return $mapping;
        });
    }
}
