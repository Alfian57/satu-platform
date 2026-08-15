<?php

namespace App\Http\Controllers;

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Exceptions\VerifiedPhoneRequired;
use App\Http\Requests\InstitutionMemberships\RequestInstitutionMembershipRequest;
use App\Models\Institution;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class InstitutionMembershipController extends Controller
{
    public function store(
        RequestInstitutionMembershipRequest $request,
        SubmitAffiliationRequest $submitAffiliation,
    ): RedirectResponse {
        try {
            $affiliationRequest = $submitAffiliation->handle(
                $request->user(),
                Institution::query()->findOrFail($request->integer('institution_id')),
                $request->string('nim')->toString(),
            );
        } catch (VerifiedPhoneRequired) {
            return to_route('dashboard')
                ->with('onboarding_recovery', 'phone_required');
        } catch (AuthorizationException $exception) {
            if (! $request->header('X-Inertia')) {
                throw $exception;
            }

            return to_route('dashboard')
                ->with('onboarding_recovery', 'forbidden');
        }

        return to_route('dashboard')
            ->with('membership_status', $affiliationRequest->membership->status->value)
            ->with('affiliation_status', $affiliationRequest->status->value);
    }
}
