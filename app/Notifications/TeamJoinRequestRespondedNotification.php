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
        $message = match ($this->response) {
            'accepted' => 'Pengajuanmu diterima. Periksa peran dan buka ruang kerja jika akses masih tersedia.',
            'expired' => 'Pengajuan berakhir karena keanggotaan terbentuk melalui jalur lain. Periksa status tim terbaru.',
            default => 'Pengajuanmu belum diterima. Baca alasan dan temukan peran lain yang sesuai.',
        };

        return [
            'team_join_request_id' => $this->request->getKey(),
            'project_id' => $this->request->project_id,
            'responder_id' => $this->responder->getKey(),
            'response' => $this->response,
            'message' => $message,
            'action_url' => route('projects.show', $this->request->project_id),
            'action_label' => 'Baca keputusan',
            'purpose' => 'team_join_request',
        ];
    }
}
