<?php

namespace App\Http\Controllers;

use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
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
            ->with('institution:id,name,status')
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->where('role', InstitutionMembershipRole::Student)
            ->latest('requested_at')
            ->latest('id')
            ->get();

        $membership = $memberships->first(
            fn (InstitutionMembership $membership): bool => $membership->status === InstitutionMembershipStatus::Verified,
        ) ?? $memberships->first();

        $canRetry = $membership?->status === InstitutionMembershipStatus::Unverified
            && $membership->last_review_outcome === InstitutionMembershipReviewOutcome::Rejected
            && $membership->institution->status === InstitutionStatus::Active;
        $membershipOutcome = InstitutionMembershipStatus::tryFrom(
            (string) $request->session()->get('membership_status', ''),
        );
        $submissionIssue = match ($request->session()->get('onboarding_recovery')) {
            'session_expired', 'forbidden' => $request->session()->get('onboarding_recovery'),
            default => null,
        };

        return Inertia::render('onboarding', [
            'account' => [
                'username' => $user->username,
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
            'canRequest' => $membership === null
                || $membership->status === InstitutionMembershipStatus::Unverified,
            'canRetry' => $canRetry,
            'membershipOutcome' => $membershipOutcome?->value,
            'submissionIssue' => $submissionIssue,
        ]);
    }
}
