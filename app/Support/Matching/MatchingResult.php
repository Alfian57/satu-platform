<?php

declare(strict_types=1);

namespace App\Support\Matching;

/**
 * Deterministic score output with a safe explanation projection.
 *
 * @phpstan-type ReasonCandidate array{dimension: string, score: float, type: string, reason: string}
 */
final readonly class MatchingResult
{
    /**
     * @param  array<string, float>  $components
     * @param  list<ReasonCandidate>  $reasonCandidates
     */
    public function __construct(
        public int $projectId,
        public array $components,
        public float $totalScore,
        public array $reasonCandidates,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'project_id' => $this->projectId,
            'components' => $this->components,
            'total_score' => $this->totalScore,
            'reason_candidates' => $this->reasonCandidates,
        ];
    }
}
