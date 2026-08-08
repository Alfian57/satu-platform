<?php

namespace App\Actions\Inclusion;

use App\Enums\InclusionSignalStatus;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Support\Graph\CollaborationGraph;
use App\Support\Inclusion\InclusionSignalVersion;
use App\Support\Inclusion\SignalDataSufficiencyException;
use Illuminate\Support\Collection;

/**
 * Evaluates a collaboration graph to generate inclusion signals.
 *
 * This Action reads a deterministic CollaborationGraph and applies
 * the thresholds defined in the InclusionSignalVersion. Candidates
 * that meet the isolation criteria are recorded as InclusionSignals
 * for human review.
 */
final class EvaluateInclusionSignals
{
    /**
     * Evaluate the graph and persist signals.
     *
     * @return Collection<int, InclusionSignal>
     *
     * @throws SignalDataSufficiencyException
     */
    public function handle(
        Institution $institution,
        InclusionSignalVersion $version,
        CollaborationGraph $graph,
        bool $isSynthetic = false,
    ): Collection {
        $this->checkDataSufficiency($institution, $graph);

        $signals = collect();

        foreach ($graph->nodes as $node) {
            if ($this->isCandidate($node, $version)) {
                $signal = InclusionSignal::query()
                    ->where('institution_id', $institution->getKey())
                    ->where('subject_id', $node->userId)
                    ->where('version', $version->version)
                    ->where('period_start', $graph->periodStart)
                    ->where('period_end', $graph->periodEnd)
                    ->first();

                if (! $signal) {
                    $signal = new InclusionSignal;
                    $signal->institution_id = $institution->getKey();
                    $signal->subject_id = $node->userId;
                    $signal->version = $version->version;
                    $signal->period_start = $graph->periodStart;
                    $signal->period_end = $graph->periodEnd;
                }

                $signal->status = InclusionSignalStatus::New;
                $signal->evidence_summary = [
                    'degree' => $node->degree,
                    'event_count' => $node->eventCount,
                    'thresholds' => [
                        'min_degree' => $version->minDegreeThreshold,
                        'min_events' => $version->minEventCount,
                        'max_events' => $version->maxEventCount,
                    ],
                ];
                $signal->is_synthetic = $isSynthetic;

                $signal->save();

                $signals->push($signal);
            }
        }

        return $signals;
    }

    /**
     * Check if the graph is suitable for evaluation.
     *
     * @throws SignalDataSufficiencyException
     */
    private function checkDataSufficiency(Institution $institution, CollaborationGraph $graph): void
    {
        if ($graph->institutionId !== $institution->getKey()) {
            throw new SignalDataSufficiencyException('Graph institution does not match target institution');
        }

        if ($graph->isEmpty()) {
            throw new SignalDataSufficiencyException('Graph is empty');
        }

        // Additional inclusion-specific sufficiency rules can be added here.
    }

    /**
     * Evaluate a single node against the version's thresholds.
     *
     * @param  array{userId: int, eventCount: int, degree: int}|mixed  $node
     */
    private function isCandidate(mixed $node, InclusionSignalVersion $version): bool
    {
        // $node is a GraphNode (which has public properties) or array if from toArray()
        $eventCount = is_array($node) ? $node['event_count'] : $node->eventCount;
        $degree = is_array($node) ? $node['degree'] : $node->degree;

        if ($eventCount < $version->minEventCount) {
            return false;
        }

        if ($version->maxEventCount !== null && $eventCount > $version->maxEventCount) {
            return false;
        }

        if ($degree >= $version->minDegreeThreshold) {
            return false;
        }

        return true;
    }
}
