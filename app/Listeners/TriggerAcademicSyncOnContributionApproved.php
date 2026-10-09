<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Integration\DispatchAcademicSync;
use App\Enums\CreditMappingStatus;
use App\Enums\IntegrationConnectionStatus;
use App\Events\ContributionApproved;
use App\Models\AcademicCreditMapping;
use App\Models\Contribution;
use App\Models\IntegrationConnection;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class TriggerAcademicSyncOnContributionApproved implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    /**
     * @var array<int>
     */
    public array $backoff = [30, 120, 300];

    public function __construct(
        private readonly DispatchAcademicSync $dispatchAcademicSync,
    ) {}

    public function handle(ContributionApproved $event): void
    {
        // 1. Check if there are active integration connections for this institution
        $connections = IntegrationConnection::query()
            ->where('institution_id', $event->institutionId)
            ->whereIn('status', [
                IntegrationConnectionStatus::Connected,
                IntegrationConnectionStatus::Degraded,
                IntegrationConnectionStatus::Disconnected,
            ])
            ->get();

        if ($connections->isEmpty()) {
            return;
        }

        // 2. Fetch the contribution and its version
        $contribution = Contribution::query()
            ->with(['currentVersion', 'currentVersion.task'])
            ->find($event->contributionId);

        if ($contribution === null || $contribution->institution_id !== $event->institutionId) {
            return;
        }

        // 3. Find active credit mapping for this institution
        // Try to match 'contribution_approved' or any active credit mapping
        $mapping = AcademicCreditMapping::query()
            ->where('institution_id', $event->institutionId)
            ->where('status', CreditMappingStatus::Active)
            ->where('activity_type', 'contribution_approved')
            ->first();

        if ($mapping === null) {
            // Fallback: check if there is any active mapping
            $mapping = AcademicCreditMapping::query()
                ->where('institution_id', $event->institutionId)
                ->where('status', CreditMappingStatus::Active)
                ->first();
        }

        if ($mapping === null) {
            return;
        }

        $source = 'contribution_approved';
        $mappingVersion = (string) $mapping->version;
        $idempotencyKey = "contribution_version.{$event->contributionVersionId}.mapping.{$mapping->id}";

        $payload = [
            'contribution_id' => $event->contributionId,
            'contribution_version_id' => $event->contributionVersionId,
            'institution_id' => $event->institutionId,
            'mapping_id' => $mapping->id,
            'activity_type' => $mapping->activity_type,
            'credit_amount' => $mapping->credit_amount,
            'simulate' => 'success',
        ];

        foreach ($connections as $connection) {
            $this->dispatchAcademicSync->execute(
                connection: $connection,
                source: $source,
                mappingVersion: $mappingVersion,
                idempotencyKey: "{$connection->id}.{$idempotencyKey}",
                payload: $payload,
            );
        }
    }

    public function failed(?Throwable $exception = null): void
    {
        Log::error('academic_integration.sync_trigger_failed', [
            'error_class' => $exception === null ? null : $exception::class,
            'error' => $exception?->getMessage(),
        ]);
    }
}
