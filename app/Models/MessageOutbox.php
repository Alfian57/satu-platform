<?php

namespace App\Models;

use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use Database\Factories\MessageOutboxFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property MessagePurpose $purpose
 * @property string $recipient
 * @property string|null $template_name
 * @property string|null $template_version
 * @property string|null $payload
 * @property MessageStatus $status
 * @property int $attempts
 * @property int $max_attempts
 * @property Carbon|null $next_attempt_at
 * @property Carbon|null $sent_at
 * @property Carbon|null $delivered_at
 * @property array<int, array<string, mixed>>|null $status_history
 * @property array<string, mixed>|null $metadata
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class MessageOutbox extends Model
{
    /** @use HasFactory<MessageOutboxFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return HasMany<MessageDelivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(MessageDelivery::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purpose' => MessagePurpose::class,
            'status' => MessageStatus::class,
            'next_attempt_at' => 'datetime',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'status_history' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * @param  Builder<MessageOutbox>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', MessageStatus::Pending->value);
    }

    /**
     * @param  Builder<MessageOutbox>  $query
     */
    public function scopeReadyToSend(Builder $query): void
    {
        $query->where('status', MessageStatus::Pending->value)
            ->where(function (Builder $q): void {
                $q->whereNull('next_attempt_at')
                    ->orWhere('next_attempt_at', '<=', Carbon::now());
            });
    }

    public function recordAttempt(): void
    {
        $this->increment('attempts');

        if ($this->fresh()->attempts >= $this->max_attempts) {
            $this->update(['status' => MessageStatus::Failed]);
        }
    }

    public function recordSent(string $providerMessageId): void
    {
        $this->update([
            'status' => MessageStatus::Sent,
            'sent_at' => Carbon::now(),
        ]);
    }

    /**
     * Mark an outbox as failed without ever overwriting a successful send.
     * The status history stays append-only so retries and recoveries are auditable.
     */
    public function recordFailure(?string $reason = null): void
    {
        $this->refresh();

        if (in_array($this->status, [MessageStatus::Sent, MessageStatus::Delivered], true)) {
            return;
        }

        $history = $this->status_history ?? [];
        $history[] = [
            'status' => MessageStatus::Failed->value,
            'timestamp' => Carbon::now()->toIso8601String(),
            'reason' => $reason,
        ];

        $this->update([
            'status' => MessageStatus::Failed,
            'status_history' => $history,
        ]);
    }

    /**
     * @param  Builder<MessageOutbox>  $query
     */
    public function scopeStaleProcessing(Builder $query, int $minutes = 3): void
    {
        $query->where('status', MessageStatus::Processing->value)
            ->where('updated_at', '<', Carbon::now()->subMinutes($minutes));
    }

    public function recordDelivered(): void
    {
        $this->update([
            'status' => MessageStatus::Delivered,
            'delivered_at' => Carbon::now(),
        ]);
    }
}
