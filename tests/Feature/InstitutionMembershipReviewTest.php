<?php

use App\Actions\InstitutionMemberships\ApproveInstitutionMembership;
use App\Actions\InstitutionMemberships\InstitutionMembershipReviewQueue;
use App\Actions\InstitutionMemberships\RejectInstitutionMembership;
use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionStatus;
use App\Events\InstitutionMembershipReviewed;
use App\Exceptions\InvalidInstitutionMembershipTransition;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;

function campusReviewer(Institution $institution, ?string $state = null): User
{
    $reviewer = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->for($reviewer)
        ->campusAdmin();

    if ($state !== null) {
        $membership->{$state}()->create();
    } else {
        $membership->verifiedByApprovedDomain()->create();
    }

    return $reviewer;
}

test('an authorized campus admin can approve a pending student membership', function () {
    Event::fake();
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create();

    $approved = app(ApproveInstitutionMembership::class)->handle(
        $membership,
        $reviewer,
        '  Data mahasiswa sesuai catatan kampus.  ',
    );

    expect($approved->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($approved->verification_method)->toBe(InstitutionMembershipVerificationMethod::CampusAdminReview)
        ->and($approved->last_review_outcome)->toBe(InstitutionMembershipReviewOutcome::Approved)
        ->and($approved->reviewed_by_id)->toBe($reviewer->getKey())
        ->and($approved->reviewed_at)->not->toBeNull()
        ->and($approved->verified_at)->not->toBeNull()
        ->and(AuditLog::query()->sole()->reason)->toBe('Data mahasiswa sesuai catatan kampus.');

    Event::assertDispatched(InstitutionMembershipReviewed::class, fn (
        InstitutionMembershipReviewed $event,
    ): bool => $event->membershipId === $membership->getKey()
        && $event->institutionId === $institution->getKey()
        && $event->outcome === InstitutionMembershipReviewOutcome::Approved
        && $event->status === InstitutionMembershipStatus::Verified);
});

test('an authorized campus admin can reject a pending student membership', function () {
    Event::fake();
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create();

    $rejected = app(RejectInstitutionMembership::class)->handle(
        $membership,
        $reviewer,
        'Bukti afiliasi belum dapat diverifikasi.',
    );

    expect($rejected->status)->toBe(InstitutionMembershipStatus::Unverified)
        ->and($rejected->verification_method)->toBeNull()
        ->and($rejected->last_review_outcome)->toBe(InstitutionMembershipReviewOutcome::Rejected)
        ->and($rejected->reviewed_by_id)->toBe($reviewer->getKey())
        ->and($rejected->reviewed_at)->not->toBeNull()
        ->and($rejected->verified_at)->toBeNull()
        ->and(AuditLog::query()->sole()->after_summary)->toMatchArray([
            'status' => InstitutionMembershipStatus::Unverified->value,
            'last_review_outcome' => InstitutionMembershipReviewOutcome::Rejected->value,
        ]);

    Event::assertDispatched(InstitutionMembershipReviewed::class, fn (
        InstitutionMembershipReviewed $event,
    ): bool => $event->outcome === InstitutionMembershipReviewOutcome::Rejected
        && $event->status === InstitutionMembershipStatus::Unverified);
});

test('review policy requires a verified campus admin in the same active institution', function () {
    $institution = Institution::factory()->active()->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create();
    $foreignReviewer = campusReviewer($foreignInstitution);
    $studentReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($studentReviewer)
        ->student()
        ->verifiedByApprovedDomain()
        ->create();

    expect(Gate::forUser($foreignReviewer)->denies('review', $membership))->toBeTrue()
        ->and(Gate::forUser($studentReviewer)->denies('approve', $membership))->toBeTrue()
        ->and(fn () => app(ApproveInstitutionMembership::class)->handle(
            $membership,
            $foreignReviewer,
            'Cross tenant attempt',
        ))->toThrow(AuthorizationException::class);
});

test('review authorization rejects unsaved or dirty reviewer identity', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $membership = InstitutionMembership::factory()->for($institution)->pending()->create();
    $unsavedReviewer = User::factory()->make(['id' => $reviewer->getKey()]);
    $dirtyReviewer = $reviewer->replicate();
    $dirtyReviewer->exists = true;
    $dirtyReviewer->setRawAttributes($reviewer->getAttributes());
    $dirtyReviewer->forceFill(['id' => $reviewer->getKey() + 1000]);

    expect(Gate::forUser($unsavedReviewer)->denies('review', $membership))->toBeTrue()
        ->and(Gate::forUser($dirtyReviewer)->denies('review', $membership))->toBeTrue();
});

