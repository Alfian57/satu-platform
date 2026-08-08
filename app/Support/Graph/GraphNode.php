<?php

namespace App\Support\Graph;

/**
 * A node in the collaboration graph representing a user.
 *
 * @phpstan-type GraphNodeArray array{user_id: int, event_count: int, degree: int}
 */
final readonly class GraphNode
{
    public function __construct(
        public int $userId,
        public int $eventCount,
        public int $degree,
    ) {}

    /**
     * @return GraphNodeArray
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'event_count' => $this->eventCount,
            'degree' => $this->degree,
        ];
    }
}
