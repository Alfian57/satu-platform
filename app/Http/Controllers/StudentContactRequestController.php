<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Talent\RespondContactRequest;
use App\Models\RecruiterContactRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class StudentContactRequestController extends Controller
{
    public function __construct(
        private readonly RespondContactRequest $respondAction,
    ) {}

    /**
     * Display student's received recruiter contact requests.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        $requests = RecruiterContactRequest::query()
            ->where('candidate_user_id', $user->id)
            ->with(['organization:id,name,industry', 'recruiterUser:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (RecruiterContactRequest $req) {
                return [
                    'id' => $req->id,
                    'organization_name' => $req->organization->name,
                    'recruiter_name' => $req->recruiterUser->name,
                    'purpose' => $req->purpose,
                    'message' => $req->message,
                    'status' => $req->status->value,
                    'created_at' => $req->created_at->toIso8601String(),
                    'expires_at' => $req->expires_at->toIso8601String(),
                    'responded_at' => $req->responded_at?->toIso8601String(),
                ];
            });

        return Inertia::render('student/contact-requests', [
            'requests' => $requests,
        ]);
    }

    /**
     * Student accepts a recruiter contact request.
     */
    public function accept(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        try {
            $this->respondAction->execute(
                candidateUser: $user,
                contactRequestId: $id,
                accept: true,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['request' => $e->getMessage()]);
        }

        return back()->with('success', 'Contact request accepted.');
    }

    /**
     * Student declines a recruiter contact request.
     */
    public function decline(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        try {
            $this->respondAction->execute(
                candidateUser: $user,
                contactRequestId: $id,
                accept: false,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['request' => $e->getMessage()]);
        }

        return back()->with('success', 'Contact request declined.');
    }
}
