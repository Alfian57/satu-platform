<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamJoinRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class TeamJoinRequestRespondedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TeamJoinRequest $request,
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
        $message = $this->response === 'accepted'
            ? 'Join request kamu diterima.'
            : 'Join request kamu ditolak.';

        return [
            'team_join_request_id' => $this->request->getKey(),
            'project_id' => $this->request->project_id,
            'responder_id' => $this->responder->getKey(),
            'response' => $this->response,
            'message' => $message,
            'action_url' => route('projects.show', $this->request->project_id),
            'action_label' => 'Lihat project',
            'purpose' => 'team_join_request',
        ];
    }
}
