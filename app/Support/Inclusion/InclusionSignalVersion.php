<?php

namespace App\Support\Inclusion;

/**
 * Immutable versioned configuration for inclusion signal generation.
 *
 * Defines the thresholds and rules to identify candidates for human review.
 * Deterministic: same version config with the same collaboration graph
 * produces the same set of signals.
 *
 * @phpstan-type VersionArray array{version: string, min_degree_threshold: int, min_event_count: int, max_event_count: int|null}
 */
final readonly class InclusionSignalVersion
{
    public function __construct(
        public string $version,
        public int $minDegreeThreshold,
        public int $minEventCount,
        public ?int $maxEventCount = null,
    ) {}

    /**
     * Create the initial default version (v1).
     * Rule: Identifies students with fewer than 2 connections (degree)
     * despite having at least 1 recorded collaboration event.
     */
    public static function v1(): self
    {
        return new self(
            version: '1.0.0',
            minDegreeThreshold: 2,
            minEventCount: 1,
            maxEventCount: null,
        );
    }

    /**
     * @return VersionArray
     */
    public function toArray(): array
    {
        return [
            'version' => $this->version,
            'min_degree_threshold' => $this->minDegreeThreshold,
            'min_event_count' => $this->minEventCount,
            'max_event_count' => $this->maxEventCount,
        ];
    }
}
