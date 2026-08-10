<?php

use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
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
});

require __DIR__.'/settings.php';
