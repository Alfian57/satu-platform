<?php

use App\Actions\Contribution\ReviewContribution;
use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Actions\Gamification\ReadLeaderboardProjections;
use App\Actions\Gamification\RebuildLeaderboardProjections;
use App\Actions\Gamification\ReverseXpAward;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\LeaderboardScopeType;
use App\Events\ContributionApproved;
use App\Listeners\AwardApprovedContributionXp;
use App\Listeners\AwardContributionBadges;
use App\Models\BadgeAward;
use App\Models\BadgeDefinition;
use App\Models\BadgeRuleVersion;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\XpLedgerEntry;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('replayed approval events cannot duplicate xp or badge awards', function () {
    $fixture = qualityGateFixture();
    $contribution = qualityGateContribution(
        institution: $fixture['institution'],
        owner: $fixture['student'],
        reviewer: $fixture['reviewer'],
        status: ContributionStatus::Approved,
        title: 'Kontribusi anti replay',
    );
    $definition = BadgeDefinition::factory()->create([
        'key' => 'quality-gate-replay',
    ]);
    $rule = BadgeRuleVersion::factory()
        ->forDefinition($definition)
        ->create();
    $event = new ContributionApproved(
        contributionId: $contribution->getKey(),
        contributionVersionId: $contribution->current_version_id,
        reviewId: $contribution->currentVersion->reviews()->sole()->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: 'contribution-review-v1',
    );

    app(AwardApprovedContributionXp::class)->handle($event);
    app(AwardApprovedContributionXp::class)->handle($event);
    app(AwardContributionBadges::class)->handle($event);
    app(AwardContributionBadges::class)->handle($event);

    expect(XpLedgerEntry::query()->count())->toBe(1)
        ->and(BadgeAward::query()->count())->toBe(1)
        ->and($rule->fresh()->is_active)->toBeTrue();
});

test('inactive members and foreign tenant records never enter the local projection', function () {
    $fixture = qualityGateFixture();
    $active = qualityGateRegisterStudent(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        semester: $fixture['semester'],
        program: 'Informatika',
        isActive: true,
    );
    $inactiveRosterMember = qualityGateRegisterStudent(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        semester: $fixture['semester'],
        program: 'Informatika',
        isActive: false,
    );
    $suspendedMember = qualityGateRegisterStudent(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        semester: $fixture['semester'],
        program: 'Informatika',
        isActive: true,
        suspended: true,
    );

    foreach ([
        [$active, 10, 'local-active'],
        [$inactiveRosterMember, 90, 'local-inactive-roster'],
        [$suspendedMember, 80, 'local-suspended-membership'],
    ] as [$member, $amount, $title]) {
        $contribution = qualityGateContribution(
            institution: $fixture['institution'],
            owner: $member,
            reviewer: $fixture['reviewer'],
            status: ContributionStatus::Approved,
            title: $title,
        );

        app(AwardVerifiedContributionXp::class)->handle(
            contribution: $contribution,
            amount: $amount,
            semester: $fixture['semester'],
            actor: $fixture['reviewer'],
        );
    }

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($foreignReviewer)
        ->for($foreignInstitution)
        ->create();
    $foreignRoster = InstitutionRoster::factory()
        ->for($foreignInstitution)
        ->create(['semester' => $fixture['semester']]);
    $foreignMember = qualityGateRegisterStudent(
        institution: $foreignInstitution,
        roster: $foreignRoster,
        semester: $fixture['semester'],
        program: 'Informatika',
        isActive: true,
    );
    $foreignContribution = qualityGateContribution(
        institution: $foreignInstitution,
        owner: $foreignMember,
        reviewer: $foreignReviewer,
        status: ContributionStatus::Approved,
        title: 'foreign-tenant-source',
    );
    app(AwardVerifiedContributionXp::class)->handle(
        contribution: $foreignContribution,
        amount: 100,
        semester: $fixture['semester'],
    );

    app(RebuildLeaderboardProjections::class)->handle(
        $fixture['institution'],
        $fixture['semester'],
    );
    $rows = app(ReadLeaderboardProjections::class)->handle(
        $fixture['institution'],
        $fixture['semester'],
    )->where('scope_type', LeaderboardScopeType::Program);
    $row = $rows->where('scope_label', 'Informatika')->sole();

    expect($row->verified_xp_total)->toBe(10)
        ->and($row->active_member_denominator)->toBe(1)
        ->and($row->cohort_size)->toBe(1)
        ->and($rows->count())->toBe(1)
        ->and($rows->pluck('institution_id')->unique()->all())
        ->toBe([$fixture['institution']->getKey()]);
});

