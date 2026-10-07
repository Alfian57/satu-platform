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
    public function execute(
        Institution $institution,
        User $subject,
        string $period,
        InclusionSignalVersion $version,
        bool $isSynthetic = false,
    ): InclusionSignal {
        if (! Feature::for($institution)->active('inclusion-signal-engine')) {
            throw new \Exception('Inclusion signal engine is not active for this institution.');
        }

        // Data sufficiency check
        $minEvents = $version->rules['min_collaboration_events'] ?? 5;

        // Total events involving the subject (either as actor or target)
        $eventQuery = CollaborationEvent::where('institution_id', $institution->id)
            ->where(function ($query) use ($subject) {
                $query->where('actor_id', $subject->id)
                    ->orWhere('target_id', $subject->id);
            });

        if ($isSynthetic) {
            $eventQuery->syntheticOnly();
        } else {
            $eventQuery->realOnly();
        }

        $eventCount = $eventQuery->count();

        $dataSufficiencyMet = $eventCount >= $minEvents;

        $isRestrictedCandidate = false;
        $evidenceSummary = [
            'event_count' => $eventCount,
            'threshold_used' => $minEvents,
            'is_synthetic' => $isSynthetic,
        ];

        if ($dataSufficiencyMet) {
            // Check if the user is targeted by others in collaboration
            $receivedQuery = CollaborationEvent::where('institution_id', $institution->id)
                ->where('target_id', $subject->id);

            if ($isSynthetic) {
                $receivedQuery->syntheticOnly();
            } else {
                $receivedQuery->realOnly();
            }

            $receivedCount = $receivedQuery->count();

            $evidenceSummary['received_count'] = $receivedCount;

            $threshold = $version->metrics['low_collaboration_threshold'] ?? 1;

            if ($receivedCount < $threshold) {
                $isRestrictedCandidate = true;
                $evidenceSummary['factor'] = 'Pengguna menerima lebih sedikit event kolaborasi daripada ambang batas yang dikonfigurasi.';
            } else {
                $evidenceSummary['factor'] = 'Pengguna memiliki event kolaborasi yang cukup.';
            }
        } else {
            $evidenceSummary['factor'] = 'Data tidak cukup untuk melakukan perhitungan sinyal inclusion.';
        }

        return DB::transaction(function () use ($institution, $subject, $version, $period, $dataSufficiencyMet, $isRestrictedCandidate, $evidenceSummary, $isSynthetic) {
            return InclusionSignal::create([
                'institution_id' => $institution->id,
                'subject_id' => $subject->id,
                'version_id' => $version->id,
                'period' => $period,
                'data_sufficiency_met' => $dataSufficiencyMet,
                'restricted_feature_state' => $isRestrictedCandidate,
                'evidence_summary' => $evidenceSummary,
                'is_synthetic' => $isSynthetic,
            ]);
        });
    }
}
