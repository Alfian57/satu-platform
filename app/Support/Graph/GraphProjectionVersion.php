<?php

namespace App\Support\Graph;

use App\Enums\CollaborationEventType;

/**
 * Immutable versioned configuration for graph projection rules.
 *
 * Defines which event types create edges, their weights,
 * and data sufficiency thresholds. Deterministic: same version
 * config with same input data produces the same graph.
 *
 * @phpstan-type EdgeRuleArray array{weight: float}
 * @phpstan-type VersionArray array{version: string, edge_rules: array<string, EdgeRuleArray>, min_events_per_actor: int, min_unique_actors: int, time_window_days: int}
 */
final readonly class GraphProjectionVersion
{
    /**
     * @param  array<string, EdgeRuleArray>  $edgeRules  Map of event_type -> {weight}
     */
    public function __construct(
        public string $version,
        public array $edgeRules,
        public int $minEventsPerActor,
        public int $minUniqueActors,
        public int $timeWindowDays,
    ) {}

    /**
     * Create the initial default version (v1).
     */
    public static function v1(): self
    {
        return new self(
            version: '1.0.0',
            edgeRules: [
                CollaborationEventType::TeamJoined->value => ['weight' => 1.0],
                CollaborationEventType::TaskCompleted->value => ['weight' => 1.5],
                CollaborationEventType::ProjectContributed->value => ['weight' => 1.0],
                CollaborationEventType::PeerReviewed->value => ['weight' => 0.5],
            ],
            minEventsPerActor: 3,
            minUniqueActors: 2,
            timeWindowDays: 90,
        );
    }

    /**
     * Check whether an event type produces edges in this version.
     */
    public function hasEdgeRule(string $eventType): bool
    {
        return isset($this->edgeRules[$eventType]);
    }

    /**
     * Get the weight for an event type, or null if not mapped.
     */
    public function weightFor(string $eventType): ?float
    {
        return $this->edgeRules[$eventType]['weight'] ?? null;
    }

    /**
     * @return VersionArray
     */
    public function toArray(): array
    {
        return [
            'version' => $this->version,
            'edge_rules' => $this->edgeRules,
            'min_events_per_actor' => $this->minEventsPerActor,
            'min_unique_actors' => $this->minUniqueActors,
            'time_window_days' => $this->timeWindowDays,
        ];
    }
}
