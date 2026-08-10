<?php

namespace App\Support\Notification;

interface WhatsAppGateway
{
    /**
     * Send a WhatsApp message via the provider.
     *
     * @param  array{target: string, message: string, countryCode?: string}  $payload
     * @return array{success: bool, provider_message_id?: string, error?: string, raw_response?: array<string, mixed>}
     */
    public function send(array $payload): array;
}
