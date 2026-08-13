<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PortfolioEntry;
use App\Notifications\Concerns\HasDatabaseNotificationIntent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class PortfolioEntryReadyNotification extends Notification implements ShouldQueue
{
    use HasDatabaseNotificationIntent, Queueable;

    public function __construct(
        public readonly PortfolioEntry $entry,
    ) {
        $this->afterCommit();
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function notificationIntentKey(): string
    {
        return implode(':', [
            'portfolio_projection',
            $this->entry->getKey(),
            $this->entry->contribution_version_id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'intent_key' => $this->notificationIntentKey(),
            'contribution_id' => $this->entry->contribution_id,
            'contribution_version_id' => $this->entry->contribution_version_id,
            'portfolio_entry_id' => $this->entry->getKey(),
            'verification_level' => $this->entry->verification_level->value,
            'message' => 'Contribution yang tervalidasi sudah tersimpan sebagai entry portfolio.',
            'action_url' => route('portfolio.show', $this->entry),
            'action_label' => 'Lihat entry portfolio',
            'purpose' => 'portfolio_projection',
            'category' => 'contribution',
        ];
    }
}
