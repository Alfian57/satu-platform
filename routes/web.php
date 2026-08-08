<?php

use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Platform\RecruiterEvidenceProjectionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('onboarding', [OnboardingController::class, 'show'])
        ->name('onboarding.show');

    Route::post('institution-memberships', [InstitutionMembershipController::class, 'store'])
        ->middleware('throttle:institution-membership-request')
        ->name('institution-memberships.store');

    Route::get('platform/recruiter-organizations/{organization}/evidence/{filename}', [RecruiterEvidenceProjectionController::class, 'show'])
        ->name('platform.recruiter-organizations.evidence.show');
});

require __DIR__.'/settings.php';