test('reversal and semester boundaries produce independent positive snapshots', function () {
    $fixture = qualityGateFixture();
    $nextSemester = '2026/2027 Ganjil';
    $nextRoster = InstitutionRoster::factory()
        ->for($fixture['institution'])
        ->create(['semester' => $nextSemester]);
    $student = qualityGateRegisterStudent(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        semester: $fixture['semester'],
        program: 'Informatika',
    );
    InstitutionRosterRow::factory()
        ->for($nextRoster, 'roster')
        ->create([
            'nim' => 'quality-'.$student->getKey(),
            'semester' => $nextSemester,
            'program_studi' => 'Informatika',
            'is_active' => true,
        ]);

    $firstContribution = qualityGateContribution(
        institution: $fixture['institution'],
        owner: $student,
        reviewer: $fixture['reviewer'],
        status: ContributionStatus::Approved,
        title: 'Kontribusi semester pertama',
    );
    $secondContribution = qualityGateContribution(
        institution: $fixture['institution'],
        owner: $student,
        reviewer: $fixture['reviewer'],
        status: ContributionStatus::Approved,
        title: 'Kontribusi semester berikutnya',
    );
    $award = app(AwardVerifiedContributionXp::class)->handle(
        contribution: $firstContribution,
        amount: 12,
        semester: $fixture['semester'],
        actor: $fixture['reviewer'],
    );
    app(AwardVerifiedContributionXp::class)->handle(
        contribution: $secondContribution,
        amount: 30,
        semester: $nextSemester,
        actor: $fixture['reviewer'],
    );
    $rebuild = app(RebuildLeaderboardProjections::class);
    $read = app(ReadLeaderboardProjections::class);

    $rebuild->handle($fixture['institution'], $fixture['semester']);
    $rebuild->handle($fixture['institution'], $nextSemester);
    $firstRow = $read->handle($fixture['institution'], $fixture['semester'])
        ->where('scope_label', 'Informatika')
        ->sole();
    $secondRow = $read->handle($fixture['institution'], $nextSemester)
        ->where('scope_label', 'Informatika')
        ->sole();
    $firstSnapshotDigest = $fixture['institution']
        ->leaderboardPeriods()
        ->where('semester', $fixture['semester'])
        ->value('latest_snapshot_digest');

    app(ReverseXpAward::class)->handle(
        entry: $award,
        actor: $fixture['reviewer'],
        reason: 'abuse_review',
    );
    $rebuild->handle($fixture['institution'], $fixture['semester']);

    expect($firstRow->verified_xp_total)->toBe(12)
        ->and($secondRow->verified_xp_total)->toBe(30)
        ->and($read->handle($fixture['institution'], $fixture['semester'])
            ->where('scope_label', 'Informatika'))->toBeEmpty()
        ->and($read->handle($fixture['institution'], $nextSemester)
            ->where('scope_label', 'Informatika')
            ->sole()->verified_xp_total)->toBe(30)
        ->and($fixture['institution']
            ->leaderboardPeriods()
            ->where('semester', $fixture['semester'])
            ->value('latest_snapshot_digest'))
        ->not->toBe($firstSnapshotDigest)
        ->and($award->fresh()->amount)->toBe(12)
        ->and(XpLedgerEntry::query()->whereNotNull('reversal_reference_id')->count())
        ->toBe(1);
});

