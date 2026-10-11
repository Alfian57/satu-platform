<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamJoinRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class TeamJoinRequestReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private readonly string $status;

    public function __construct(
        public readonly TeamJoinRequest $request,
    ) {
        $this->status = $request->status->value;
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
            'team_join_request_id' => $this->request->getKey(),
            'project_id' => $this->request->project_id,
            'message' => $this->status === 'withdrawn' ? 'Pemohon menarik pengajuan bergabung. Tidak ada tempat tim yang terpakai.' : 'Ada pengajuan baru untuk bergabung ke proyekmu.',
            'action_url' => route('projects.show', $this->request->project_id),
            'action_label' => 'Periksa pengajuan',
            'purpose' => 'team_join_request',
        ];
    }
}
