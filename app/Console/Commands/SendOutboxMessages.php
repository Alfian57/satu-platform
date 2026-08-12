<?php

namespace App\Console\Commands;

use App\Enums\MessageStatus;
use App\Jobs\SendWhatsAppMessage;
use App\Models\MessageOutbox;
use App\Support\Notification\DeliveryPreferences;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('message:dispatch-due')]
#[Description('Reclaim stale deliveries and dispatch ready WhatsApp outbox messages to the queue')]
class SendOutboxMessages extends Command
{
    public function __construct(
        private readonly DeliveryPreferences $preferences,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $reclaimed = $this->reclaimStaleProcessing();

        $dispatched = 0;

        MessageOutbox::query()
            ->readyToSend()
            ->orderBy('next_attempt_at')
            ->limit(500)
            ->each(function (MessageOutbox $outbox) use (&$dispatched): void {
                if ($this->preferences->shouldDeliver($outbox)) {
                    SendWhatsAppMessage::dispatch($outbox->getKey());

                    $dispatched++;
                }
            });

        $this->info("Reclaimed {$reclaimed} stale outbox entri(es); dispatched {$dispatched} message(s).");

        return self::SUCCESS;
    }

    /**
     * Bring outboxes left in "processing" by a crashed worker back to a
     * dispatchable state. Entries that already exhausted their attempts are
     * resolved to "failed" so they are never resent; the rest return to
     * "pending". Recovery is append-only.
     */
    private function reclaimStaleProcessing(): int
    {
        $ids = MessageOutbox::query()
            ->staleProcessing()
            ->orderBy('id')
            ->limit(500)
            ->pluck('id');

        $reclaimed = 0;

        foreach ($ids as $id) {
            $outbox = MessageOutbox::query()
                ->whereKey($id)
                ->where('status', MessageStatus::Processing->value)
                ->lockForUpdate()
                ->first();

            if ($outbox === null) {
                continue;
            }

            if ($outbox->attempts >= $outbox->max_attempts) {
                $outbox->recordFailure('stale_processing_reclaim_exhausted');

                $reclaimed++;

                continue;
            }

            $history = $outbox->status_history ?? [];
            $history[] = [
                'status' => MessageStatus::Pending->value,
                'timestamp' => now()->toIso8601String(),
                'reason' => 'stale_processing_reclaim',
            ];

            $outbox->update([
                'status' => MessageStatus::Pending,
                'status_history' => $history,
            ]);

            $reclaimed++;
        }

        return $reclaimed;
    }
}
