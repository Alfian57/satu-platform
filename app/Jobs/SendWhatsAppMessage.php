<?php

namespace App\Jobs;

use App\Enums\MessageStatus;
use App\Models\MessageDelivery;
use App\Models\MessageOutbox;
use App\Support\Notification\WhatsAppGateway;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 90;

    /**
     * @var array<int>
     */
    public array $backoff = [60, 300, 900];

    public function __construct(
        private readonly int $outboxId,
    ) {}

    public function handle(WhatsAppGateway $gateway): void
    {
        $outbox = MessageOutbox::query()->findOrFail($this->outboxId);

        if ($outbox->status !== MessageStatus::Pending) {
            return;
        }

        if ($outbox->attempts >= $outbox->max_attempts) {
            $outbox->recordFailure('attempts_exhausted');

            return;
        }

        $outbox->update(['status' => MessageStatus::Processing]);

        $outbox->recordAttempt();

        $result = $gateway->send([
            'target' => $outbox->recipient,
            'message' => $this->buildMessage($outbox),
        ]);

        $this->recordDelivery($outbox, $result);

        if ($result['success']) {
            $outbox->recordSent($result['provider_message_id'] ?? '');
        } else {
            $this->scheduleRetryOrFail($outbox, $result['error'] ?? 'Unknown error');
        }
    }

    private function buildMessage(MessageOutbox $outbox): string
    {
        if ($outbox->payload !== null) {
            $payload = $outbox->payload;

            try {
                $payload = Crypt::decryptString($payload);
            } catch (DecryptException) {
                // Keep compatibility with existing non-sensitive fixtures.
            }

            $data = json_decode($payload, true);

            if (is_array($data) && isset($data['message'])) {
                return $data['message'];
            }
        }

        return '';
    }

    /**
     * @param  array{success: bool, provider_message_id?: string, error?: string}  $result
     */
    private function recordDelivery(MessageOutbox $outbox, array $result): void
    {
        MessageDelivery::query()->create([
            'message_outbox_id' => $outbox->id,
            'provider' => 'fonnte',
            'external_id' => $result['provider_message_id'] ?? null,
            'status' => $result['success'] ? MessageStatus::Sent : MessageStatus::Failed,
            'error_message' => $this->sanitizeError($result['error'] ?? null),
            'status_history' => [[
                'status' => $result['success'] ? 'sent' : 'failed',
                'timestamp' => Carbon::now()->toIso8601String(),
            ]],
        ]);
    }

    private function scheduleRetryOrFail(MessageOutbox $outbox, string $error): void
    {
        if ($outbox->attempts < $outbox->max_attempts) {
            $backoff = $this->backoff[min($outbox->attempts - 1, count($this->backoff) - 1)];

            $outbox->update([
                'status' => MessageStatus::Pending,
                'next_attempt_at' => Carbon::now()->addSeconds($backoff),
            ]);
        } else {
            $outbox->update(['status' => MessageStatus::Failed]);
        }
    }

    private function sanitizeError(?string $error): ?string
    {
        if ($error === null) {
            return null;
        }

        $redacted = preg_replace('/\d{10,14}/', '[PHONE]', $error);

        return mb_substr((string) $redacted, 0, 500);
    }

    /**
     * Reconcile an outbox when the job exhausts its retries or crashes.
     *
     * The outbox is marked failed through an append-only record so it never is
     * left stuck in "processing". A successful send is never overwritten and
     * no extra delivery record is created, keeping domain state intact.
     */
    public function failed(Throwable $exception): void
    {
        $outbox = MessageOutbox::query()->find($this->outboxId);

        if ($outbox === null) {
            return;
        }

        $outbox->recordFailure('max_retries');

        Log::error('WhatsApp delivery job exhausted retries', [
            'outbox_id' => $outbox->getKey(),
            'purpose' => $outbox->purpose->value,
            'error_class' => $exception::class,
        ]);
    }
}
