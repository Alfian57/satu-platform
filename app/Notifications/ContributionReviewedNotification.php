<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ContributionReview;
use App\Notifications\Concerns\HasDatabaseNotificationIntent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class ContributionReviewedNotification extends Notification implements ShouldQueue
{
    use HasDatabaseNotificationIntent, Queueable;

    public function __construct(
        public readonly ContributionReview $review,
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
            'contribution_reviewed',
            $this->review->getKey(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->review->loadMissing('contributionVersion.contribution');
        $contribution = $this->review->contributionVersion->contribution;

        $message = match ($this->review->decision->value) {
            'approved' => 'Kontribusi kamu sudah divalidasi oleh reviewer kampus.',
            'revision' => 'Kontribusi kamu perlu diperbaiki sebelum dapat divalidasi.',
            default => 'Kontribusi kamu belum dapat divalidasi oleh reviewer kampus.',
        };

        return [
            'intent_key' => $this->notificationIntentKey(),
            'contribution_id' => $contribution->getKey(),
            'contribution_version_id' => $this->review->contribution_version_id,
            'review_id' => $this->review->getKey(),
            'decision' => $this->review->decision->value,
            'policy_version' => $this->review->policy_version,
            'reason' => $this->review->reason,
            'note' => $this->review->note,
            'message' => $message,
            'action_url' => route('contributions.show', $contribution),
            'action_label' => 'Lihat hasil review',
            'purpose' => 'contribution_reviewed',
            'category' => 'contribution',
        ];
    }
}
