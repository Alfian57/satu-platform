<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\RecruiterContactRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CandidateContactRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly RecruiterContactRequest $contactRequest,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'contact_request_id' => $this->contactRequest->id,
            'organization_id' => $this->contactRequest->recruiter_organization_id,
            'purpose' => $this->contactRequest->purpose,
            'message' => 'Permintaan kontak portofolio baru dari recruiter terverifikasi.',
            'expires_at' => $this->contactRequest->expires_at->toIso8601String(),
        ];
    }
}
