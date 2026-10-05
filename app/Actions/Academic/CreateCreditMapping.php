<?php

declare(strict_types=1);

namespace App\Actions\Academic;

use App\Actions\Audit\AuditRecorder;
use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class CreateCreditMapping
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Create a new draft credit mapping ruleset for an institution.
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $operator,
        Institution $institution,
        string $activityType,
        float $creditAmount,
        ?string $reason = null,
    ): AcademicCreditMapping {
        Gate::forUser($operator)->authorize('create', [AcademicCreditMapping::class, $institution]);

        if ($creditAmount <= 0 || $creditAmount > 24) {
            throw new InvalidArgumentException('Jumlah kredit harus antara 0.5 dan 24.');
        }

        if (trim($activityType) === '') {
            throw new InvalidArgumentException('Tipe aktivitas wajib diisi.');
        }

        $activityType = trim($activityType);

        return DB::transaction(function () use ($operator, $institution, $activityType, $creditAmount, $reason) {
            $institution = Institution::query()
                ->whereKey($institution->getKey())
                ->lockForUpdate()
                ->first()
                ?? throw new InvalidArgumentException('Institusi tidak ditemukan.');

            $nextVersion = ((int) AcademicCreditMapping::query()
                ->where('institution_id', $institution->getKey())
                ->where('activity_type', $activityType)
                ->max('version')) + 1;

            $mapping = AcademicCreditMapping::query()->create([
                'institution_id' => $institution->getKey(),
                'activity_type' => $activityType,
                'version' => $nextVersion,
                'credit_amount' => $creditAmount,
                'status' => CreditMappingStatus::Draft,
                'reason' => $reason !== null ? trim($reason) : null,
            ]);

            $this->auditRecorder->record(
                operation: 'academic_credit_mapping.created',
                auditable: $mapping,
                actor: $operator,
                institution: $institution,
                before: [],
                after: [
                    'institution_id' => $institution->getKey(),
                    'activity_type' => $mapping->activity_type,
                    'version' => $mapping->version,
                    'credit_amount' => $mapping->credit_amount,
                    'status' => CreditMappingStatus::Draft->value,
                ],
                reason: 'Draft academic credit mapping ruleset created.',
            );

            return $mapping;
        });
    }
}
