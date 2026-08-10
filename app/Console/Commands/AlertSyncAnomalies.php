<?php

namespace App\Console\Commands;

use App\Actions\Integration\DetectSyncAnomalies;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('integration:alert-sync-anomalies')]
#[Description('Emit sanitized alerts when academic sync health crosses a threshold')]
class AlertSyncAnomalies extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(DetectSyncAnomalies $alerts): int
    {
        $emitted = $alerts->run();

        $this->info("Emitted {$emitted} academic sync alert(s).");

        return self::SUCCESS;
    }
}
