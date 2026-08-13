<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Contribution;
use App\Notifications\Concerns\HasDatabaseNotificationIntent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class ContributionSubmittedNotification extends Notification implements ShouldQueue
{
    use HasDatabaseNotificationIntent, Queueable;

    public function __construct(
        public readonly Contribution $contribution,
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
            'contribution_submitted',
            $this->contribution->getKey(),
            $this->contribution->current_version_id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->contribution->loadMissing('currentVersion');

        return [
            'intent_key' => $this->notificationIntentKey(),
            'contribution_id' => $this->contribution->getKey(),
            'project_id' => $this->contribution->project_id,
            'version_id' => $this->contribution->currentVersion?->getKey(),
            'version_number' => $this->contribution->currentVersion?->version_number,
            'message' => 'Ada kontribusi baru yang menunggu review kampus.',
            'action_url' => route('contributions.show', $this->contribution),
            'action_label' => 'Tinjau kontribusi',
            'purpose' => 'contribution_submitted',
            'category' => 'contribution',
        ];
    }
}
