<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

trait HasDatabaseNotificationIntent
{
    abstract public function notificationIntentKey(): string;

    public function shouldSend(object $notifiable, string $channel): bool
    {
        if (
            $channel !== 'database'
            || ! method_exists($notifiable, 'notifications')
        ) {
            return true;
        }

        return ! $notifiable->notifications()
            ->whereJsonContains('data->intent_key', $this->notificationIntentKey())
            ->exists();
    }
}
