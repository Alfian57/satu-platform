<?php

use App\Actions\Audit\AuditRecorder;
use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Actions\Gamification\ReverseXpAward;
use App\Events\ContributionApproved;
use App\Listeners\AwardApprovedContributionXp;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\XpLedgerEntry;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('xp ledger schema is institution scoped, indexed, and append-only', function () {
    expect(Schema::hasColumns('xp_ledger_entries', [
        'user_id',
        'institution_id',
        'semester',
        'amount',
        'reason',
        'source_type',
        'source_id',
        'policy_version',
        'awarded_at',
        'reversal_reference_id',
        'idempotency_key',
    ]))->toBeTrue();

    foreach (Schema::getIndexes('xp_ledger_entries') as $index) {
        expect(mb_strlen($index['name']))->toBeLessThanOrEqual(64);
    }
});

test('approved contribution receives one idempotent verified xp award', function () {
    $fixture = xpLedgerFixture();
    Event::fake();
    Notification::fake();

    $action = app(AwardVerifiedContributionXp::class);
    $first = $action->handle(
        contribution: $fixture['contribution'],
        amount: 25,
        semester: $fixture['semester'],
        actor: $fixture['reviewer'],
    );
    $second = $action->handle(
        contribution: $fixture['contribution'],
        amount: 25,
        semester: $fixture['semester'],
        actor: $fixture['reviewer'],
    );

    expect($first->getKey())->toBe($second->getKey())
        ->and(XpLedgerEntry::query()->count())->toBe(1)
        ->and($first->user_id)->toBe($fixture['student']->getKey())
        ->and($first->institution_id)->toBe($fixture['institution']->getKey())
        ->and($first->semester)->toBe($fixture['semester'])
        ->and($first->amount)->toBe(25)
        ->and($first->reason)->toBe('verified_contribution')
        ->and($first->source_type)->toBe(Contribution::class)
        ->and($first->source_id)->toBe($fixture['contribution']->getKey())
        ->and($first->policy_version)->toBe(AwardVerifiedContributionXp::POLICY_VERSION)
        ->and($first->idempotency_key)->toBe(
            $fixture['contribution']->getKey().':1',
        )
        ->and($first->reversal_reference_id)->toBeNull()
        ->and($first->source)->toBeInstanceOf(Contribution::class)
        ->and($first->institution()->exists())->toBeTrue();

    $audit = AuditLog::query()->where('operation', 'xp.awarded')->sole();

    expect($audit->operation)->toBe('xp.awarded')
        ->and($audit->after_summary)->toMatchArray([
            'amount' => 25,
            'semester' => $fixture['semester'],
            'source_id' => $fixture['contribution']->getKey(),
            'policy_version' => AwardVerifiedContributionXp::POLICY_VERSION,
        ]);
});

test('approved contribution event awards xp from the active roster semester', function () {
    $fixture = xpLedgerFixture();

    app(AwardApprovedContributionXp::class)->handle(new ContributionApproved(
        contributionId: $fixture['contribution']->getKey(),
        contributionVersionId: $fixture['contribution']->current_version_id,
        reviewId: $fixture['review']->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: 'contribution-review-v1',
    ));

    $entry = XpLedgerEntry::query()->sole();

    expect($entry->semester)->toBe($fixture['semester'])
        ->and($entry->amount)->toBe((int) config('gamification.verified_contribution_amount'))
        ->and($entry->source_id)->toBe($fixture['contribution']->getKey());
});

test('approved contribution xp consumer is retryable through the queue', function () {
    expect(AwardApprovedContributionXp::class)->toImplement(ShouldQueue::class);
});

test('unapproved contributions cannot receive xp', function () {
    $fixture = xpLedgerFixture(status: 'pending', withReview: false);

    expect(fn () => app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution'],
        amount: 10,
        semester: $fixture['semester'],
    ))->toThrow(InvalidArgumentException::class);

    expect(XpLedgerEntry::query()->count())->toBe(0);
});

test('idempotency key cannot move an award across semesters or amounts', function () {
    $fixture = xpLedgerFixture();
    $action = app(AwardVerifiedContributionXp::class);

    $action->handle(
        contribution: $fixture['contribution'],
        amount: 10,
        semester: '2025/2026 Genap',
    );

    expect(fn () => $action->handle(
        contribution: $fixture['contribution'],
        amount: 20,
        semester: '2026/2027 Ganjil',
    ))->toThrow(LogicException::class);
});

test('awards from separate semesters remain separate ledger history', function () {
    $fixture = xpLedgerFixture();
    $secondProject = Project::factory()
        ->open()
        ->for($fixture['institution'])
        ->for($fixture['student'], 'owner')
        ->create();
    $secondTask = Task::factory()
        ->for($secondProject)
        ->for($fixture['student'], 'createdBy')
        ->create();
    $secondContribution = Contribution::factory()
        ->approved()
        ->for($secondProject)
        ->for($fixture['student'], 'owner')
        ->create(['institution_id' => $fixture['institution']->getKey()]);
    $secondVersion = ContributionVersion::factory()
        ->forContribution($secondContribution)
        ->state(['task_id' => $secondTask->getKey()])
        ->create();
    ContributionReview::factory()
        ->for($secondVersion, 'contributionVersion')
        ->for($fixture['reviewer'], 'reviewer')
        ->approved()
        ->create();
    $secondContribution->forceFill([
        'current_version_id' => $secondVersion->getKey(),
    ])->save();

    $action = app(AwardVerifiedContributionXp::class);
    $first = $action->handle(
        contribution: $fixture['contribution'],
        semester: '2025/2026 Genap',
    );
    $second = $action->handle(
        contribution: $secondContribution->fresh(),
        semester: '2026/2027 Ganjil',
    );

    expect(XpLedgerEntry::query()->count())->toBe(2)
        ->and($first->semester)->toBe('2025/2026 Genap')
        ->and($second->semester)->toBe('2026/2027 Ganjil')
        ->and($first->idempotency_key)->not->toBe($second->idempotency_key);
});

