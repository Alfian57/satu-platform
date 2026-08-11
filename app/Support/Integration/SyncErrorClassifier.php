<?php

namespace App\Support\Integration;

use App\Enums\IntegrationSyncErrorClass;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Throwable;

/**
 * Maps provider exceptions to a sync error class for retry decisions.
 */
final class SyncErrorClassifier
{
    public function classify(Throwable $e): IntegrationSyncErrorClass
    {
        if ($e instanceof ConnectionException) {
            return IntegrationSyncErrorClass::Timeout;
        }

        if ($e instanceof RequestException) {
            return $this->classifyHttpStatus($e->response->status());
        }

        return IntegrationSyncErrorClass::Permanent;
    }

    public function classifyHttpStatus(int $status): IntegrationSyncErrorClass
    {
        return match (true) {
            $status === 422 => IntegrationSyncErrorClass::Validation,
            $status === 409 => IntegrationSyncErrorClass::Duplicate,
            $status === 401, $status === 403 => IntegrationSyncErrorClass::Auth,
            $status === 429 => IntegrationSyncErrorClass::RateLimit,
            $status >= 500 => IntegrationSyncErrorClass::Transient,
            default => IntegrationSyncErrorClass::Permanent,
        };
    }
}
