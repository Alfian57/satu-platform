<?php

declare(strict_types=1);

namespace App\Actions\Integration;

use App\Actions\Audit\AuditRecorder;
use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Lets a campus operator manually mark a dead or conflicting sync as resolved.
 *
 * Reconciliation is a deliberate human decision, never an automated merge. It
 * records an append-only event and an audit trail referencing the operator.
 */
final class ReconcileIntegrationSync
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    public function execute(User $operator, IntegrationSync $sync, string $reason): IntegrationSync
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw new InvalidArgumentException('Alasan rekonsiliasi wajib diisi.');
        }

        if ($sync->status === IntegrationSyncStatus::Reconciled) {
            throw new InvalidArgumentException('Sync sudah direkonsiliasi.');
        }

        $sync->loadMissing(['connection', 'connection.institution']);

        $previousStatus = $sync->status;

        return DB::transaction(function () use ($operator, $sync, $reason, $previousStatus) {
            $sync->forceFill([
                'status' => IntegrationSyncStatus::Reconciled->value,
            ])->save();

            (new IntegrationSyncEvent)->forceFill([
                'integration_sync_id' => $sync->id,
                'status' => IntegrationSyncStatus::Reconciled->value,
                'reason' => 'Direkonsiliasi oleh operator: '.$reason,
            ])->save();

            $this->auditRecorder->record(
                operation: 'academic_sync.reconciled',
                auditable: $sync,
                actor: $operator,
                institution: $sync->connection->institution,
                before: ['status' => $previousStatus->value],
                after: ['status' => IntegrationSyncStatus::Reconciled->value],
                reason: 'Manual reconciliation by campus operator.',
                request: request(),
            );

            return $sync->fresh();
        });
    }
}
