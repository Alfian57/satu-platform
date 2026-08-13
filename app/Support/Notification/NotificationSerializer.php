<?php

namespace App\Support\Notification;

use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Arr;

final class NotificationSerializer
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(DatabaseNotification $notification): array
    {
        $data = $notification->data;
        $purpose = is_string($data['purpose'] ?? null) ? $data['purpose'] : null;
        $category = is_string($data['category'] ?? null)
            ? $data['category']
            : NotificationCatalog::categoryForPurpose($purpose);

        $safe = [
            'id' => $notification->id,
            'type' => $notification->type,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at->toIso8601String(),
            'message' => is_string($data['message'] ?? null) ? $data['message'] : '',
            'action_url' => is_string($data['action_url'] ?? null)
                ? $data['action_url']
                : null,
            'purpose' => $purpose,
            'category' => $category,
            'category_label' => NotificationCatalog::categoryLabel($category),
            'read_status' => $notification->read_at === null ? 'unread' : 'read',
        ];

        if (is_string($data['action_label'] ?? null)) {
            $safe['action_label'] = $data['action_label'];
        }

        if (is_string($data['delivery_status'] ?? null)) {
            $safe['delivery_status'] = Arr::first([
                'queued',
                'sent',
                'failed',
            ], static fn (string $status): bool => $status === $data['delivery_status']);
        }

        return $safe;
    }
}
