<?php

use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Actions\Gamification\ReadLeaderboardProjections;
use App\Actions\Gamification\RebuildLeaderboardProjections;
use App\Actions\Gamification\SetLeaderboardIndividualPreference;
use App\Enums\LeaderboardScopeType;
use App\Jobs\RebuildLeaderboardProjections as RebuildLeaderboardProjectionsJob;
use App\Models\CollaborationEvent;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('leaderboard projection schema stores tenant, scope, denominator, suppression, and freshness fields', function () {
    expect(Schema::hasColumns('leaderboard_periods', [
        'institution_id',
        'semester',
        'rule_version',
        'latest_snapshot_digest',
        'computed_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('leaderboard_preferences', [
            'institution_id',
            'user_id',
            'scope_type',
            'is_opted_in',
            'version',
            'changed_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('leaderboard_projections', [
            'leaderboard_period_id',
            'institution_id',
            'scope_type',
            'scope_id',
            'scope_key',
            'rank',
            'shared_rank_group',
            'score',
            'verified_xp_total',
            'active_member_denominator',
            'cohort_size',
            'suppressed',
            'snapshot_digest',
            'snapshot_key',
            'computed_at',
        ]))->toBeTrue();

    foreach ([
        'leaderboard_periods',
        'leaderboard_preferences',
        'leaderboard_projections',
    ] as $table) {
        foreach (Schema::getIndexes($table) as $index) {
            expect(mb_strlen($index['name']))->toBeLessThanOrEqual(64);
        }
    }
});

test('rebuild stores program and team averages with cohort suppression and shared tie ranks', function () {
    $fixture = leaderboardProjectionFixture();
    $teamProject = Project::factory()
        ->for($fixture['institution'])
        ->for($fixture['reviewer'], 'owner')
        ->create(['title' => 'Tim Riset SATU']);
    $programMembers = [];

    foreach ([
        ['Informatika', 10],
        ['Informatika', 20],
        ['Informatika', 30],
        ['Informatika', 40],
        ['Informatika', 50],
        ['Sistem Informasi', 10],
        ['Sistem Informasi', 20],
        ['Sistem Informasi', 30],
        ['Sistem Informasi', 40],
        ['Sistem Informasi', 50],
    ] as [$program, $amount]) {
        $member = createLeaderboardProjectionMember(
            institution: $fixture['institution'],
            roster: $fixture['roster'],
            reviewer: $fixture['reviewer'],
            semester: $fixture['semester'],
            program: $program,
            amount: $amount,
        );
        $programMembers[] = $member;

        TeamMembership::factory()
            ->for($teamProject)
            ->for($member)
            ->active()
            ->create();
        createLeaderboardProjectionContribution(
            institution: $fixture['institution'],
            owner: $member,
            reviewer: $fixture['reviewer'],
            semester: $fixture['semester'],
            project: $teamProject,
            amount: 1,
        );
    }

    foreach (['Manajemen', 'Manajemen'] as $index => $program) {
        createLeaderboardProjectionMember(
            institution: $fixture['institution'],
            roster: $fixture['roster'],
            reviewer: $fixture['reviewer'],
            semester: $fixture['semester'],
            program: $program,
            amount: $index + 1,
        );
    }

    $inclusionSubject = $programMembers[0];
    InclusionSignal::factory()
        ->for($fixture['institution'])
        ->for($inclusionSubject, 'subject')
        ->create([
            'period' => $fixture['semester'],
            'evidence_summary' => ['restricted_score' => 999],
        ]);
    CollaborationEvent::factory()
        ->for($fixture['institution'])
        ->for($inclusionSubject, 'actor')
        ->solo()
        ->create(['metadata' => ['inclusion_signal' => 'synthetic-only']]);

    $period = app(RebuildLeaderboardProjections::class)->handle(
        $fixture['institution'],
        $fixture['semester'],
    );
    $projections = app(ReadLeaderboardProjections::class)->handle(
        $fixture['institution'],
        $fixture['semester'],
    );

    $programRows = $projections
        ->where('scope_type', LeaderboardScopeType::Program)
        ->keyBy('scope_label');
    $teamRow = $projections
        ->where('scope_type', LeaderboardScopeType::Team)
        ->sole();
    $suppressedRow = $programRows->get('Manajemen');
    $informatika = $programRows->get('Informatika');
    $sistemInformasi = $programRows->get('Sistem Informasi');

    expect($period->latest_snapshot_digest)->not->toBeNull()
        ->and($period->computed_at)->not->toBeNull()
        ->and($informatika->score)->toBe('31.0000')
        ->and($sistemInformasi->score)->toBe('31.0000')
        ->and($informatika->active_member_denominator)->toBe(5)
        ->and($informatika->cohort_size)->toBe(5)
        ->and($informatika->rank)->toBe(1)
        ->and($sistemInformasi->rank)->toBe(1)
        ->and($informatika->shared_rank_group)->toBe(1)
        ->and($sistemInformasi->shared_rank_group)->toBe(1)
        ->and($teamRow->scope_label)->toBe('Tim Riset SATU')
        ->and($teamRow->score)->toBe('1.0000')
        ->and($teamRow->active_member_denominator)->toBe(10)
        ->and($teamRow->cohort_size)->toBe(10)
        ->and($suppressedRow->suppressed)->toBeTrue()
        ->and($suppressedRow->suppression_reason)->toBe('cohort_below_minimum')
        ->and($suppressedRow->rank)->toBeNull()
        ->and($suppressedRow->shared_rank_group)->toBeNull();
});

