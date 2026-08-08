<?php

namespace App\Support\Inclusion;

use RuntimeException;

/**
 * Thrown when the signal engine cannot evaluate the graph because
 * the provided graph does not meet data sufficiency requirements
 * for this inclusion version.
 */
final class SignalDataSufficiencyException extends RuntimeException
{
    public function __construct(
        public readonly string $reason,
    ) {
        parent::__construct(
            "Inclusion signal data sufficiency failed: {$reason}",
        );
    }
}
