<?php

namespace App\Actions\Affiliations;

use App\Actions\Audit\AuditRecorder;
use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Actions\InstitutionMemberships\TransitionInstitutionMembership;
use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Exceptions\VerifiedPhoneRequired;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\InstitutionalIdentifier;
use Illuminate\Support\Facades\DB;

final class SubmitAffiliationRequest
{
    public function __construct(
        private readonly RequestInstitutionMembership $requestMembership,
        private readonly TransitionInstitutionMembership $transitionMembership,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $user, Institution $institution, string $nim): AffiliationRequest
    {
        $normalizedNim = InstitutionalIdentifier::normalize($nim);
        $nimHash = InstitutionalIdentifier::hash($normalizedNim);

        return DB::transaction(function () use (
            $user,
            $institution,
            $normalizedNim,
            $nimHash,
        ): AffiliationRequest {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->whereKey($user->getKey())
                ->firstOrFail();
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->firstOrFail();
            $phoneNumber = PhoneNumber::query()
                ->verified()
                ->whereBelongsTo($lockedUser)
                ->lockForUpdate()
                ->first();

            if ($phoneNumber === null) {
                throw new VerifiedPhoneRequired;
            }

            $activeRoster = InstitutionRoster::query()
                ->whereBelongsTo($lockedInstitution)
                ->active()
                ->lockForUpdate()
                ->latest('activated_at')
                ->latest('id')
                ->first();
            [$matchResult, $rosterRow] = $this->match(
                $activeRoster,
                $normalizedNim,
                $phoneNumber->number_hash,
            );

            $membership = $this->requestMembership->handle($lockedUser, $lockedInstitution);
            $request = AffiliationRequest::query()
                ->whereBelongsTo($lockedUser)
                ->whereBelongsTo($lockedInstitution)
                ->lockForUpdate()
                ->first();

            if (
                $membership->status === InstitutionMembershipStatus::Verified
                && $request?->status === AffiliationRequestStatus::Verified
            ) {
                return $request;
            }

            $membership->forceFill(['institutional_identifier' => $normalizedNim])->save();

            if (
                $request !== null
                && in_array($request->status, [
                    AffiliationRequestStatus::PendingReview,
                    AffiliationRequestStatus::Verified,
                ], true)
                && hash_equals($request->nim_hash, $nimHash)
                && $request->roster_id === $activeRoster?->getKey()
            ) {
                return $request;
            }

            $before = $request === null ? [] : [
                'request_id' => $request->getKey(),
                'status' => $request->status->value,
                'match_result' => $request->match_result->value,
                'roster_id' => $request->roster_id,
                'version' => $request->version,
            ];
            $requestStatus = $matchResult === AffiliationMatchResult::Exact
                ? AffiliationRequestStatus::Verified
                : AffiliationRequestStatus::PendingReview;

            if ($request === null) {
                $request = AffiliationRequest::query()->forceCreate([
                    'institution_id' => $lockedInstitution->getKey(),
                    'user_id' => $lockedUser->getKey(),
                    'institution_membership_id' => $membership->getKey(),
                    'roster_id' => $activeRoster?->getKey(),
                    'roster_row_id' => $rosterRow?->getKey(),
                    'nim_hash' => $nimHash,
                    'nim' => $normalizedNim,
                    'match_result' => $matchResult,
                    'status' => $requestStatus,
                    'version' => 1,
                    'submitted_at' => now(),
                    'resolved_at' => $requestStatus === AffiliationRequestStatus::Verified ? now() : null,
                ]);
            } else {
                $request->forceFill([
                    'roster_id' => $activeRoster?->getKey(),
                    'roster_row_id' => $rosterRow?->getKey(),
                    'nim_hash' => $nimHash,
                    'nim' => $normalizedNim,
                    'match_result' => $matchResult,
                    'status' => $requestStatus,
                    'version' => $request->version + 1,
                    'review_locked_by_id' => null,
                    'review_locked_at' => null,
                    'review_lock_expires_at' => null,
                    'submitted_at' => now(),
                    'resolved_at' => $requestStatus === AffiliationRequestStatus::Verified ? now() : null,
                ])->save();
            }

            if (
                $matchResult === AffiliationMatchResult::Exact
                && $membership->status !== InstitutionMembershipStatus::Verified
            ) {
                $membership = $this->transitionMembership->handle(
                    $membership,
                    InstitutionMembershipStatus::Verified,
                    InstitutionMembershipVerificationMethod::RosterExactMatch,
                );
            }

            $this->audit->record(
                operation: $matchResult === AffiliationMatchResult::Exact
                    ? 'affiliation.auto_verified'
                    : 'affiliation.submitted',
                auditable: $request,
                actor: $lockedUser,
                institution: $lockedInstitution,
                before: $before,
                after: [
                    'request_id' => $request->getKey(),
                    'membership_id' => $membership->getKey(),
                    'status' => $request->status->value,
                    'match_result' => $request->match_result->value,
                    'roster_id' => $request->roster_id,
                    'version' => $request->version,
                ],
            );

            return $request->refresh();
        }, attempts: 3);
    }

    /**
     * @return array{AffiliationMatchResult, InstitutionRosterRow|null}
     */
    private function match(
        ?InstitutionRoster $roster,
        string $normalizedNim,
        string $phoneHash,
    ): array {
        if ($roster === null) {
            return [AffiliationMatchResult::RosterUnavailable, null];
        }

        $rows = InstitutionRosterRow::query()
            ->whereBelongsTo($roster, 'roster')
            ->where('nim', $normalizedNim)
            ->orderBy('id')
            ->get(['id', 'roster_id', 'phone_hash', 'is_active']);

        if ($rows->isEmpty()) {
            return [AffiliationMatchResult::NoMatch, null];
        }

        if ($rows->count() > 1) {
            return [AffiliationMatchResult::Ambiguous, null];
        }

        $row = $rows->sole();

        if (! $row->is_active) {
            return [AffiliationMatchResult::Inactive, $row];
        }

        if (! hash_equals($row->phone_hash, $phoneHash)) {
            return [AffiliationMatchResult::Ambiguous, $row];
        }

        return [AffiliationMatchResult::Exact, $row];
    }
}
