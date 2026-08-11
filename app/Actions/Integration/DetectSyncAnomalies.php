<?php

namespace App\Actions\Integration;

use App\Models\IntegrationSyncMetric;
use Illuminate\Support\Facades\Log;

/**
 * Emits sanitized alert logs when a connection's sync health crosses a threshold.
 *
 * Alerts carry only identifiers and aggregate counters, never phone, token,
 * message body, or provider payload content.
 */
final class DetectSyncAnomalies
{
    /**
     * @param  int  $queueAgeThresholdSeconds  Alert when a sync waited longer than this.
     * @param  int  $retryThreshold  Alert when retries exceed this on a connection.
     */
    public function run(
        int $queueAgeThresholdSeconds = 3600,
        int $retryThreshold = 3,
    ): int {
        $alerts = 0;

        IntegrationSyncMetric::query()
            ->with('connection')
            ->each(function (IntegrationSyncMetric $metric) use (&$alerts, $queueAgeThresholdSeconds, $retryThreshold): void {
                if ($metric->dead_letter_count > 0) {
                    $this->warn($metric, 'dead_letter', [
                        'dead_letter_count' => $metric->dead_letter_count,
                    ]);
                    $alerts++;
                }

                if ($metric->queue_age_seconds > $queueAgeThresholdSeconds) {
                    $this->warn($metric, 'queue_age', [
                        'queue_age_seconds' => $metric->queue_age_seconds,
                        'threshold_seconds' => $queueAgeThresholdSeconds,
                    ]);
                    $alerts++;
                }

                if ($metric->total_retries > $retryThreshold) {
                    $this->warn($metric, 'retry_volume', [
                        'total_retries' => $metric->total_retries,
                        'threshold' => $retryThreshold,
                    ]);
                    $alerts++;
                }
            });

        return $alerts;
    }

    /**
     * @param  array<string, int>  $context
     */
    private function warn(IntegrationSyncMetric $metric, string $reason, array $context): void
    {
        Log::warning('academic.sync.alert', array_merge([
            'institution_id' => $metric->institution_id,
            'connection_id' => $metric->integration_connection_id,
            'alert' => $reason,
        ], $context));
    }
}
