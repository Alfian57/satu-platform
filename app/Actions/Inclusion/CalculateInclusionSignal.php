<?php

namespace App\Actions\Inclusion;

use App\Models\CollaborationEvent;
use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Pennant\Feature;

class CalculateInclusionSignal
{
    /**
     * Calculate the inclusion signal for a given subject based on the specified version's rules and metrics.
     *
     *
     * @throws \Exception
     */
    public function execute(Institution $institution, User $subject, string $period, InclusionSignalVersion $version): InclusionSignal
    {
        if (! Feature::active('inclusion-signal-engine')) {
            throw new \Exception('Inclusion signal engine is not active.');
        }

        // Data sufficiency check
        $minEvents = $version->rules['min_collaboration_events'] ?? 5;

        // Total events involving the subject (either as actor or target)
        $eventCount = CollaborationEvent::where('institution_id', $institution->id)
            ->where(function ($query) use ($subject) {
                $query->where('actor_id', $subject->id)
                    ->orWhere('target_id', $subject->id);
            })
            ->count();

        $dataSufficiencyMet = $eventCount >= $minEvents;

        $isRestrictedCandidate = false;
        $evidenceSummary = [
            'event_count' => $eventCount,
            'threshold_used' => $minEvents,
        ];

        if ($dataSufficiencyMet) {
            // Check if the user is targeted by others in collaboration
            $receivedCount = CollaborationEvent::where('institution_id', $institution->id)
                ->where('target_id', $subject->id)
                ->count();

            $evidenceSummary['received_count'] = $receivedCount;

            $threshold = $version->metrics['low_collaboration_threshold'] ?? 1;

            if ($receivedCount < $threshold) {
                $isRestrictedCandidate = true;
                $evidenceSummary['factor'] = 'User has received fewer collaboration events than the configured threshold.';
            } else {
                $evidenceSummary['factor'] = 'User has sufficient collaboration events.';
            }
        } else {
            $evidenceSummary['factor'] = 'Insufficient data to perform inclusion signal calculation.';
        }

        return DB::transaction(function () use ($institution, $subject, $version, $period, $dataSufficiencyMet, $isRestrictedCandidate, $evidenceSummary) {
            return InclusionSignal::create([
                'institution_id' => $institution->id,
                'subject_id' => $subject->id,
                'version_id' => $version->id,
                'period' => $period,
                'data_sufficiency_met' => $dataSufficiencyMet,
                'restricted_feature_state' => $isRestrictedCandidate,
                'evidence_summary' => $evidenceSummary,
            ]);
        });
    }
}