test('equal group scores receive shared competition rank and inclusion data cannot affect output', function () {
    $fixture = leaderboardProjectionFixture();

    foreach ([
        ['Teknik', 10],
        ['Teknik', 20],
        ['Teknik', 30],
        ['Teknik', 40],
        ['Teknik', 50],
        ['Manajemen', 10],
        ['Manajemen', 20],
        ['Manajemen', 30],
        ['Manajemen', 40],
        ['Manajemen', 50],
    ] as [$program, $amount]) {
        $member = createLeaderboardProjectionMember(
            institution: $fixture['institution'],
            roster: $fixture['roster'],
            reviewer: $fixture['reviewer'],
            semester: $fixture['semester'],
            program: $program,
            amount: $amount,
        );

        if ($program === 'Teknik' && $amount === 50) {
            InclusionSignal::factory()
                ->for($fixture['institution'])
                ->for($member, 'subject')
                ->create([
                    'period' => $fixture['semester'],
                    'restricted_feature_state' => true,
                    'evidence_summary' => ['private_factor' => 'must-not-rank'],
                ]);
        }
    }

    $queryCounts = measureDatabaseQueries(
        fn (): LeaderboardPeriod => app(RebuildLeaderboardProjections::class)->handle(
            $fixture['institution'],
            $fixture['semester'],
        ),
        ['inclusion_signals', 'inclusion_signal_versions', 'collaboration_events', 'messages'],
    );
    $rows = app(ReadLeaderboardProjections::class)
        ->handle($fixture['institution'], $fixture['semester'])
        ->where('scope_type', LeaderboardScopeType::Program)
        ->keyBy('scope_label');

    expect($queryCounts['tables']['inclusion_signals'])->toBe(0)
        ->and($queryCounts['tables']['inclusion_signal_versions'])->toBe(0)
        ->and($queryCounts['tables']['collaboration_events'])->toBe(0)
        ->and($queryCounts['tables']['messages'])->toBe(0)
        ->and($rows->get('Teknik')->score)->toBe('30.0000')
        ->and($rows->get('Manajemen')->score)->toBe('30.0000')
        ->and($rows->get('Teknik')->rank)->toBe(1)
        ->and($rows->get('Manajemen')->rank)->toBe(1)
        ->and($rows->get('Teknik')->shared_rank_group)->toBe(1)
        ->and($rows->get('Manajemen')->shared_rank_group)->toBe(1);
});

