<?php

namespace App\Actions\Affiliations;

use App\Actions\Audit\AuditRecorder;
use App\Actions\InstitutionMemberships\ApproveInstitutionMembership;
use App\Actions\InstitutionMemberships\RejectInstitutionMembership;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Exceptions\AffiliationReviewLocked;
use App\Exceptions\StaleAffiliationDecision;
use App\Models\AffiliationRequest;
use App\Models\AffiliationReview;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class ReviewAffiliationRequest
{
    public const POLICY_VERSION = 'affiliation-review-v1';

    public function __construct(
        private readonly ApproveInstitutionMembership $approveMembership,
        private readonly RejectInstitutionMembership $rejectMembership,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        AffiliationRequest $request,
        User $reviewer,
        AffiliationReviewDecision $decision,
        AffiliationReviewReason $reason,
        int $expectedVersion,
        ?string $note = null,
    ): AffiliationReview {
        $note = $this->validatedNote($note);
        $this->ensureReasonMatchesDecision($decision, $reason);

        return DB::transaction(function () use (
            $request,
            $reviewer,
            $decision,
            $reason,
            $expectedVersion,
            $note,
        ): AffiliationReview {
            $lockedRequest = AffiliationRequest::query()
                ->with('membership')
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->firstOrFail();
            $institution = Institution::query()
                ->whereKey($lockedRequest->institution_id)
                ->firstOrFail();

            Gate::forUser($reviewer)->authorize('review', $lockedRequest);

            if (
                ! $lockedRequest->isReviewLockActive()
                || $lockedRequest->review_locked_by_id !== $reviewer->getKey()
            ) {
                throw new AffiliationReviewLocked('Acquire the review lock before saving a decision.');
            }

            if ($lockedRequest->version !== $expectedVersion) {
                throw new StaleAffiliationDecision('The affiliation request changed before this decision was saved.');
            }

            $activeRoster = InstitutionRoster::query()
                ->whereBelongsTo($institution)
                ->active()
                ->latest('activated_at')
                ->latest('id')
                ->first();

            if ($lockedRequest->isStaleAgainst($activeRoster)) {
                throw new StaleAffiliationDecision('The roster changed before this decision was saved.');
            }

            $previousStatus = $lockedRequest->status;
            $newStatus = match ($decision) {
                AffiliationReviewDecision::Approve => AffiliationRequestStatus::Verified,
                AffiliationReviewDecision::RequestRevision => AffiliationRequestStatus::RevisionRequired,
                AffiliationReviewDecision::Reject => AffiliationRequestStatus::Rejected,
            };

            match ($decision) {
                AffiliationReviewDecision::Approve => $this->approveMembership->handle(
                    $lockedRequest->membership,
                    $reviewer,
                    $reason->value,
                ),
                AffiliationReviewDecision::Reject => $this->rejectMembership->handle(
                    $lockedRequest->membership,
                    $reviewer,
                    $reason->value,
                ),
                AffiliationReviewDecision::RequestRevision => null,
            };

            $review = AffiliationReview::query()->forceCreate([
                'affiliation_request_id' => $lockedRequest->getKey(),
                'institution_id' => $lockedRequest->institution_id,
                'reviewer_id' => $reviewer->getKey(),
                'decision' => $decision,
                'reason_code' => $reason,
                'note' => $note,
                'policy_version' => self::POLICY_VERSION,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'request_version' => $expectedVersion,
            ]);

            $lockedRequest->forceFill([
                'status' => $newStatus,
                'version' => $lockedRequest->version + 1,
                'review_locked_by_id' => null,
                'review_locked_at' => null,
                'review_lock_expires_at' => null,
                'resolved_at' => now(),
            ])->save();

            $this->audit->record(
                operation: 'affiliation.reviewed',
                auditable: $lockedRequest,
                actor: $reviewer,
                institution: $institution,
                before: [
                    'request_id' => $lockedRequest->getKey(),
                    'status' => $previousStatus->value,
                    'version' => $expectedVersion,
                ],
                after: [
                    'request_id' => $lockedRequest->getKey(),
                    'review_id' => $review->getKey(),
                    'status' => $newStatus->value,
                    'decision' => $decision->value,
                    'reason_code' => $reason->value,
                    'policy_version' => self::POLICY_VERSION,
                    'version' => $lockedRequest->version,
                ],
                reason: $reason->value,
            );

            return $review;
        }, attempts: 3);
    }

    private function validatedNote(?string $note): ?string
    {
        if ($note === null) {
            return null;
        }

        $note = (string) Str::of($note)->squish();

        if ($note === '') {
            return null;
        }

        if (Str::length($note) > 1000) {
            throw new InvalidArgumentException('A review note may not exceed 1000 characters.');
        }

        return $note;
    }

    private function ensureReasonMatchesDecision(
        AffiliationReviewDecision $decision,
        AffiliationReviewReason $reason,
    ): void {
        $allowed = match ($decision) {
            AffiliationReviewDecision::Approve => [
                AffiliationReviewReason::RecordsConfirmed,
            ],
            AffiliationReviewDecision::RequestRevision => [
                AffiliationReviewReason::NimCorrectionRequired,
                AffiliationReviewReason::PhoneCorrectionRequired,
                AffiliationReviewReason::SupportingEvidenceRequired,
            ],
            AffiliationReviewDecision::Reject => [
                AffiliationReviewReason::NotAffiliated,
            ],
        };

        if (! in_array($reason, $allowed, true)) {
            throw new InvalidArgumentException('The review reason does not match the decision.');
        }
    }
}
