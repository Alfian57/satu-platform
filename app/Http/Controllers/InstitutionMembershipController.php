<?php

namespace App\Http\Controllers;

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Exceptions\VerifiedPhoneRequired;
use App\Http\Requests\InstitutionMemberships\RequestInstitutionMembershipRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class InstitutionMembershipController extends Controller
{
    public function store(
        RequestInstitutionMembershipRequest $request,
        SubmitAffiliationRequest $submitAffiliation,
        ResolveConfiguredUniversity $resolveUniversity,
    ): RedirectResponse {
        try {
            $validated = $request->validated();
            $academicProfile = array_intersect_key($validated, array_flip([
                'faculty',
                'study_program',
                'admission_year',
            ]));
            $university = $resolveUniversity->handle();
            if ($request->filled('institution_id') && $request->integer('institution_id') !== $university->getKey()) {
                throw ValidationException::withMessages([
                    'institution_id' => 'Pengaturan layanan berubah. Isian tidak dikirim. Periksa status terbaru sebelum melanjutkan.',
                ]);
            }
            $affiliationRequest = $submitAffiliation->handle(
                $request->user(),
                $university,
                (string) $validated['nim'],
                $academicProfile === [] ? null : $academicProfile,
            );
        } catch (InvalidUniversityConfiguration) {
            return to_route('dashboard')->with('onboarding_recovery', 'university_unavailable');
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
