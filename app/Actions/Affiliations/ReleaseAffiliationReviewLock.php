<?php

namespace App\Actions\Affiliations;

use App\Exceptions\AffiliationReviewLocked;
use App\Models\AffiliationRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class ReleaseAffiliationReviewLock
{
    public function handle(AffiliationRequest $request, User $reviewer): AffiliationRequest
    {
        return DB::transaction(function () use ($request, $reviewer): AffiliationRequest {
            $lockedRequest = AffiliationRequest::query()
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->firstOrFail();

            Gate::forUser($reviewer)->authorize('review', $lockedRequest);

            if (
                $lockedRequest->isReviewLockActive()
                && $lockedRequest->review_locked_by_id !== $reviewer->getKey()
            ) {
                throw new AffiliationReviewLocked('This affiliation request is locked by another reviewer.');
            }

            $lockedRequest->forceFill([
                'review_locked_by_id' => null,
                'review_locked_at' => null,
                'review_lock_expires_at' => null,
            ])->save();

            return $lockedRequest->refresh();
        }, attempts: 3);
    }
}
