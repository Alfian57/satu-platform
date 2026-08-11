<?php

namespace App\Actions\Affiliations;

use App\Enums\AffiliationRequestStatus;
use App\Exceptions\AffiliationReviewLocked;
use App\Models\AffiliationRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class AcquireAffiliationReviewLock
{
    private const LOCK_MINUTES = 30;

    public function handle(AffiliationRequest $request, User $reviewer): AffiliationRequest
    {
        return DB::transaction(function () use ($request, $reviewer): AffiliationRequest {
            $lockedRequest = AffiliationRequest::query()
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->firstOrFail();

            Gate::forUser($reviewer)->authorize('review', $lockedRequest);

            if ($lockedRequest->status !== AffiliationRequestStatus::PendingReview) {
                throw new AffiliationReviewLocked('Only pending affiliation requests may be reviewed.');
            }

            if (
                $lockedRequest->isReviewLockActive()
                && $lockedRequest->review_locked_by_id !== $reviewer->getKey()
            ) {
                throw new AffiliationReviewLocked('This affiliation request is already being reviewed.');
            }

            $lockedRequest->forceFill([
                'review_locked_by_id' => $reviewer->getKey(),
                'review_locked_at' => now(),
                'review_lock_expires_at' => now()->addMinutes(self::LOCK_MINUTES),
            ])->save();

            return $lockedRequest->refresh();
        }, attempts: 3);
    }
}
