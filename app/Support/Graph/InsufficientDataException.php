<?php

namespace App\Support\Graph;

use RuntimeException;

/**
 * Thrown when a graph projection cannot be built because the
 * available collaboration data does not meet the version's
 * data sufficiency thresholds.
 */
final class InsufficientDataException extends RuntimeException
{
    public function __construct(
        public readonly string $reason,
        public readonly int $actual,
        public readonly int $required,
    ) {
        parent::__construct(
            "Insufficient data for graph projection: {$reason} (actual: {$actual}, required: {$required})",
        );
    }
}
