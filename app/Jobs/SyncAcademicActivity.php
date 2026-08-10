<?php

namespace App\Jobs;

use App\Actions\Integration\ProcessIntegrationSync;
use App\Enums\IntegrationSyncStatus;
use App\Exceptions\SyncRetryableException;
use App\Models\IntegrationSync;
use App\Support\Integration\AcademicGateway;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncAcademicActivity implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 90;

    /**
     * @var array<int>
     */
    public array $backoff = [60, 300, 900, 1800, 3600];

    public int $uniqueFor = 3600;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly int $syncId,
        public readonly array $payload,
    ) {}

    public function uniqueId(): string
    {
        return 'academic-sync-'.$this->syncId;
    }

    public function handle(AcademicGateway $gateway): void
    {
        $sync = IntegrationSync::query()->findOrFail($this->syncId);

        if (in_array($sync->status, [
            IntegrationSyncStatus::Succeeded,
            IntegrationSyncStatus::Reconciled,
            IntegrationSyncStatus::Dead,
        ], true)) {
            return;
        }

        $errorClass = (new ProcessIntegrationSync($gateway))->handle($sync, $this->payload);

        if ($errorClass !== null && $errorClass->retryable()) {
            throw new SyncRetryableException($errorClass, 'Sync classified as retryable.');
        }
    }

    public function failed(?\Throwable $e = null): void
    {
        $sync = IntegrationSync::query()->find($this->syncId);

        if ($sync === null) {
            return;
        }

        $reason = $e !== null
            ? 'Dead-letter after exhausted retries: '.$e->getMessage()
            : 'Dead-letter after exhausted retries.';

        (new ProcessIntegrationSync(app(AcademicGateway::class)))->markDead($sync, $reason);
    }
}
