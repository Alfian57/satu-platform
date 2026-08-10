<?php

use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\RecruiterContactRequestController;
use App\Http\Controllers\SavedCandidatesController;
use App\Http\Controllers\StudentContactRequestController;
use App\Http\Controllers\TalentSearchController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('recruiter/talent')->name('recruiter.talent.')->group(function () {
        // Index page for saved candidates
        Route::get('saved', [SavedCandidatesController::class, 'index'])
            ->name('saved');

        // Save candidate
        Route::post('candidates/{id}/save', [SavedCandidatesController::class, 'store'])
            ->name('candidates.save');

        // Unsave candidate
        Route::delete('candidates/{id}/unsave', [SavedCandidatesController::class, 'destroy'])
            ->name('candidates.unsave');
    });
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('onboarding', [OnboardingController::class, 'show'])
        ->name('onboarding.show');

    Route::post('institution-memberships', [InstitutionMembershipController::class, 'store'])
        ->middleware('throttle:institution-membership-request')
        ->name('institution-memberships.store');

    Route::get('recruiter/talent/search', [TalentSearchController::class, 'index'])
        ->name('recruiter.talent.search');

    Route::get('recruiter/talent/contact-requests', [RecruiterContactRequestController::class, 'index'])
        ->name('recruiter.talent.contact-requests.index');

    Route::get('recruiter/talent/candidates/{id}', [TalentSearchController::class, 'show'])
        ->name('recruiter.talent.candidates.show');

    Route::get('notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.mark-read');

    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->name('notifications.mark-all-read');

    Route::get('notifications/{id}/navigate', [NotificationController::class, 'navigate'])
        ->name('notifications.navigate');

    Route::post('notification-preferences', [NotificationController::class, 'updatePreference'])
        ->name('notification-preferences.update');

    Route::post('recruiter/talent/candidates/{id}/contact', [RecruiterContactRequestController::class, 'store'])
        ->name('recruiter.talent.candidates.contact');

    Route::delete('recruiter/talent/contact-requests/{id}', [RecruiterContactRequestController::class, 'cancel'])
        ->name('recruiter.talent.contact-requests.cancel');

    Route::get('student/contact-requests', [StudentContactRequestController::class, 'index'])
        ->name('student.contact-requests.index');

    Route::post('student/contact-requests/{id}/accept', [StudentContactRequestController::class, 'accept'])
        ->name('student.contact-requests.accept');

    Route::post('student/contact-requests/{id}/decline', [StudentContactRequestController::class, 'decline'])
        ->name('student.contact-requests.decline');
});

require __DIR__.'/settings.php';
