<?php

use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SavedCandidatesController;
use App\Http\Controllers\TalentSearchController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('onboarding', [OnboardingController::class, 'show'])
        ->name('onboarding.show');

    Route::post('institution-memberships', [InstitutionMembershipController::class, 'store'])
        ->middleware('throttle:institution-membership-request')
        ->name('institution-memberships.store');

    Route::get('recruiter/talent/search', [TalentSearchController::class, 'index'])
        ->name('recruiter.talent.search');

    Route::get('recruiter/talent/saved', [SavedCandidatesController::class, 'index'])
        ->name('recruiter.talent.saved');

    Route::get('recruiter/talent/candidates/{id}', [TalentSearchController::class, 'show'])
        ->name('recruiter.talent.candidates.show');

    Route::post('recruiter/talent/candidates/{id}/save', [SavedCandidatesController::class, 'store'])
        ->name('recruiter.talent.candidates.save');

    Route::delete('recruiter/talent/candidates/{id}/save', [SavedCandidatesController::class, 'destroy'])
        ->name('recruiter.talent.candidates.unsave');
});

require __DIR__.'/settings.php';
