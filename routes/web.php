<?php

use App\Http\Controllers\AcademicCreditMappingController;
use App\Http\Controllers\AcademicIntegrationController;
use App\Http\Controllers\AffiliationReviewController;
use App\Http\Controllers\Auth\AuthFlowController;
use App\Http\Controllers\CampusContributionReviewController;
use App\Http\Controllers\CampusInclusionController;
use App\Http\Controllers\CampusOverviewController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\ContributionPageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PortfolioEntryController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDiscussionController;
use App\Http\Controllers\ProjectWorkspaceController;
use App\Http\Controllers\RecommendationFeedbackController;
use App\Http\Controllers\RecruiterContactRequestController;
use App\Http\Controllers\RosterImportController;
use App\Http\Controllers\SavedCandidatesController;
use App\Http\Controllers\SkillTaxonomyController;
use App\Http\Controllers\StudentContactRequestController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\TalentSearchController;
use App\Http\Controllers\TeamTransitionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('register/verify', [AuthFlowController::class, 'showRegistrationVerification'])
        ->name('register.otp');

    Route::post('register/otp', [AuthFlowController::class, 'startRegistration'])
        ->name('register.start');

    Route::post('register/verify', [AuthFlowController::class, 'verifyRegistration'])
        ->name('register.otp.verify');

    Route::post('register/otp/resend', [AuthFlowController::class, 'resendRegistration'])
        ->name('register.otp.resend');

    Route::get('recover', [AuthFlowController::class, 'showRecovery'])
        ->name('recover');

    Route::post('recover', [AuthFlowController::class, 'startRecovery'])
        ->name('recover.start');

    Route::get('recover/verify', [AuthFlowController::class, 'showRecoveryVerification'])
        ->name('recover.otp');

    Route::post('recover/verify', [AuthFlowController::class, 'verifyRecovery'])
        ->name('recover.otp.verify');

    Route::post('recover/otp/resend', [AuthFlowController::class, 'resendRecovery'])
        ->name('recover.otp.resend');

    Route::get('recover/reset', [AuthFlowController::class, 'showRecoveryReset'])
        ->name('recover.reset');

    Route::post('recover/reset', [AuthFlowController::class, 'resetRecoveredPassword'])
        ->name('recover.password.update');
});