test('individual projections require active opt-in and withdrawal changes the latest snapshot without deleting history', function () {
    $fixture = leaderboardProjectionFixture();
    $student = createLeaderboardProjectionMember(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        reviewer: $fixture['reviewer'],
        semester: $fixture['semester'],
        program: 'Informatika',
        amount: 25,
    );
    $rebuild = app(RebuildLeaderboardProjections::class);
    $read = app(ReadLeaderboardProjections::class);

    $rebuild->handle($fixture['institution'], $fixture['semester']);
    expect($read->handle($fixture['institution'], $fixture['semester'])
        ->where('scope_type', LeaderboardScopeType::Individual))->toBeEmpty();

    $preference = app(SetLeaderboardIndividualPreference::class)->handle(
        actor: $student,
        institution: $fixture['institution'],
        isOptedIn: true,
    );
    $rebuild->handle($fixture['institution'], $fixture['semester']);
    $optedInRows = $read->handle($fixture['institution'], $fixture['semester'])
        ->where('scope_type', LeaderboardScopeType::Individual);

    expect($preference->is_opted_in)->toBeTrue()
        ->and($optedInRows)->toHaveCount(1)
        ->and($optedInRows->sole()->scope_id)->toBe($student->getKey());

    $beforeWithdrawalCount = LeaderboardProjection::query()->count();
    app(SetLeaderboardIndividualPreference::class)->handle(
        actor: $student,
        institution: $fixture['institution'],
        isOptedIn: false,
    );
    $rebuild->handle($fixture['institution'], $fixture['semester']);
    $currentRows = $read->handle($fixture['institution'], $fixture['semester']);

    expect($currentRows->where('scope_type', LeaderboardScopeType::Individual))->toBeEmpty()
        ->and(LeaderboardProjection::query()->count())->toBeGreaterThan($beforeWithdrawalCount)
        ->and(LeaderboardPreference::query()
            ->where('user_id', $student->getKey())
            ->sole()->version)->toBe(2);
});

test('rebuild retry is idempotent and a changed source creates a new immutable snapshot', function () {
    $fixture = leaderboardProjectionFixture();
    $member = createLeaderboardProjectionMember(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        reviewer: $fixture['reviewer'],
        semester: $fixture['semester'],
        program: 'Informatika',
        amount: 10,
    );
    $rebuild = app(RebuildLeaderboardProjections::class);
    $first = $rebuild->handle($fixture['institution'], $fixture['semester']);
    $firstCount = LeaderboardProjection::query()->count();
    $firstDigest = $first->latest_snapshot_digest;

    $second = $rebuild->handle($fixture['institution'], $fixture['semester']);

    expect(LeaderboardProjection::query()->count())->toBe($firstCount)
        ->and($second->latest_snapshot_digest)->toBe($firstDigest);

    createLeaderboardProjectionMember(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        reviewer: $fixture['reviewer'],
        semester: $fixture['semester'],
        program: 'Informatika',
        amount: 20,
    );
    $third = $rebuild->handle($fixture['institution'], $fixture['semester']);

    expect($third->latest_snapshot_digest)->not->toBe($firstDigest)
        ->and(LeaderboardProjection::query()->count())->toBeGreaterThan($firstCount);
});

test('stale projection state is recognizable and queued rebuild is unique and retryable', function () {
    $period = LeaderboardPeriod::factory()->create([
        'computed_at' => now()->subHours(25),
        'latest_snapshot_digest' => hash('sha256', 'stale'),
    ]);
    $projection = LeaderboardProjection::factory()
        ->for($period, 'period')
        ->for($period->institution)
        ->create([
            'snapshot_digest' => $period->latest_snapshot_digest,
            'computed_at' => now()->subHours(25),
        ]);

    expect($period->fresh()->isStale())->toBeTrue()
        ->and($projection->load('period')->isStale())->toBeTrue()
        ->and(RebuildLeaderboardProjectionsJob::class)->toImplement(ShouldQueue::class)
        ->and(RebuildLeaderboardProjectionsJob::class)->toImplement(ShouldBeUnique::class)
        ->and((new RebuildLeaderboardProjectionsJob(
            $period->institution_id,
            $period->semester,
        ))->uniqueId())->toBe(
            $period->institution_id.':'.$period->semester,
        );
});

