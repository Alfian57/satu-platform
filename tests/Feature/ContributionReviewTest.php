<?php

use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Events\ContributionApproved;
use App\Exceptions\StaleContributionDecision;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ContributionReviewedNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('authorized campus reviewer can approve a pending contribution', function () {
    $fixture = contributionReviewFixture();
    Notification::fake();
    Event::fake();
    $contribution = pendingContribution($fixture);

    $response = $this->actingAs($fixture['reviewer'])->postJson(
        route('contributions.reviews.store', $contribution),
        [
            'decision' => ContributionReviewDecision::Approved->value,
            'expected_version' => 1,
            'note' => 'Bukti dan klaim sesuai dengan task.',
        ],
    );

    $review = ContributionReview::query()->sole();
    $audit = AuditLog::query()->where('operation', 'contribution.reviewed')->sole();

    $response
        ->assertOk()
        ->assertJsonPath('data.status', ContributionStatus::Approved->value)
        ->assertJsonPath('data.reviews.0.decision', ContributionReviewDecision::Approved->value)
        ->assertJsonPath('data.reviews.0.policy_version', ReviewContribution::POLICY_VERSION);

    expect($review->decision)->toBe(ContributionReviewDecision::Approved)
        ->and($review->policy_version)->toBe(ReviewContribution::POLICY_VERSION)
        ->and($review->reason)->toBeNull()
        ->and($audit->reason)->toBeNull()
        ->and($audit->after_summary)->toMatchArray([
            'decision' => ContributionReviewDecision::Approved->value,
            'policy_version' => ReviewContribution::POLICY_VERSION,
        ]);

    Notification::assertSentTo($fixture['student'], ContributionReviewedNotification::class);
    expect((new ContributionReviewedNotification($review))->toArray($fixture['student']))
        ->not->toHaveKeys(['path', 'disk', 'sha256', 'phone', 'evidence', 'private_evidence']);
    Event::assertDispatched(ContributionApproved::class, fn (
        ContributionApproved $event,
    ): bool => $event->contributionId === $contribution->getKey()
        && $event->contributionVersionId === $contribution->current_version_id
        && $event->reviewId === $review->getKey()
        && $event->reviewerId === $fixture['reviewer']->getKey()
        && $event->institutionId === $fixture['institution']->getKey()
        && $event->policyVersion === ReviewContribution::POLICY_VERSION);
});

test('revision and rejection decisions require a reason and keep approval trigger quiet', function (
    string $decision,
    string $expectedStatus,
) {
    $fixture = contributionReviewFixture();
    Notification::fake();
    Event::fake();
    $contribution = pendingContribution($fixture);

    $this->actingAs($fixture['reviewer'])
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => $decision,
            'expected_version' => 1,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('reason');

    expect(ContributionReview::query()->count())->toBe(0)
        ->and($contribution->fresh()->status)->toBe(ContributionStatus::Pending);

    $this->actingAs($fixture['reviewer'])
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => $decision,
            'expected_version' => 1,
            'reason' => 'Evidence perlu ditinjau kembali.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', $expectedStatus);

    $review = ContributionReview::query()->sole();

    expect($review->reason)->toBe('Evidence perlu ditinjau kembali.')
        ->and($review->policy_version)->toBe(ReviewContribution::POLICY_VERSION)
        ->and(AuditLog::query()->where('operation', 'contribution.reviewed')->count())->toBe(1);

    Notification::assertSentTo($fixture['student'], ContributionReviewedNotification::class);
    Event::assertNotDispatched(ContributionApproved::class);
})->with([
    'revision' => [ContributionReviewDecision::Revision->value, ContributionStatus::Revision->value],
    'rejection' => [ContributionReviewDecision::Rejected->value, ContributionStatus::Rejected->value],
]);

test('review policy is tenant scoped and denies student reviewers', function () {
    $fixture = contributionReviewFixture();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($foreignReviewer)
        ->for($foreignInstitution)
        ->create();
    $contribution = pendingContribution($fixture);

    $this->actingAs($fixture['student'])
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => ContributionReviewDecision::Approved->value,
            'expected_version' => 1,
        ])
        ->assertForbidden();

    $this->actingAs($foreignReviewer)
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => ContributionReviewDecision::Approved->value,
            'expected_version' => 1,
        ])
        ->assertForbidden();

    expect(ContributionReview::query()->count())->toBe(0);
});

