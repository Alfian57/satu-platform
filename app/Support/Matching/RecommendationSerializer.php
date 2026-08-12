<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Enums\MatchingDimension;
use App\Models\Recommendation;

final class RecommendationSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function page(RecommendationQueryResult $result): array
    {
        return [
            'data' => array_map(
                fn (Recommendation $recommendation): array => $this->summary(
                    $recommendation,
                    $result->currentVersionId,
                ),
                $result->paginator->items(),
            ),
            'links' => $result->paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $result->paginator->currentPage(),
                'from' => $result->paginator->firstItem(),
                'last_page' => $result->paginator->lastPage(),
                'per_page' => $result->paginator->perPage(),
                'to' => $result->paginator->lastItem(),
                'total' => $result->paginator->total(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(
        Recommendation $recommendation,
        ?int $currentVersionId = null,
    ): array {
        $explanation = $recommendation->safeExplanation();
        $project = $recommendation->project;
        $version = $recommendation->matchRun?->version;

        return [
            'id' => $recommendation->getKey(),
            'project' => [
                'id' => $project?->getKey(),
                'title' => $project?->title,
                'status' => $project?->status?->value,
                'deadline' => $project?->deadline?->toIso8601String(),
            ],
            'score' => $explanation['total_score'],
            'components' => $explanation['component_scores'],
            'top_reasons' => $this->topReasons($explanation['reason_candidates']),
            'score_version' => [
                'id' => $version?->getKey(),
                'version' => $version?->version,
            ],
            'is_stale' => $recommendation->isStaleAgainst($currentVersionId),
            'expires_at' => $recommendation->expires_at?->toIso8601String(),
        ];
    }

    /**
     * @param  list<array{dimension: string, score: float, type: string, reason: string}>  $reasons
     * @return list<array{dimension: string, score: float, type: string, reason: string}>
     */
    private function topReasons(array $reasons): array
    {
        $reasons = array_values(array_filter(
            $reasons,
            static fn (array $reason): bool => $reason['dimension'] !== MatchingDimension::ConnectivityOpportunity->value,
        ));

        usort($reasons, static function (array $left, array $right): int {
            $scoreOrder = $right['score'] <=> $left['score'];

            return $scoreOrder !== 0
                ? $scoreOrder
                : strcmp($left['dimension'], $right['dimension']);
        });

        return array_slice($reasons, 0, 3);
    }
}