test('leaderboard policy enforces same-tenant access and preference ownership', function () {
    $fixture = leaderboardProjectionFixture();
    $student = createLeaderboardProjectionMember(
        institution: $fixture['institution'],
        roster: $fixture['roster'],
        reviewer: $fixture['reviewer'],
        semester: $fixture['semester'],
        program: 'Informatika',
        amount: 10,
    );
    $period = app(RebuildLeaderboardProjections::class)->handle(
        $fixture['institution'],
        $fixture['semester'],
    );
    $projection = $period->projections()->sole();
    $foreignInstitution = Institution::factory()->active()->create();

    expect(Gate::forUser($student)->allows('view', $projection))->toBeTrue()
        ->and(Gate::forUser($student)->allows('viewAny', [
            LeaderboardProjection::class,
            $fixture['institution'],
        ]))->toBeTrue()
        ->and(Gate::forUser($student)->allows('viewAny', [
            LeaderboardProjection::class,
            $foreignInstitution,
        ]))->toBeFalse()
        ->and(fn () => app(SetLeaderboardIndividualPreference::class)->handle(
            actor: $student,
            institution: $foreignInstitution,
            isOptedIn: true,
        ))->toThrow(AuthorizationException::class);
});

test('periods and projections remain immutable after publication', function () {
    $period = LeaderboardPeriod::factory()->create();
    $projection = LeaderboardProjection::factory()
        ->for($period, 'period')
        ->for($period->institution)
        ->create();

    expect(fn () => $period->forceFill(['semester' => '2026/2027 Ganjil'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $projection->forceFill(['score' => '99.0000'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $projection->delete())
        ->toThrow(LogicException::class);
});

/**
 * @return array{
 *     institution: Institution,
 *     roster: InstitutionRoster,
 *     reviewer: User,
 *     semester: string
 * }
 */
function leaderboardProjectionFixture(): array
{
    $institution = Institution::factory()->active()->create();
    $reviewer = User::factory()->create();
    $semester = '2025/2026 Genap';
    $roster = InstitutionRoster::factory()
        ->for($institution)
        ->create(['semester' => $semester]);

    return compact('institution', 'roster', 'reviewer', 'semester');
}

function createLeaderboardProjectionMember(
    Institution $institution,
    InstitutionRoster $roster,
    User $reviewer,
    string $semester,
    string $program,
    int $amount,
): User {
    $user = User::factory()->create();
    $nim = 'nim-'.strtolower((string) $user->getKey());

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($user)
        ->for($institution)
        ->create(['institutional_identifier' => $nim]);
    InstitutionRosterRow::factory()
        ->for($roster, 'roster')
        ->create([
            'nim' => $nim,
            'semester' => $semester,
            'program_studi' => $program,
            'is_active' => true,
        ]);

    createLeaderboardProjectionContribution(
        institution: $institution,
        owner: $user,
        reviewer: $reviewer,
        semester: $semester,
        project: Project::factory()
            ->for($institution)
            ->for($user, 'owner')
            ->create(),
        amount: $amount,
    );

    return $user;
}

function createLeaderboardProjectionContribution(
    Institution $institution,
    User $owner,
    User $reviewer,
    string $semester,
    Project $project,
    int $amount,
): Contribution {
    $task = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create();
    $contribution = Contribution::factory()
        ->approved()
        ->for($project)
        ->for($owner, 'owner')
        ->create(['institution_id' => $institution->getKey()]);
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $task->getKey()])
        ->create();
    ContributionReview::factory()
        ->for($version, 'contributionVersion')
        ->for($reviewer, 'reviewer')
        ->approved()
        ->create();
    $contribution->forceFill([
        'current_version_id' => $version->getKey(),
    ])->save();

    app(AwardVerifiedContributionXp::class)->handle(
        contribution: $contribution->fresh(),
        amount: $amount,
        semester: $semester,
        actor: $reviewer,
    );

    return $contribution->fresh();
}
