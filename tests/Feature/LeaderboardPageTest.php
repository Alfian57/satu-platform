<?php

use App\Jobs\RebuildLeaderboardProjections as RebuildLeaderboardProjectionsJob;
use App\Models\BadgeAward;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guests are redirected to login before leaderboard data is exposed', function () {
    $this->get(route('leaderboards.index'))
        ->assertRedirect(route('login'));
});

test('unaffiliated students receive a clear forbidden leaderboard state', function () {
    $user = User::factory()->create();

    $this->withoutVite()
        ->actingAs($user)
        ->get(route('leaderboards.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('leaderboard.state', 'forbidden')
                ->where('leaderboardRows.state', 'forbidden')
                ->where('leaderboardRows.rows', []),
        );
});

test('verified students see a distinct no-verified-xp empty state', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();

    $this->withoutVite()
        ->actingAs($user)
        ->get(route('leaderboards.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('leaderboard.state', 'ready')
                ->where('leaderboard.period', null)
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('leaderboardRows.state', 'empty')
                        ->where('leaderboardRows.emptyReason', 'no_verified_xp')
                        ->where('leaderboardRows.rows', []),
                ),
        );
});

test('verified students receive a tenant-scoped leaderboard projection with safe provenance', function () {
    $fixture = leaderboardPageFixture();

    $this->withoutVite()
        ->actingAs($fixture['user'])
        ->get(route('leaderboards.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('leaderboards/index')
                ->where('leaderboard.state', 'ready')
                ->where('leaderboard.institution.id', $fixture['institution']->getKey())
                ->where('leaderboard.institution.name', 'Universitas Leaderboard')
                ->where('leaderboard.semester', $fixture['semester'])
                ->where('leaderboard.scope', 'program')
                ->where('leaderboard.period.isStale', false)
                ->where('leaderboard.preference.isOptedIn', false)
                ->has('leaderboard.badges', 1)
                ->missing('leaderboard.badges.0.reason')
                ->missing('leaderboard.badges.0.privateEvidence')
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('leaderboardRows.state', 'ready')
                        ->where('leaderboardRows.rows.0.scopeLabel', 'Informatika')
                        ->where('leaderboardRows.rows.0.sharedRankGroup', 1)
                        ->where('leaderboardRows.rows.1.scopeLabel', 'Sistem Informasi')
                        ->where('leaderboardRows.rows.1.sharedRankGroup', 1)
                        ->where('leaderboardRows.rows.2.suppressed', true)
                        ->where('leaderboardRows.rows.2.rank', null)
                        ->missing('leaderboardRows.rows.0.inclusionSignal')
                        ->missing('leaderboardRows.rows.0.privateEvidence'),
                ),
        );
});

test('individual scope explains opt-in boundary before returning rows', function () {
    $fixture = leaderboardPageFixture();

    $this->withoutVite()
        ->actingAs($fixture['user'])
        ->get(route('leaderboards.index', [
            'semester' => $fixture['semester'],
            'scope' => 'individual',
        ]))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('leaderboard.scope', 'individual')
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('leaderboardRows.state', 'empty')
                        ->where('leaderboardRows.emptyReason', 'opt_in_required')
                        ->where('leaderboardRows.rows', []),
                ),
        );
});

test('student preference endpoint records consent and queues every active semester rebuild', function () {
    Queue::fake();
    $fixture = leaderboardPageFixture();
    InstitutionRoster::factory()
        ->for($fixture['institution'])
        ->create(['semester' => $fixture['semester']]);

    $response = $this->actingAs($fixture['user'])
        ->post(route('leaderboards.preferences.individual'), [
            'is_opted_in' => true,
            'semester' => $fixture['semester'],
            'scope' => 'individual',
        ]);

    $response->assertRedirect(route('leaderboards.index', [
        'semester' => $fixture['semester'],
        'scope' => 'individual',
    ]));

    expect(LeaderboardPreference::query()
        ->whereBelongsTo($fixture['user'])
        ->whereBelongsTo($fixture['institution'])
        ->value('is_opted_in'))->toBeTrue();

    Queue::assertPushedTimes(RebuildLeaderboardProjectionsJob::class, 1);
    $job = Queue::pushed(RebuildLeaderboardProjectionsJob::class)->first();

    expect($job->institutionId)->toBe($fixture['institution']->getKey())
        ->and($job->semester)->toBe($fixture['semester']);
});

test('campus operators can read the tenant leaderboard but cannot change individual consent', function () {
    $fixture = leaderboardPageFixture();
    $operator = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($operator)
        ->for($fixture['institution'])
        ->create();

    $this->withoutVite()
        ->actingAs($operator)
        ->get(route('leaderboards.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('leaderboard.state', 'ready')
                ->where('leaderboard.isCampusOperator', true),
        );

    $this->withoutVite()
        ->actingAs($operator)
        ->get(route('leaderboards.index', ['scope' => 'individual']))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('leaderboard.scope', 'program')
                ->has('leaderboard.scopes', 2),
        );

    $this->actingAs($operator)
        ->post(route('leaderboards.preferences.individual'), [
            'is_opted_in' => true,
            'semester' => $fixture['semester'],
            'scope' => 'individual',
        ])
        ->assertForbidden();
});

/**
 * @return array{institution: Institution, user: User, semester: string}
 */
function leaderboardPageFixture(): array
{
    $semester = '2025/2026 Genap';
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Leaderboard',
    ]);
    $user = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();

    $digest = hash('sha256', 'leaderboard-page-fixture');
    $period = LeaderboardPeriod::factory()
        ->for($institution)
        ->create([
            'semester' => $semester,
            'latest_snapshot_digest' => $digest,
            'computed_at' => now()->subHours(2),
        ]);

    foreach ([
        [
            'scope_key' => 'program:informatika',
            'scope_label' => 'Informatika',
            'rank' => 1,
            'shared_rank_group' => 1,
            'score' => '30.0000',
            'verified_xp_total' => 150,
            'active_member_denominator' => 5,
            'cohort_size' => 5,
        ],
        [
            'scope_key' => 'program:sistem-informasi',
            'scope_label' => 'Sistem Informasi',
            'rank' => 1,
            'shared_rank_group' => 1,
            'score' => '30.0000',
            'verified_xp_total' => 150,
            'active_member_denominator' => 5,
            'cohort_size' => 5,
        ],
        [
            'scope_key' => 'program:manajemen',
            'scope_label' => 'Manajemen',
            'rank' => null,
            'shared_rank_group' => null,
            'score' => '10.0000',
            'verified_xp_total' => 10,
            'active_member_denominator' => 2,
            'cohort_size' => 2,
            'suppressed' => true,
            'suppression_reason' => 'cohort_below_minimum',
        ],
    ] as $index => $row) {
        LeaderboardProjection::factory()
            ->for($period, 'period')
            ->for($institution)
            ->create(array_merge($row, [
                'snapshot_digest' => $digest,
                'snapshot_key' => hash('sha256', $digest.'|'.$row['scope_key'].'|'.$index),
            ]));
    }

    BadgeAward::factory()
        ->for($user)
        ->for($institution)
        ->create();

    return compact('institution', 'user', 'semester');
}
