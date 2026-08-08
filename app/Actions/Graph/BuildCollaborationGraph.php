<?php

namespace App\Actions\Graph;

use App\Models\CollaborationEvent;
use App\Models\Institution;
use App\Support\Graph\CollaborationGraph;
use App\Support\Graph\GraphEdge;
use App\Support\Graph\GraphNode;
use App\Support\Graph\GraphProjectionVersion;
use App\Support\Graph\InsufficientDataException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Build a collaboration graph projection from activity metadata.
 *
 * This Action reads collaboration_events for a given institution and
 * time window, applies versioned edge rules, checks data sufficiency,
 * and produces a deterministic CollaborationGraph. The projection is
 * idempotent: same version, institution, and time window always
 * produce the same result from the same underlying data.
 *
 * Message content is never read or analyzed.
 */
final class BuildCollaborationGraph
{
    /**
     * Build the graph projection.
     *
     * @throws InsufficientDataException when data is below version thresholds
     */
    public function handle(
        Institution $institution,
        GraphProjectionVersion $version,
        ?Carbon $periodStart = null,
        ?Carbon $periodEnd = null,
    ): CollaborationGraph {
        $end = $periodEnd ?? Carbon::now();
        $start = $periodStart ?? $end->copy()->subDays($version->timeWindowDays);

        $events = $this->queryEvents($institution, $version, $start, $end);

        $this->checkDataSufficiency($events, $version);

        $edges = $this->buildEdges($events, $version);
        $nodes = $this->buildNodes($events, $edges);

        return new CollaborationGraph(
            version: $version->version,
            institutionId: $institution->getKey(),
            periodStart: $start,
            periodEnd: $end,
            nodes: array_values($nodes),
            edges: array_values($edges),
        );
    }

    /**
     * Query collaboration events scoped to institution, time window,
     * and event types defined in the version's edge rules.
     *
     * @return Collection<int, CollaborationEvent>
     */
    private function queryEvents(
        Institution $institution,
        GraphProjectionVersion $version,
        Carbon $start,
        Carbon $end,
    ): Collection {
        $allowedTypes = array_keys($version->edgeRules);

        return CollaborationEvent::query()
            ->forInstitution($institution)
            ->withinPeriod($start, $end)
            ->whereIn('event_type', $allowedTypes)
            ->orderBy('occurred_at')
            ->get();
    }

    /**
     * Verify the queried events meet the version's data sufficiency thresholds.
     *
     * @param  Collection<int, CollaborationEvent>  $events
     *
     * @throws InsufficientDataException
     */
    private function checkDataSufficiency(Collection $events, GraphProjectionVersion $version): void
    {
        $uniqueActors = $events->pluck('actor_id')->unique()->count();

        if ($uniqueActors < $version->minUniqueActors) {
            throw new InsufficientDataException(
                reason: 'unique actors below threshold',
                actual: $uniqueActors,
                required: $version->minUniqueActors,
            );
        }

        $eventsPerActor = $events->groupBy('actor_id')
            ->filter(fn (Collection $actorEvents): bool => $actorEvents->count() >= $version->minEventsPerActor);

        if ($eventsPerActor->isEmpty()) {
            throw new InsufficientDataException(
                reason: 'no actor meets minimum event threshold',
                actual: 0,
                required: $version->minEventsPerActor,
            );
        }
    }

    /**
     * Build edges from events using the version's edge rules.
     *
     * Events with a target_id create a bidirectional edge between
     * actor and target. Events without a target are counted for
     * node metrics but don't create edges.
     *
     * @param  Collection<int, CollaborationEvent>  $events
     * @return array<string, GraphEdge>
     */
    private function buildEdges(Collection $events, GraphProjectionVersion $version): array
    {
        /** @var array<string, array{source_id: int, target_id: int, weight: float, event_count: int}> $edgeMap */
        $edgeMap = [];

        foreach ($events as $event) {
            if ($event->target_id === null) {
                continue;
            }

            $weight = $version->weightFor($event->event_type->value);
            if ($weight === null) {
                continue;
            }

            $edgeKey = $this->normalizeEdgeKey($event->actor_id, $event->target_id);

            if (! isset($edgeMap[$edgeKey])) {
                [$sourceId, $targetId] = $this->normalizeEdgePair($event->actor_id, $event->target_id);
                $edgeMap[$edgeKey] = [
                    'source_id' => $sourceId,
                    'target_id' => $targetId,
                    'weight' => 0.0,
                    'event_count' => 0,
                ];
            }

            $edgeMap[$edgeKey]['weight'] += $weight;
            $edgeMap[$edgeKey]['event_count']++;
        }

        ksort($edgeMap);

        return array_map(
            static fn (array $data): GraphEdge => new GraphEdge(
                sourceId: $data['source_id'],
                targetId: $data['target_id'],
                weight: $data['weight'],
                eventCount: $data['event_count'],
            ),
            $edgeMap,
        );
    }

    /**
     * Build nodes from events and computed edges.
     *
     * @param  Collection<int, CollaborationEvent>  $events
     * @param  array<string, GraphEdge>  $edges
     * @return array<int, GraphNode>
     */
    private function buildNodes(Collection $events, array $edges): array
    {
        /** @var array<int, array{event_count: int, degree: int}> $nodeMap */
        $nodeMap = [];

        foreach ($events as $event) {
            if (! isset($nodeMap[$event->actor_id])) {
                $nodeMap[$event->actor_id] = ['event_count' => 0, 'degree' => 0];
            }
            $nodeMap[$event->actor_id]['event_count']++;

            if ($event->target_id !== null && ! isset($nodeMap[$event->target_id])) {
                $nodeMap[$event->target_id] = ['event_count' => 0, 'degree' => 0];
            }
        }

        foreach ($edges as $edge) {
            if (isset($nodeMap[$edge->sourceId])) {
                $nodeMap[$edge->sourceId]['degree']++;
            }
            if (isset($nodeMap[$edge->targetId])) {
                $nodeMap[$edge->targetId]['degree']++;
            }
        }

        $nodes = [];
        foreach ($nodeMap as $userId => $data) {
            $nodes[$userId] = new GraphNode(
                userId: $userId,
                eventCount: $data['event_count'],
                degree: $data['degree'],
            );
        }

        ksort($nodes);

        return $nodes;
    }

    /**
     * Normalize edge key so that (A, B) and (B, A) map to the same edge.
     */
    private function normalizeEdgeKey(int $a, int $b): string
    {
        return min($a, $b).'-'.max($a, $b);
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function normalizeEdgePair(int $a, int $b): array
    {
        return [min($a, $b), max($a, $b)];
    }
}
