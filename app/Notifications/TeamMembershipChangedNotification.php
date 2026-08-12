<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class TeamMembershipChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TeamMembership $membership,
        public readonly User $actor,
        public readonly string $change,
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
        $message = $this->change === 'removed'
            ? 'Akses kamu ke project telah dihentikan oleh owner.'
            : 'Seorang anggota meninggalkan project.';

        return [
            'team_membership_id' => $this->membership->getKey(),
            'project_id' => $this->membership->project_id,
            'actor_id' => $this->actor->getKey(),
            'change' => $this->change,
            'message' => $message,
            'action_url' => route('projects.show', $this->membership->project_id),
            'action_label' => 'Lihat project',
            'purpose' => 'team_membership',
        ];
    }
}
