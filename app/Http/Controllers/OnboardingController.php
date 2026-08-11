<?php

namespace App\Http\Controllers;

use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $memberships = $user
            ->institutionMemberships()
            ->with([
                'affiliationRequest:id,institution_membership_id,roster_id,status,submitted_at',
                'institution:id,name,status',
            ])
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->where('role', InstitutionMembershipRole::Student)
            ->latest('requested_at')
            ->latest('id')
            ->get();

        $membership = $memberships->first(
            fn (InstitutionMembership $membership): bool => $membership->status === InstitutionMembershipStatus::Verified,
        ) ?? $memberships->first();

        $affiliationRequest = $membership?->affiliationRequest;
        $activeRoster = $membership === null ? null : InstitutionRoster::query()
            ->whereBelongsTo($membership->institution)
            ->active()
            ->latest('activated_at')
            ->latest('id')
            ->first();
        $affiliationNeedsRefresh = $affiliationRequest?->isStaleAgainst($activeRoster) ?? false;
        $isLegacyRejectedMembership = $affiliationRequest === null
            && $membership?->status === InstitutionMembershipStatus::Unverified
            && $membership->last_review_outcome === InstitutionMembershipReviewOutcome::Rejected;
        $canRetry = $membership !== null
            && (
                $isLegacyRejectedMembership
                || (
                    $affiliationRequest !== null
                    && (
                        $affiliationNeedsRefresh
                        || in_array($affiliationRequest->status, [
                            AffiliationRequestStatus::RevisionRequired,
                            AffiliationRequestStatus::Rejected,
                        ], true)
                    )
                )
            )
            && $membership->institution->status === InstitutionStatus::Active;
        $membershipOutcome = InstitutionMembershipStatus::tryFrom(
            (string) $request->session()->get('membership_status', ''),
        );
        $affiliationOutcome = AffiliationRequestStatus::tryFrom(
            (string) $request->session()->get('affiliation_status', ''),
        );
        $submissionIssue = match ($request->session()->get('onboarding_recovery')) {
            'session_expired', 'forbidden', 'phone_required' => $request->session()->get('onboarding_recovery'),
            default => null,
        };
        $phoneNumber = $user->phoneNumber()->first();

        return Inertia::render('onboarding', [
            'account' => [
                'username' => $user->username,
            ],
            'phone' => $phoneNumber === null ? null : [
                'masked' => $phoneNumber->masked,
                'verified' => $phoneNumber->status->value === 'verified'
                    && $phoneNumber->verified_at !== null,
            ],
            'institutions' => Institution::query()
                ->where('status', InstitutionStatus::Active)
                ->orderBy('name')
                ->orderBy('id')
                ->get(['id', 'name'])
                ->map(fn (Institution $institution): array => [
                    'id' => $institution->getKey(),
                    'name' => $institution->name,
                ]),
            'membership' => $membership === null ? null : [
                'institutionId' => $membership->institution_id,
                'institutionName' => $membership->institution->name,
                'status' => $membership->status->value,
            ],
            'affiliation' => $affiliationRequest === null ? null : [
                'status' => $affiliationRequest->status->value,
                'submittedAt' => $affiliationRequest->submitted_at->toIso8601String(),
                'needsRefresh' => $affiliationNeedsRefresh,
            ],
            'canRequest' => $membership === null || $canRetry
                || (
                    $membership->status === InstitutionMembershipStatus::Unverified
                    && $affiliationRequest === null
                ),
            'canRetry' => $canRetry,
            'membershipOutcome' => $membershipOutcome?->value,
            'affiliationOutcome' => $affiliationOutcome?->value,
            'submissionIssue' => $submissionIssue,
        ]);
    }
}
