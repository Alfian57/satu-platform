<?php

namespace App\Exceptions;

use App\Enums\IntegrationSyncErrorClass;
use RuntimeException;

final class SyncRetryableException extends RuntimeException
{
    public function __construct(
        public readonly IntegrationSyncErrorClass $errorClass,
        string $message,
    ) {
        parent::__construct($message);
    }
}