test('stale and repeated review decisions do not create duplicate history', function () {
    $fixture = contributionReviewFixture();
    Notification::fake();
    Event::fake();
    $contribution = pendingContribution($fixture);
    $action = app(ReviewContribution::class);

    $this->actingAs($fixture['reviewer'])
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => ContributionReviewDecision::Approved->value,
            'expected_version' => 2,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    expect(fn () => $action->handle(
        contribution: $contribution,
        reviewer: $fixture['reviewer'],
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 2,
    ))->toThrow(StaleContributionDecision::class);

    $action->handle(
        contribution: $contribution,
        reviewer: $fixture['reviewer'],
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 1,
    );

    expect(fn () => $action->handle(
        contribution: $contribution,
        reviewer: $fixture['reviewer'],
        decision: ContributionReviewDecision::Rejected,
        expectedVersion: 1,
        reason: 'Keputusan kedua tidak boleh ditulis.',
    ))->toThrow(AuthorizationException::class)
        ->and(ContributionReview::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'contribution.reviewed')->count())->toBe(1);

    Event::assertDispatchedTimes(ContributionApproved::class, 1);
});

test('review records remain append-only and the approval event exposes only safe identifiers', function () {
    $fixture = contributionReviewFixture();
    Notification::fake();
    Event::fake();
    $contribution = pendingContribution($fixture);
    $review = app(ReviewContribution::class)->handle(
        contribution: $contribution,
        reviewer: $fixture['reviewer'],
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 1,
    );

    expect(fn () => $review->forceFill(['note' => 'Perubahan ilegal'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $review->delete())->toThrow(LogicException::class);

    $event = new ContributionApproved(
        contributionId: $contribution->getKey(),
        contributionVersionId: $contribution->current_version_id,
        reviewId: $review->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: ReviewContribution::POLICY_VERSION,
    );

    expect($event)->toBeInstanceOf(ShouldDispatchAfterCommit::class)
        ->and(get_object_vars($event))->toBe([
            'contributionId' => $contribution->getKey(),
            'contributionVersionId' => $contribution->current_version_id,
            'reviewId' => $review->getKey(),
            'reviewerId' => $fixture['reviewer']->getKey(),
            'institutionId' => $fixture['institution']->getKey(),
            'policyVersion' => ReviewContribution::POLICY_VERSION,
        ]);
});

test('review request validates decision and expected version', function () {
    $fixture = contributionReviewFixture();
    $contribution = pendingContribution($fixture);

    $this->actingAs($fixture['reviewer'])
        ->postJson(route('contributions.reviews.store', $contribution), [
            'decision' => 'not-a-decision',
            'expected_version' => 0,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['decision', 'expected_version']);
});

/**
 * @return array{institution: Institution, student: User, reviewer: User, project: Project, task: Task, attachment: Attachment}
 */
function contributionReviewFixture(): array
{
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    $reviewer = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($student)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByCampusAdmin($student)
        ->for($reviewer)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create();
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create();
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($student, 'uploadedBy')
        ->create();

    return compact('institution', 'student', 'reviewer', 'project', 'task', 'attachment');
}

/**
 * @param  array{institution: Institution, student: User, reviewer: User, project: Project, task: Task, attachment: Attachment}  $fixture
 */
function pendingContribution(array $fixture): Contribution
{
    $contribution = app(CreateContribution::class)->handle(
        actor: $fixture['student'],
        project: $fixture['project'],
        data: [
            'task_id' => $fixture['task']->getKey(),
            'claim' => 'Menyusun alur validasi kontribusi.',
            'summary' => 'Saya menyusun alur validasi dengan evidence privat.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
            'evidence' => [$fixture['attachment']->getKey()],
        ],
    );

    return app(SubmitContribution::class)->handle($fixture['student'], $contribution);
}
