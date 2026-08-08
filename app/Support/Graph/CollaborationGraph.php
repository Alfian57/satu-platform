<?php

namespace App\Support\Graph;

use Illuminate\Support\Carbon;

/**
 * The result of a collaboration graph projection.
 *
 * Contains the nodes (users), edges (collaboration links),
 * version used, and the time window applied. Deterministic:
 * given the same version and input events, the same graph is produced.
 *
 * @phpstan-type GraphArray array{version: string, institution_id: int, period_start: string, period_end: string, node_count: int, edge_count: int, nodes: list<array{user_id: int, event_count: int, degree: int}>, edges: list<array{source_id: int, target_id: int, weight: float, event_count: int}>}
 */
final readonly class CollaborationGraph
{
    /**
     * @param  list<GraphNode>  $nodes
     * @param  list<GraphEdge>  $edges
     */
    public function __construct(
        public string $version,
        public int $institutionId,
        public Carbon $periodStart,
        public Carbon $periodEnd,
        public array $nodes,
        public array $edges,
    ) {}

    public function nodeCount(): int
    {
        return count($this->nodes);
    }

    public function edgeCount(): int
    {
        return count($this->edges);
    }

    public function isEmpty(): bool
    {
        return $this->nodes === [] && $this->edges === [];
    }

    /**
     * @return GraphArray
     */
    public function toArray(): array
    {
        return [
            'version' => $this->version,
            'institution_id' => $this->institutionId,
            'period_start' => $this->periodStart->toIso8601String(),
            'period_end' => $this->periodEnd->toIso8601String(),
            'node_count' => $this->nodeCount(),
            'edge_count' => $this->edgeCount(),
            'nodes' => array_map(
                static fn (GraphNode $node): array => $node->toArray(),
                $this->nodes,
            ),
            'edges' => array_map(
                static fn (GraphEdge $edge): array => $edge->toArray(),
                $this->edges,
            ),
        ];
    }
}
