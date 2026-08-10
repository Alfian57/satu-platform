<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Actions\Talent\CancelContactRequest;
use App\Actions\Talent\SendContactRequest;
use App\Enums\RecruiterEntitlementScope;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class RecruiterContactRequestController extends Controller
{
    public function __construct(
        private readonly SendContactRequest $sendAction,
        private readonly CancelContactRequest $cancelAction,
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
    ) {}

    /**
     * Display contact requests sent by recruiter organization.
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
            return Inertia::render('talent/contact-requests', [
                'requests' => [],
                'entitlement' => ['has_entitlement' => false],
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

        $requests = RecruiterContactRequest::query()
            ->where('recruiter_organization_id', $activeOrg->id)
            ->with(['candidateProjection.institution', 'candidateUser:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (RecruiterContactRequest $req) {
                return [
                    'id' => $req->id,
                    'purpose' => $req->purpose,
                    'message' => $req->message,
                    'status' => $req->status->value,
                    'created_at' => $req->created_at->toIso8601String(),
                    'expires_at' => $req->expires_at->toIso8601String(),
                    'responded_at' => $req->responded_at?->toIso8601String(),
                    'candidate_name' => $req->candidateUser->name,
                    'candidate_headline' => $req->candidateProjection->headline,
                ];
            });

        return Inertia::render('talent/contact-requests', [
            'requests' => $requests,
            'entitlement' => ['has_entitlement' => $hasEntitlement],
        ]);
    }

    /**
     * Store a new purpose-bound contact request.
     */
    public function store(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        $validated = $request->validate([
            'purpose' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

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
            $this->sendAction->execute(
                recruiter: $user,
                organization: $activeOrg,
                candidateProjectionId: $id,
                purpose: (string) $validated['purpose'],
                message: isset($validated['message']) ? (string) $validated['message'] : null,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['purpose' => $e->getMessage()]);
        }

        return back()->with('success', 'Contact request sent successfully.');
    }

    /**
     * Cancel a pending contact request.
     */
    public function cancel(Request $request, int $id): RedirectResponse
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
            $this->cancelAction->execute(
                recruiter: $user,
                organization: $activeOrg,
                contactRequestId: $id,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            abort(400, $e->getMessage());
        }

        return back()->with('success', 'Contact request canceled successfully.');
    }
}