test('review policy denies unverified, pending, suspended, inactive, and non-student reviewers', function (
    ?string $state,
    InstitutionStatus $institutionStatus,
) {
    $institution = Institution::factory()->create(['status' => $institutionStatus]);
    $reviewer = campusReviewer($institution, $state);
    $membership = InstitutionMembership::factory()->for($institution)->pending()->create();

    expect(Gate::forUser($reviewer)->denies('review', $membership))->toBeTrue();
})->with([
    'unverified reviewer' => ['unverified', InstitutionStatus::Active],
    'pending reviewer' => ['pending', InstitutionStatus::Active],
    'suspended reviewer' => ['suspended', InstitutionStatus::Active],
    'inactive institution' => [null, InstitutionStatus::Suspended],
]);

test('review policy denies a campus admin target from the student queue', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $target = InstitutionMembership::factory()
        ->for($institution)
        ->campusAdmin()
        ->pending()
        ->create();

    expect(Gate::forUser($reviewer)->denies('review', $target))->toBeTrue();
});

test('pending review queue is institution scoped ordered and paginated', function () {
    $institution = Institution::factory()->active()->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $oldest = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create(['requested_at' => now()->subDays(3)]);
    $second = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create(['requested_at' => now()->subDays(2)]);
    $middle = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create(['requested_at' => now()->subDay()]);
    $newest = InstitutionMembership::factory()
        ->for($institution)
        ->pending()
        ->create(['requested_at' => now()]);
    $foreign = InstitutionMembership::factory()
        ->for($foreignInstitution)
        ->pending()
        ->create(['requested_at' => now()->subDays(4)]);

    $page = app(InstitutionMembershipReviewQueue::class)->paginate($reviewer, $institution, 2);

    expect($page->total())->toBe(4)
        ->and($page->getCollection()->pluck('id')->all())
        ->toBe([$oldest->getKey(), $second->getKey()])
        ->and($page->getCollection()->pluck('institution_id')->unique()->all())
        ->toBe([$institution->getKey()])
        ->and($page->getCollection()->pluck('id')->all())
        ->not->toContain($foreign->getKey())
        ->and($newest->getKey())->toBeGreaterThan($middle->getKey());
});

test('queue access is denied without leaking pending membership records', function () {
    $institution = Institution::factory()->active()->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($foreignInstitution);
    $pending = InstitutionMembership::factory()->for($institution)->pending()->create();

    expect(fn () => app(InstitutionMembershipReviewQueue::class)->paginate($reviewer, $institution))
        ->toThrow(AuthorizationException::class);
    expect(InstitutionMembership::query()->whereKey($pending->getKey())->exists())->toBeTrue();
});

test('review reasons are required and bounded', function (string $reason) {
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $membership = InstitutionMembership::factory()->for($institution)->pending()->create();

    expect(fn () => app(ApproveInstitutionMembership::class)->handle($membership, $reviewer, $reason))
        ->toThrow(InvalidArgumentException::class);
})->with([
    'blank' => '   ',
    'too long' => str_repeat('a', 1001),
]);

test('stale or repeated decisions fail without duplicate audit or event', function () {
    Event::fake();
    $institution = Institution::factory()->active()->create();
    $reviewer = campusReviewer($institution);
    $membership = InstitutionMembership::factory()->for($institution)->pending()->create();

    app(ApproveInstitutionMembership::class)->handle($membership, $reviewer, 'Review pertama.');

    expect(fn () => app(RejectInstitutionMembership::class)->handle(
        $membership,
        $reviewer,
        'Keputusan kedua.',
    ))->toThrow(InvalidInstitutionMembershipTransition::class)
        ->and(AuditLog::query()->count())->toBe(1);

    Event::assertDispatchedTimes(InstitutionMembershipReviewed::class, 1);
});

test('review events expose only safe identifiers and dispatch after commit', function () {
    $event = new InstitutionMembershipReviewed(
        1,
        2,
        InstitutionMembershipReviewOutcome::Rejected,
        InstitutionMembershipStatus::Unverified,
    );

    expect($event)->toBeInstanceOf(ShouldDispatchAfterCommit::class)
        ->and(get_object_vars($event))->toBe([
            'membershipId' => 1,
            'institutionId' => 2,
            'outcome' => InstitutionMembershipReviewOutcome::Rejected,
            'status' => InstitutionMembershipStatus::Unverified,
        ]);
});
