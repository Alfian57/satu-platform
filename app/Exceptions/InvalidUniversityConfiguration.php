<?php

namespace App\Exceptions;

use RuntimeException;

final class InvalidUniversityConfiguration extends RuntimeException
{
    public function __construct(public readonly string $state, string $message)
    {
        parent::__construct($message);
    }
}
