<?php

namespace App\Support\Notification;

use App\Enums\MessagePurpose;
use App\Models\MessageOutbox;
use App\Models\NotificationPreference;
use App\Models\PhoneNumber;
use App\Support\PhoneIdentity;
use Throwable;

final class DeliveryPreferences
{
    private const CRITICAL_PURPOSES = [
        MessagePurpose::Otp,
        MessagePurpose::Security,
    ];

    /**
     * Authentication and account-security messages must always reach the
     * recipient. Discovery and collaboration intents are opt-in.
     */
    public function isCritical(MessagePurpose $purpose): bool
    {
        return in_array($purpose, self::CRITICAL_PURPOSES, true);
    }

    /**
     * Decide whether an outbox entry should be dispatched for delivery.
     *
     * Critical purposes bypass channel preferences. Non-critical intents are
     * skipped only when the recipient has explicitly disabled the WhatsApp
     * channel for that purpose. The absence of a preference defaults to yes.
     */
    public function shouldDeliver(MessageOutbox $outbox): bool
    {
        $purpose = $outbox->purpose;

        if ($this->isCritical($purpose)) {
            return true;
        }

        $userId = $this->resolveRecipientUserId($outbox);

        if ($userId === null) {
            return true;
        }

        $preference = NotificationPreference::query()
            ->where('user_id', $userId)
            ->where('purpose', $purpose->value)
            ->where('channel', 'whatsapp')
            ->first();

        return $preference === null || $preference->enabled;
    }

    private function resolveRecipientUserId(MessageOutbox $outbox): ?int
    {
        try {
            $numberHash = PhoneIdentity::hash((string) $outbox->recipient);
        } catch (Throwable) {
            return null;
        }

        $userId = PhoneNumber::query()
            ->verified()
            ->select('user_id')
            ->where('number_hash', $numberHash)
            ->value('user_id');

        return is_numeric($userId) ? (int) $userId : null;
    }
}
