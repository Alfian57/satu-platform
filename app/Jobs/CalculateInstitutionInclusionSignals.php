<?php

namespace App\Jobs;

use App\Actions\Inclusion\CalculateInclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CalculateInstitutionInclusionSignals implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Institution $institution,
        public readonly string $period,
        public readonly bool $isSynthetic = false,
    ) {}

    public function handle(CalculateInclusionSignal $calculator): void
    {
        $version = InclusionSignalVersion::query()
            ->latest('id')
            ->first();

        if ($version === null) {
            return;
        }

        $memberships = InstitutionMembership::query()
            ->where('institution_id', $this->institution->id)
            ->where('status', 'verified')
            ->with('user')
            ->get();

        foreach ($memberships as $membership) {
            if ($membership->user !== null) {
                try {
                    $calculator->execute(
                        $this->institution,
                        $membership->user,
                        $this->period,
                        $version,
                        $this->isSynthetic,
                    );
                } catch (\Throwable) {
                    // Skip if feature inactive for institution or subject fails
                }
            }
        }
    }
}
