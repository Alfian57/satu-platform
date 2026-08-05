<?php

namespace App\Http\Controllers;

use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Http\Requests\InstitutionMemberships\RequestInstitutionMembershipRequest;
use App\Models\Institution;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class InstitutionMembershipController extends Controller
{
    public function store(
        RequestInstitutionMembershipRequest $request,
        RequestInstitutionMembership $requestMembership,
    ): RedirectResponse {
        try {
            $membership = $requestMembership->handle(
                $request->user(),
                Institution::query()->findOrFail($request->integer('institution_id')),
            );
        } catch (AuthorizationException $exception) {
            if (! $request->header('X-Inertia')) {
                throw $exception;
            }

            return to_route('onboarding.show')
                ->with('onboarding_recovery', 'forbidden');
        }

        return to_route('onboarding.show')->with('membership_status', $membership->status->value);
    }
}
