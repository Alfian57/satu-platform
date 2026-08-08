<?php

namespace App\Support\Graph;

/**
 * An edge in the collaboration graph connecting two users.
 *
 * @phpstan-type GraphEdgeArray array{source_id: int, target_id: int, weight: float, event_count: int}
 */
final readonly class GraphEdge
{
    public function __construct(
        public int $sourceId,
        public int $targetId,
        public float $weight,
        public int $eventCount,
    ) {}

    /**
     * @return GraphEdgeArray
     */
    public function toArray(): array
    {
        return [
            'source_id' => $this->sourceId,
            'target_id' => $this->targetId,
            'weight' => $this->weight,
            'event_count' => $this->eventCount,
        ];
    }
}
