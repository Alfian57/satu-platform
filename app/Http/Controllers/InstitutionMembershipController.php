<?php

namespace App\Http\Controllers;

use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Http\Requests\InstitutionMemberships\RequestInstitutionMembershipRequest;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;

class InstitutionMembershipController extends Controller
{
    public function store(
        RequestInstitutionMembershipRequest $request,
        RequestInstitutionMembership $requestMembership,
    ): RedirectResponse {
        $membership = $requestMembership->handle(
            $request->user(),
            Institution::query()->findOrFail($request->integer('institution_id')),
        );

        return to_route('onboarding.show')->with('membership_status', $membership->status->value);
    }
}
