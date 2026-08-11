<?php

use App\Actions\Affiliations\AcquireAffiliationReviewLock;
use App\Actions\Affiliations\AffiliationReviewQueue;
use App\Actions\Affiliations\ReleaseAffiliationReviewLock;
use App\Actions\Affiliations\ReviewAffiliationRequest;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionRosterStatus;
use App\Exceptions\AffiliationReviewLocked;
use App\Exceptions\StaleAffiliationDecision;
use App\Models\AffiliationRequest;
use App\Models\AffiliationReview;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\PhoneNumber;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;

function affiliationReviewer(Institution $institution): User
{
    $reviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();

    return $reviewer;
}

function pendingAffiliation(Institution $institution): AffiliationRequest
{
    $student = User::factory()->create();
    PhoneNumber::factory()->for($student)->create();
    $membership = InstitutionMembership::factory()
        ->pending()
        ->for($student)
        ->for($institution)
        ->create();

    return AffiliationRequest::factory()
        ->for($institution)
        ->for($student, 'user')
        ->create([
            'institution_membership_id' => $membership->getKey(),
        ]);
}

test('campus reviewer can approve a locked request with append only provenance', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);

    app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer);
    $review = app(ReviewAffiliationRequest::class)->handle(
        $request,
        $reviewer,
        AffiliationReviewDecision::Approve,
        AffiliationReviewReason::RecordsConfirmed,
        1,
        'Data dikonfirmasi oleh pengelola kampus.',
    );

    expect($review->decision)->toBe(AffiliationReviewDecision::Approve)
        ->and($review->policy_version)->toBe('affiliation-review-v1')
        ->and($request->refresh()->status)->toBe(AffiliationRequestStatus::Verified)
        ->and($request->version)->toBe(2)
        ->and($request->review_locked_by_id)->toBeNull()
        ->and($request->membership->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($request->membership->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::CampusAdminReview)
        ->and(AuditLog::query()->where('operation', 'affiliation.reviewed')->count())
        ->toBe(1);

    $review->forceFill(['note' => 'tampered']);

    expect(fn () => $review->save())->toThrow(LogicException::class)
        ->and(fn () => AffiliationReview::query()->whereKey($review->getKey())->delete())
        ->toThrow(QueryException::class);
});

test('reviewer can request revision without changing pending membership', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);

    app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer);
    app(ReviewAffiliationRequest::class)->handle(
        $request,
        $reviewer,
        AffiliationReviewDecision::RequestRevision,
        AffiliationReviewReason::NimCorrectionRequired,
        1,
    );

    expect($request->refresh()->status)->toBe(AffiliationRequestStatus::RevisionRequired)
        ->and($request->membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($request->reviews()->sole()->new_status)
        ->toBe(AffiliationRequestStatus::RevisionRequired);
});

test('reviewer can reject affiliation and return membership to unverified', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);

    app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer);
    app(ReviewAffiliationRequest::class)->handle(
        $request,
        $reviewer,
        AffiliationReviewDecision::Reject,
        AffiliationReviewReason::NotAffiliated,
        1,
    );

    expect($request->refresh()->status)->toBe(AffiliationRequestStatus::Rejected)
        ->and($request->membership->status)->toBe(InstitutionMembershipStatus::Unverified);
});

test('active review lock prevents concurrent reviewers from overwriting work', function () {
    $institution = Institution::factory()->active()->create();
    $firstReviewer = affiliationReviewer($institution);
    $secondReviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);

    app(AcquireAffiliationReviewLock::class)->handle($request, $firstReviewer);

    expect(fn () => app(AcquireAffiliationReviewLock::class)->handle(
        $request,
        $secondReviewer,
    ))->toThrow(AffiliationReviewLocked::class)
        ->and($request->refresh()->review_locked_by_id)->toBe($firstReviewer->getKey())
        ->and($request->review_locked_at)->not->toBeNull()
        ->and($request->review_lock_expires_at)->not->toBeNull()
        ->and($request->review_locked_at?->diffInMinutes($request->review_lock_expires_at, true))
        ->toBe(30.0);

    expect(fn () => app(ReleaseAffiliationReviewLock::class)->handle(
        $request,
        $secondReviewer,
    ))->toThrow(AffiliationReviewLocked::class);
});

test('stale expected version rejects decision without audit mutation', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);
    app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer);

    expect(fn () => app(ReviewAffiliationRequest::class)->handle(
        $request,
        $reviewer,
        AffiliationReviewDecision::Approve,
        AffiliationReviewReason::RecordsConfirmed,
        99,
    ))->toThrow(StaleAffiliationDecision::class)
        ->and(AffiliationReview::query()->count())->toBe(0)
        ->and(AuditLog::query()->where('operation', 'affiliation.reviewed')->count())
        ->toBe(0);
});

test('roster replacement rejects a decision prepared against stale data', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $roster = InstitutionRoster::factory()->for($institution)->create();
    $request = pendingAffiliation($institution);
    $request->forceFill(['roster_id' => $roster->getKey()])->save();
    app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer);

    $roster->forceFill([
        'status' => InstitutionRosterStatus::Superseded,
        'superseded_at' => now(),
    ])->save();
    InstitutionRoster::factory()->for($institution)->create();

    expect(fn () => app(ReviewAffiliationRequest::class)->handle(
        $request,
        $reviewer,
        AffiliationReviewDecision::Approve,
        AffiliationReviewReason::RecordsConfirmed,
        1,
    ))->toThrow(StaleAffiliationDecision::class)
        ->and($request->refresh()->status)->toBe(AffiliationRequestStatus::PendingReview)
        ->and(AffiliationReview::query()->count())->toBe(0);
});

test('review queue and commands enforce explicit institution boundary', function () {
    $institution = Institution::factory()->active()->create();
    $otherInstitution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($otherInstitution);

    expect(fn () => app(AcquireAffiliationReviewLock::class)->handle($request, $reviewer))
        ->toThrow(AuthorizationException::class)
        ->and(fn () => app(AffiliationReviewQueue::class)->paginate(
            $reviewer,
            $otherInstitution,
        ))->toThrow(AuthorizationException::class);
});

test('authorized queue projects masked identifiers and no roster row details', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($institution);
    $request->forceFill(['nim' => 'private-123'])->save();

    $this->withoutVite()
        ->actingAs($reviewer)
        ->get(route('campus.affiliations.index', $institution))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('campus/affiliations')
                ->where('institution.id', $institution->getKey())
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('reviewQueue.items.0.id', $request->getKey())
                        ->where('reviewQueue.items.0.maskedNim', '********123')
                        ->missing('reviewQueue.items.0.nim')
                        ->missing('reviewQueue.items.0.rosterRow')
                        ->missing('reviewQueue.items.0.phone'),
                ),
        );
});

test('cross tenant nested routes are indistinguishable from missing records', function () {
    $institution = Institution::factory()->active()->create();
    $otherInstitution = Institution::factory()->active()->create();
    $reviewer = affiliationReviewer($institution);
    $request = pendingAffiliation($otherInstitution);

    $crossTenant = $this->actingAs($reviewer)->post(route(
        'campus.affiliations.locks.store',
        [$institution, $request],
    ));
    $missing = $this->actingAs($reviewer)->post(route(
        'campus.affiliations.locks.store',
        [$institution, 999999],
    ));

    $crossTenant->assertNotFound();
    $missing->assertNotFound();
});

test('students cannot enumerate the campus review queue', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $this->actingAs($student)
        ->get(route('campus.affiliations.index', $institution))
        ->assertForbidden();
});
