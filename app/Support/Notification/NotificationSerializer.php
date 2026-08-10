<?php

namespace App\Support\Notification;

use Illuminate\Notifications\DatabaseNotification;

final class NotificationSerializer
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        $safe = [
            'id' => $notification->id,
            'type' => $notification->type,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at->toIso8601String(),
            'message' => $data['message'] ?? '',
            'action_url' => $data['action_url'] ?? null,
            'purpose' => $data['purpose'] ?? null,
        ];

        if (isset($data['action_label'])) {
            $safe['action_label'] = $data['action_label'];
        }

        if (isset($data['delivery_status'])) {
            $safe['delivery_status'] = $data['delivery_status'];
        }

        return $safe;
    }
}
