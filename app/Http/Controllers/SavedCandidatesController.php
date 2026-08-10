<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Actions\Talent\FetchSavedCandidates;
use App\Actions\Talent\SaveCandidate;
use App\Actions\Talent\UnsaveCandidate;
use App\Enums\RecruiterEntitlementScope;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SavedCandidatesController extends Controller
{
    public function __construct(
        private readonly SaveCandidate $saveAction,
        private readonly UnsaveCandidate $unsaveAction,
        private readonly FetchSavedCandidates $fetchAction,
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
    ) {}

    /**
     * Display list of saved candidate projections for the recruiter's active organization.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        /** @var RecruiterMembership|null $membership */
        $membership = RecruiterMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $organization = $membership?->organization;

        if ($organization === null && ! $user->is_platform_admin) {
            return Inertia::render('talent/saved', [
                'candidates' => [
                    'data' => [],
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 25,
                ],
                'entitlement' => [
                    'has_entitlement' => false,
                    'status' => 'no_organization',
                ],
            ]);
        }

        /** @var RecruiterOrganization $activeOrg */
        $activeOrg = $organization ?? RecruiterOrganization::query()->firstOrCreate(
            ['name' => 'Platform Admin Org'],
            ['status' => 'verified']
        );

        $hasEntitlement = $this->verifyEntitlement->check(
            $activeOrg,
            RecruiterEntitlementScope::CandidateSearch
        );

        $candidatesData = [
            'data' => [],
            'total' => 0,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 25,
        ];

        if ($hasEntitlement) {
            try {
                $paginator = $this->fetchAction->execute(
                    recruiter: $user,
                    organization: $activeOrg,
                    perPage: 25,
                    page: is_numeric($request->query('page')) ? (int) $request->query('page') : 1,
                );

                $candidatesData = [
                    'data' => $paginator->items(),
                    'total' => $paginator->total(),
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                ];
            } catch (AuthorizationException) {
                $hasEntitlement = false;
            }
        }

        $activeEntitlement = $activeOrg->entitlements()
            ->where('status', 'active')
            ->first();

        return Inertia::render('talent/saved', [
            'candidates' => $candidatesData,
            'entitlement' => [
                'has_entitlement' => $hasEntitlement,
                'status' => $hasEntitlement ? 'active' : ($activeEntitlement ? 'expired' : 'missing'),
            ],
        ]);
    }

    /**
     * Save a candidate projection for the recruiter's active organization.
     */
    public function store(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        /** @var RecruiterMembership|null $membership */
        $membership = RecruiterMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $organization = $membership?->organization;

        if ($organization === null && ! $user->is_platform_admin) {
            abort(403, 'You are not an active member of a recruiter organization.');
        }

        /** @var RecruiterOrganization $activeOrg */
        $activeOrg = $organization ?? RecruiterOrganization::query()->firstOrCreate(
            ['name' => 'Platform Admin Org'],
            ['status' => 'verified']
        );

        try {
            $this->saveAction->execute(
                recruiter: $user,
                organization: $activeOrg,
                candidateProjectionId: $id,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            abort(404, $e->getMessage());
        }

        return back()->with('success', 'Candidate saved successfully.');
    }

    /**
     * Unsave a candidate projection for the recruiter's active organization.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        /** @var RecruiterMembership|null $membership */
        $membership = RecruiterMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $organization = $membership?->organization;

        if ($organization === null && ! $user->is_platform_admin) {
            abort(403, 'You are not an active member of a recruiter organization.');
        }

        /** @var RecruiterOrganization $activeOrg */
        $activeOrg = $organization ?? RecruiterOrganization::query()->firstOrCreate(
            ['name' => 'Platform Admin Org'],
            ['status' => 'verified']
        );

        try {
            $this->unsaveAction->execute(
                recruiter: $user,
                organization: $activeOrg,
                candidateProjectionId: $id,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        }

        return back()->with('success', 'Candidate unsaved successfully.');
    }
}
