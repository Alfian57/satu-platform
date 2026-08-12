<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class TeamInvitationReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TeamInvitation $invitation,
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

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'team_invitation_id' => $this->invitation->getKey(),
            'project_id' => $this->invitation->project_id,
            'message' => 'Kamu menerima invitation untuk bergabung ke project.',
            'action_url' => route('projects.show', $this->invitation->project_id),
            'action_label' => 'Lihat project',
            'purpose' => 'team_invitation',
            'expires_at' => $this->invitation->expires_at->toIso8601String(),
        ];
    }
}
