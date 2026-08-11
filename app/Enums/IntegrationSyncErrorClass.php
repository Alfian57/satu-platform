<?php

namespace App\Enums;

/**
 * Classifies a provider failure for retry and dead-letter decisions.
 */
enum IntegrationSyncErrorClass: string
{
    case Timeout = 'timeout';
    case Validation = 'validation';
    case Duplicate = 'duplicate';
    case Auth = 'auth';
    case RateLimit = 'rate_limit';
    case Transient = 'transient';
    case Permanent = 'permanent';

    public function retryable(): bool
    {
        return match ($this) {
            self::Timeout, self::RateLimit, self::Transient => true,
            default => false,
        };
    }
}