test('award transaction rolls back the ledger row when audit recording fails', function () {
    $fixture = xpLedgerFixture();
    $audit = Mockery::mock(AuditRecorder::class);
    $audit->shouldReceive('record')
        ->andThrow(new RuntimeException('audit unavailable'));
    app()->instance(AuditRecorder::class, $audit);

    expect(fn () => app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution'],
        semester: $fixture['semester'],
    ))->toThrow(RuntimeException::class, 'audit unavailable');

    expect(XpLedgerEntry::query()->count())->toBe(0);
});

test('award rejects a contribution whose project crosses the institution boundary', function () {
    $fixture = xpLedgerFixture();
    $foreignInstitution = Institution::factory()->active()->create();
    $fixture['contribution']->forceFill([
        'institution_id' => $foreignInstitution->getKey(),
    ])->save();

    expect(fn () => app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution']->fresh(),
        semester: $fixture['semester'],
    ))->toThrow(LogicException::class);

    expect(XpLedgerEntry::query()->count())->toBe(0);
});

test('campus reviewer can reverse an award without deleting history', function () {
    $fixture = xpLedgerFixture();
    $award = app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution'],
        amount: 30,
        semester: $fixture['semester'],
        actor: $fixture['reviewer'],
    );

    $reversalAction = app(ReverseXpAward::class);
    $first = $reversalAction->handle($award, $fixture['reviewer'], 'abuse_review');
    $second = $reversalAction->handle($award, $fixture['reviewer'], 'abuse_review');
    $net = XpLedgerEntry::query()
        ->where('user_id', $fixture['student']->getKey())
        ->where('institution_id', $fixture['institution']->getKey())
        ->where('semester', $fixture['semester'])
        ->withNetAmount()
        ->value('net_amount');

    expect($first->getKey())->toBe($second->getKey())
        ->and(XpLedgerEntry::query()->count())->toBe(2)
        ->and($award->fresh()->amount)->toBe(30)
        ->and($first->amount)->toBe(30)
        ->and($first->isReversal())->toBeTrue()
        ->and($first->reversal_reference_id)->toBe($award->getKey())
        ->and((int) $net)->toBe(0)
        ->and(AuditLog::query()->where('operation', 'xp.reversed')->sole()->operation)
        ->toBe('xp.reversed');
});

test('reversal requires an authorized campus reviewer', function () {
    $fixture = xpLedgerFixture();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($foreignReviewer)
        ->for($foreignInstitution)
        ->create();
    $award = app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution'],
        amount: 10,
        semester: $fixture['semester'],
    );

    expect(fn () => app(ReverseXpAward::class)->handle(
        entry: $award,
        actor: $foreignReviewer,
    ))->toThrow(AuthorizationException::class);

    expect(XpLedgerEntry::query()->count())->toBe(1);
});

test('xp ledger rows remain append-only', function () {
    $fixture = xpLedgerFixture();
    $entry = app(AwardVerifiedContributionXp::class)->handle(
        contribution: $fixture['contribution'],
        amount: 10,
        semester: $fixture['semester'],
    );

    expect(fn () => $entry->forceFill(['amount' => 99])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $entry->delete())
        ->toThrow(LogicException::class);
});

/**
 * @return array{
 *     institution: Institution,
 *     student: User,
 *     reviewer: User,
 *     semester: string,
 *     contribution: Contribution,
 *     version: ContributionVersion,
 *     review: ContributionReview,
 * }
 */
function xpLedgerFixture(
    string $status = 'approved',
    bool $withReview = true,
): array {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    $reviewer = User::factory()->create();
    $semester = '2025/2026 Genap';

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($student)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();
    InstitutionRoster::factory()
        ->for($institution)
        ->create(['semester' => $semester]);

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create();
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create();
    $contribution = Contribution::factory()
        ->state(['status' => $status])
        ->for($project)
        ->for($student, 'owner')
        ->create(['institution_id' => $institution->getKey()]);
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $task->getKey()])
        ->create();

    $contribution->forceFill([
        'current_version_id' => $version->getKey(),
    ])->save();

    $review = $withReview
        ? ContributionReview::factory()
            ->for($version, 'contributionVersion')
            ->for($reviewer, 'reviewer')
            ->approved()
            ->create()
        : null;

    return [
        'institution' => $institution,
        'student' => $student,
        'reviewer' => $reviewer,
        'semester' => $semester,
        'contribution' => $contribution->fresh(),
        'version' => $version,
        'review' => $review,
    ];
}
