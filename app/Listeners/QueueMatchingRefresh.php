<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Matching\RequestMatchingRefresh;
use App\Events\MatchingInputsChanged;
use App\Models\StudentProfile;
use App\Support\Matching\MatchingAvailability;

final class QueueMatchingRefresh
{
    public function __construct(private readonly RequestMatchingRefresh $requestRefresh, private readonly MatchingAvailability $availability) {}

    public function handle(MatchingInputsChanged $event): void
    {
        if (! $this->availability->enabled()) {
            return;
        }
        StudentProfile::query()->where('institution_id', $event->institutionId)
            ->when($event->candidateId !== null, fn ($profiles) => $profiles->where('user_id', $event->candidateId))
            ->select(['id', 'institution_id', 'user_id'])->chunkById(100, function ($profiles): void {
                foreach ($profiles as $profile) {
                    if ($this->availability->candidateAllowed($profile->institution_id, $profile->user_id)) {
                        $this->requestRefresh->handle($profile->institution_id, $profile->user_id);
                    }
                }
            });
    }
}
