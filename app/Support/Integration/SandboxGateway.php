<?php

namespace App\Support\Integration;

use App\Models\IntegrationConnection;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class SandboxGateway implements AcademicGateway
{
    /**
     * Simulates sending a synchronization payload to the academic provider.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws ConnectionException
     */
    public function sync(IntegrationConnection $connection, array $payload): array
    {
        // For sandbox mode, we intercept specific payloads to simulate various states.
        $trigger = $payload['simulate'] ?? 'success';

        Http::fake([
            'sandbox.academic.test/*' => $this->getFakeResponse($trigger),
        ]);

        $response = Http::timeout(5)
            ->withToken($connection->encrypted_config['token'] ?? 'sandbox-token')
            ->post('https://sandbox.academic.test/api/sync', $payload);

        if ($response->serverError() || $response->clientError()) {
            $response->throw();
        }

        return $response->json() ?? [];
    }

    /**
     * @return callable|PromiseInterface
     */
    private function getFakeResponse(string $trigger)
    {
        return match ($trigger) {
            'timeout' => fn () => throw new ConnectionException('Connection timed out.'),
            'validation_error' => Http::response([
                'error' => 'validation_error',
                'message' => 'Invalid mapping payload.',
            ], 422),
            'auth_error' => Http::response([
                'error' => 'unauthorized',
                'message' => 'Provider rejected the credentials.',
            ], 401),
            'rate_limit' => Http::response([
                'error' => 'rate_limit',
                'message' => 'Too many requests.',
            ], 429),
            'duplicate' => Http::response([
                'error' => 'conflict',
                'message' => 'Record already exists.',
            ], 409),
            'degraded' => Http::response([
                'error' => 'server_error',
                'message' => 'Service degraded.',
            ], 503),
            default => Http::response([
                'status' => 'success',
                'reference' => 'SANDBOX-'.uniqid(),
            ], 200),
        };
    }
}
