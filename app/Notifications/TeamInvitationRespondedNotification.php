<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class TeamInvitationRespondedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TeamInvitation $invitation,
        public readonly User $responder,
        public readonly string $response,
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
        $message = match ($this->response) {
            'accepted' => 'Invitation project kamu diterima.',
            'revoked' => 'Invitation project kamu dibatalkan oleh owner.',
            default => 'Invitation project kamu ditolak.',
        };

        return [
            'team_invitation_id' => $this->invitation->getKey(),
            'project_id' => $this->invitation->project_id,
            'responder_id' => $this->responder->getKey(),
            'response' => $this->response,
            'message' => $message,
            'action_url' => route('projects.show', $this->invitation->project_id),
            'action_label' => 'Lihat project',
            'purpose' => 'team_invitation',
        ];
    }
}