Route::get('invitation/{token}', [AuthFlowController::class, 'showInvitation'])
    ->name('invitation.show');

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
    Route::get('dashboard', DashboardController::class)
        ->name('dashboard');

    Route::prefix('dashboard/recommendations/{recommendation}')
        ->name('dashboard.recommendations.')
        ->group(function () {
            Route::post('hide', [RecommendationFeedbackController::class, 'hide'])
                ->name('hide');
            Route::post('not-relevant', [RecommendationFeedbackController::class, 'notRelevant'])
                ->name('not-relevant');
            Route::post('profile-fix', [RecommendationFeedbackController::class, 'profileFix'])
                ->name('profile-fix');
        });

    Route::prefix('projects')->name('projects.')->group(function () {
        Route::get('/', [ProjectController::class, 'index'])
            ->name('index');
        Route::get('/create', [ProjectController::class, 'create'])
            ->name('create');
        Route::post('/', [ProjectController::class, 'store'])
            ->name('store');

        Route::scopeBindings()->prefix('{project}/contributions')->group(function () {
            Route::post('/', [ContributionController::class, 'store'])
                ->name('contributions.store');
        });

        Route::scopeBindings()->prefix('{project}/workspace')->group(function () {
            Route::get('/', [ProjectWorkspaceController::class, 'show'])
                ->name('workspace');
            Route::get('discussions', [ProjectDiscussionController::class, 'index'])
                ->name('workspace.discussions.index');
            Route::post('discussions', [ProjectDiscussionController::class, 'store'])
                ->name('workspace.discussions.store');
            Route::patch('discussions/{message}', [ProjectDiscussionController::class, 'update'])
                ->name('workspace.discussions.update');
            Route::delete('discussions/{message}', [ProjectDiscussionController::class, 'destroy'])
                ->name('workspace.discussions.destroy');
            Route::post('attachments', [ProjectAttachmentController::class, 'store'])
                ->name('workspace.attachments.store');
            Route::get('attachments/{attachment}', [ProjectAttachmentController::class, 'download'])
                ->name('workspace.attachments.download');
            Route::get('attachments/{attachment}/preview', [ProjectAttachmentController::class, 'preview'])
                ->name('workspace.attachments.preview');
            Route::delete('attachments/{attachment}', [ProjectAttachmentController::class, 'destroy'])
                ->name('workspace.attachments.destroy');
            Route::post('tasks', [ProjectWorkspaceController::class, 'store'])
                ->name('workspace.tasks.store');
            Route::patch('tasks/{task}', [ProjectWorkspaceController::class, 'update'])
                ->name('workspace.tasks.update');
            Route::post('tasks/{task}/status', [ProjectWorkspaceController::class, 'transition'])
                ->name('workspace.tasks.transition');
            Route::post('tasks/{task}/assignments', [ProjectWorkspaceController::class, 'assign'])
                ->name('workspace.tasks.assign');
            Route::delete('tasks/{task}/assignments', [ProjectWorkspaceController::class, 'unassign'])
                ->name('workspace.tasks.unassign');
            Route::delete('tasks/{task}', [ProjectWorkspaceController::class, 'destroy'])
                ->name('workspace.tasks.destroy');
        });

        Route::get('/{project}/edit', [ProjectController::class, 'edit'])
            ->name('edit');
        Route::get('/{project}', [ProjectController::class, 'show'])
            ->name('show');
        Route::patch('/{project}', [ProjectController::class, 'update'])
            ->name('update');
        Route::post('/{project}/open', [ProjectController::class, 'open'])
            ->name('open');
        Route::post('/{project}/cancel', [ProjectController::class, 'cancel'])
            ->name('cancel');
        Route::post('/{project}/archive', [ProjectController::class, 'archive'])
            ->name('archive');
        Route::post('/{project}/invitations', [TeamTransitionController::class, 'invite'])
            ->name('invitations.store');
        Route::post('/{project}/join-requests', [TeamTransitionController::class, 'requestJoin'])
            ->name('join-requests.store');
    });

    Route::prefix('contributions')->name('contributions.')->group(function () {
        Route::get('/', [ContributionPageController::class, 'index'])
            ->name('index');
        Route::get('create', [ContributionPageController::class, 'create'])
            ->name('create');
        Route::get('{contribution}', [ContributionPageController::class, 'show'])
            ->name('show');
        Route::post('{contribution}/evidence', [ContributionController::class, 'linkEvidence'])
            ->name('evidence.store');
        Route::post('{contribution}/submit', [ContributionController::class, 'submit'])
            ->name('submit');
        Route::post('{contribution}/review', [ContributionController::class, 'review'])
            ->name('reviews.store');
        Route::post('{contribution}/revision', [ContributionController::class, 'revise'])
            ->name('revisions.store');
    });

    Route::post('team-invitations/{teamInvitation}/accept', [TeamTransitionController::class, 'acceptInvitation'])
        ->name('team.invitations.accept');
    Route::post('team-invitations/{teamInvitation}/reject', [TeamTransitionController::class, 'rejectInvitation'])
        ->name('team.invitations.reject');
    Route::post('team-invitations/{teamInvitation}/revoke', [TeamTransitionController::class, 'revokeInvitation'])
        ->name('team.invitations.revoke');
    Route::post('team-join-requests/{teamJoinRequest}/accept', [TeamTransitionController::class, 'acceptJoinRequest'])
        ->name('team.join-requests.accept');
    Route::post('team-join-requests/{teamJoinRequest}/reject', [TeamTransitionController::class, 'rejectJoinRequest'])
        ->name('team.join-requests.reject');
    Route::post('team-memberships/{teamMembership}/leave', [TeamTransitionController::class, 'leave'])
        ->name('team.memberships.leave');
    Route::post('team-memberships/{teamMembership}/remove', [TeamTransitionController::class, 'remove'])
        ->name('team.memberships.remove');

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

    Route::get('campus/credit-mappings', [AcademicCreditMappingController::class, 'index'])
        ->name('campus.credit-mappings.index');

    Route::post('campus/credit-mappings', [AcademicCreditMappingController::class, 'store'])
        ->name('campus.credit-mappings.store');

    Route::post('campus/credit-mappings/{id}/activate', [AcademicCreditMappingController::class, 'activate'])
        ->name('campus.credit-mappings.activate');

    Route::post('campus/credit-mappings/{id}/retire', [AcademicCreditMappingController::class, 'retire'])
        ->name('campus.credit-mappings.retire');

    Route::get('campus/{institution}/overview', [CampusOverviewController::class, 'show'])
        ->name('campus.overview.show');

    Route::get('campus/{institution}/contributions', [CampusContributionReviewController::class, 'index'])
        ->name('campus.contributions.index');

    Route::get('campus/{institution}/inclusion', [CampusInclusionController::class, 'index'])
        ->name('campus.inclusion.index');

    Route::post('campus/{institution}/inclusion/{signal}/reviews', [CampusInclusionController::class, 'storeReview'])
        ->name('campus.inclusion.reviews.store');

    Route::get('campus/{institution}/roster', [RosterImportController::class, 'show'])
        ->name('campus.roster.show');

    Route::post('campus/{institution}/roster/preview', [RosterImportController::class, 'preview'])
        ->name('campus.roster.preview');

    Route::post('campus/{institution}/roster', [RosterImportController::class, 'store'])
        ->name('campus.roster.store');

    Route::scopeBindings()->group(function () {
        Route::get('campus/{institution}/affiliations', [AffiliationReviewController::class, 'index'])
            ->name('campus.affiliations.index');

        Route::post(
            'campus/{institution}/affiliations/{affiliationRequest}/lock',
            [AffiliationReviewController::class, 'acquire'],
        )->name('campus.affiliations.locks.store');

        Route::delete(
            'campus/{institution}/affiliations/{affiliationRequest}/lock',
            [AffiliationReviewController::class, 'release'],
        )->name('campus.affiliations.locks.destroy');

        Route::post(
            'campus/{institution}/affiliations/{affiliationRequest}/decision',
            [AffiliationReviewController::class, 'decide'],
        )->name('campus.affiliations.decisions.store');
    });

    Route::get('campus/integrations', [AcademicIntegrationController::class, 'index'])
        ->name('campus.integrations.index');

    Route::post('campus/integrations/syncs/{id}/retry', [AcademicIntegrationController::class, 'retry'])
        ->name('campus.integrations.syncs.retry');

    Route::post('campus/integrations/syncs/{id}/reconcile', [AcademicIntegrationController::class, 'reconcile'])
        ->name('campus.integrations.syncs.reconcile');

    Route::get('api/skills/taxonomy', [SkillTaxonomyController::class, 'index'])
        ->name('skills.taxonomy.index');

    Route::prefix('student-profiles')->name('student-profiles.')->group(function () {
        Route::post('/', [StudentProfileController::class, 'store'])
            ->name('store');
        Route::scopeBindings()->prefix('/{studentProfile}/portfolio')->group(function () {
            Route::get('/', [PortfolioEntryController::class, 'index'])
                ->name('portfolio.index');
            Route::get('/{portfolioEntry}', [PortfolioEntryController::class, 'show'])
                ->name('portfolio.show');
            Route::patch('/{portfolioEntry}/visibility', [PortfolioEntryController::class, 'updateVisibility'])
                ->name('portfolio.visibility.update');
        });
        Route::get('/{studentProfile}', [StudentProfileController::class, 'show'])
            ->name('show');
        Route::patch('/{studentProfile}', [StudentProfileController::class, 'update'])
            ->name('update');
        Route::patch('/{studentProfile}/visibility', [StudentProfileController::class, 'updateVisibility'])
            ->name('visibility.update');
        Route::put('/{studentProfile}/availability', [StudentProfileController::class, 'replaceAvailability'])
            ->name('availability.update');
    });
});

require __DIR__.'/settings.php';
