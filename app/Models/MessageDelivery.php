<?php

namespace App\Models;

use App\Enums\MessageStatus;
use Database\Factories\MessageDeliveryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $message_outbox_id
 * @property string $provider
 * @property string|null $external_id
 * @property MessageStatus $status
 * @property array<int, array<string, mixed>>|null $status_history
 * @property string|null $error_message
 * @property Carbon|null $callback_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class MessageDelivery extends Model
{
    /** @use HasFactory<MessageDeliveryFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<MessageOutbox, $this>
     */
    public function outbox(): BelongsTo
    {
        return $this->belongsTo(MessageOutbox::class, 'message_outbox_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => MessageStatus::class,
            'status_history' => 'array',
            'callback_at' => 'datetime',
        ];
    }
}
