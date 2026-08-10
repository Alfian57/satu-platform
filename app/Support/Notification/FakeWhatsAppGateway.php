<?php

namespace App\Support\Notification;

final class FakeWhatsAppGateway implements WhatsAppGateway
{
    /**
     * @var array<int, array<string, mixed>>
     */
    private array $sentMessages = [];

    /**
     * Control flag for injecting failures.
     */
    public bool $shouldFail = false;

    public bool $shouldTimeout = false;

    public function send(array $payload): array
    {
        if ($this->shouldTimeout) {
            return [
                'success' => false,
                'error' => 'Connection failed: timeout or network error',
            ];
        }

        if ($this->shouldFail) {
            return [
                'success' => false,
                'error' => 'Provider returned status 500',
            ];
        }

        $providerId = 'fake_'.bin2hex(random_bytes(8));

        $this->sentMessages[] = [
            'provider_message_id' => $providerId,
            'target' => $payload['target'],
            'message' => $payload['message'],
        ];

        return [
            'success' => true,
            'provider_message_id' => $providerId,
            'raw_response' => ['status' => 'sent'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sentMessages(): array
    {
        return $this->sentMessages;
    }

    public function reset(): void
    {
        $this->sentMessages = [];
        $this->shouldFail = false;
        $this->shouldTimeout = false;
    }
}