test('foreign reviewers and mismatched approval events cannot award local gamification data', function () {
    $fixture = qualityGateFixture();
    $pending = qualityGateContribution(
        institution: $fixture['institution'],
        owner: $fixture['student'],
        reviewer: null,
        status: ContributionStatus::Pending,
        title: 'Kontribusi menunggu review',
    );
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($foreignReviewer)
        ->for($foreignInstitution)
        ->create();

    expect(fn () => app(ReviewContribution::class)->handle(
        contribution: $pending,
        reviewer: $foreignReviewer,
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 1,
    ))->toThrow(AuthorizationException::class);

    expect($pending->fresh()->status)->toBe(ContributionStatus::Pending)
        ->and(ContributionReview::query()->count())->toBe(0);

    $secondLocalReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($secondLocalReviewer)
        ->for($fixture['institution'])
        ->create();

    app(ReviewContribution::class)->handle(
        contribution: $pending,
        reviewer: $fixture['reviewer'],
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 1,
    );

    expect(fn () => app(ReviewContribution::class)->handle(
        contribution: $pending->fresh(),
        reviewer: $secondLocalReviewer,
        decision: ContributionReviewDecision::Approved,
        expectedVersion: 1,
    ))->toThrow(AuthorizationException::class)
        ->and($pending->fresh()->status)->toBe(ContributionStatus::Approved)
        ->and(ContributionReview::query()->count())->toBe(1);

    $approved = qualityGateContribution(
        institution: $fixture['institution'],
        owner: $fixture['student'],
        reviewer: $fixture['reviewer'],
        status: ContributionStatus::Approved,
        title: 'Kontribusi event boundary',
    );
    $event = new ContributionApproved(
        contributionId: $approved->getKey(),
        contributionVersionId: $approved->current_version_id,
        reviewId: $approved->currentVersion->reviews()->sole()->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $foreignInstitution->getKey(),
        policyVersion: 'contribution-review-v1',
    );
    $ledgerCountBeforeMismatchedEvent = XpLedgerEntry::query()->count();

    app(AwardApprovedContributionXp::class)->handle($event);

    expect(XpLedgerEntry::query()->count())->toBe($ledgerCountBeforeMismatchedEvent);
});

/**
 * @return array{
 *     institution: Institution,
 *     roster: InstitutionRoster,
 *     semester: string,
 *     student: User,
 *     reviewer: User,
 * }
 */
function qualityGateFixture(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Quality Gate',
    ]);
    $semester = '2025/2026 Genap';
    $roster = InstitutionRoster::factory()
        ->for($institution)
        ->create(['semester' => $semester]);
    $student = User::factory()->create(['name' => 'Student Quality Gate']);
    $reviewer = User::factory()->create(['name' => 'Reviewer Quality Gate']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($student)
        ->for($institution)
        ->create(['institutional_identifier' => 'quality-'.$student->getKey()]);
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();
    InstitutionRosterRow::factory()
        ->for($roster, 'roster')
        ->create([
            'nim' => 'quality-'.$student->getKey(),
            'semester' => $semester,
            'program_studi' => 'Informatika',
            'is_active' => true,
        ]);

    return compact('institution', 'roster', 'semester', 'student', 'reviewer');
}

function qualityGateRegisterStudent(
    Institution $institution,
    InstitutionRoster $roster,
    string $semester,
    string $program,
    bool $isActive = true,
    bool $suspended = false,
): User {
    $student = User::factory()->create();
    $nim = 'quality-'.$student->getKey();
    $membership = $suspended
        ? InstitutionMembership::factory()->student()->suspended()
        : InstitutionMembership::factory()->student()->verifiedByRosterExactMatch();

    $membership
        ->for($student)
        ->for($institution)
        ->create(['institutional_identifier' => $nim]);
    InstitutionRosterRow::factory()
        ->for($roster, 'roster')
        ->create([
            'nim' => $nim,
            'semester' => $semester,
            'program_studi' => $program,
            'is_active' => $isActive,
        ]);

    return $student;
}

function qualityGateContribution(
    Institution $institution,
    User $owner,
    ?User $reviewer,
    ContributionStatus $status,
    string $title,
): Contribution {
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['title' => $title]);
    $task = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create();
    $contribution = Contribution::factory()
        ->state(['status' => $status])
        ->for($institution)
        ->for($owner, 'owner')
        ->for($project)
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $task->getKey()])
        ->create();

    $contribution->forceFill([
        'current_version_id' => $version->getKey(),
    ])->save();

    if ($reviewer !== null && $status === ContributionStatus::Approved) {
        ContributionReview::factory()
            ->for($version, 'contributionVersion')
            ->for($reviewer, 'reviewer')
            ->approved()
            ->create();
    }

    return $contribution->fresh(['currentVersion.reviews']);
}
