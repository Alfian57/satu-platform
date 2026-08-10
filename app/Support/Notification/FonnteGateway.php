<?php

namespace App\Support\Notification;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class FonnteGateway implements WhatsAppGateway
{
    private const API_URL = 'https://api.fonnte.com/send';

    private const TIMEOUT = 15;

    private const RETRY_ATTEMPTS = 2;

    private const RETRY_DELAY = 500;

    public function __construct(
        private readonly string $token,
    ) {}

    public function send(array $payload): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->retry(self::RETRY_ATTEMPTS, self::RETRY_DELAY)
                ->withHeaders([
                    'Authorization' => $this->token,
                ])
                ->asForm()
                ->post(self::API_URL, [
                    'target' => $payload['target'],
                    'message' => $payload['message'],
                    'countryCode' => $payload['countryCode'] ?? '62',
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'provider_message_id' => (string) ($response->json('id') ?? ''),
                    'raw_response' => $response->json(),
                ];
            }

            Log::warning('Fonnte API returned non-success status', [
                'status' => $response->status(),
                'body' => $this->sanitizeBody($response->body()),
            ]);

            return [
                'success' => false,
                'error' => 'Provider returned status '.$response->status(),
                'raw_response' => $response->json(),
            ];

        } catch (ConnectionException $e) {
            Log::error('Fonnte connection failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Connection failed: timeout or network error',
            ];

        } catch (RequestException $e) {
            Log::error('Fonnte request failed', [
                'status' => $e->response !== null ? $e->response->status() : null,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Request failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Sanitize response body to prevent leaking secrets or full messages.
     */
    private function sanitizeBody(string $body): string
    {
        $data = json_decode($body, true);

        if (! is_array($data)) {
            return mb_substr($body, 0, 200);
        }

        unset($data['text'], $data['message']);

        return json_encode($data, JSON_THROW_ON_ERROR);
    }
}
