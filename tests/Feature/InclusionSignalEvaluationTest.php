<?php

use App\Actions\Inclusion\EvaluateInclusionSignals;
use App\Enums\InclusionSignalStatus;
use App\Enums\InstitutionStatus;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Support\Graph\CollaborationGraph;
use App\Support\Graph\GraphEdge;
use App\Support\Graph\GraphNode;
use App\Support\Inclusion\InclusionSignalVersion;
use App\Support\Inclusion\SignalDataSufficiencyException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Helper: build a standard test fixture
|--------------------------------------------------------------------------
*/

/**
 * @return array{institution: Institution, users: array<int, User>, admin: User}
 */
function inclusionFixture(int $userCount = 4): array
{
    $institution = Institution::factory()->create([
        'status' => InstitutionStatus::Active,
    ]);

    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($admin)
        ->campusAdmin()
        ->verifiedByCampusAdmin()
        ->create();

    $users = [];
    for ($i = 0; $i < $userCount; $i++) {
        $user = User::factory()->create();
        InstitutionMembership::factory()
            ->for($institution)
            ->for($user)
            ->student()
            ->verifiedByCampusAdmin()
            ->create();
        $users[] = $user;
    }

    return [
        'institution' => $institution,
        'users' => $users,
        'admin' => $admin,
    ];
}

/*
|--------------------------------------------------------------------------
| Signal Engine Calculation
|--------------------------------------------------------------------------
*/

test('evaluates graph and creates signals for isolated candidates', function () {
    ['institution' => $institution, 'users' => $users] = inclusionFixture(3);

    // users[0]: Isolated candidate (degree=1, needs minDegree=2)
    $node0 = new GraphNode(userId: $users[0]->getKey(), eventCount: 5, degree: 1);
    // users[1]: Not a candidate (degree=3)
    $node1 = new GraphNode(userId: $users[1]->getKey(), eventCount: 10, degree: 3);
    // users[2]: Not a candidate (eventCount=0)
    $node2 = new GraphNode(userId: $users[2]->getKey(), eventCount: 0, degree: 0);

    $graph = new CollaborationGraph(
        version: '1.0.0',
        institutionId: $institution->getKey(),
        periodStart: Carbon::now()->subDays(90),
        periodEnd: Carbon::now(),
        nodes: [$node0, $node1, $node2],
        edges: [
            new GraphEdge($users[0]->getKey(), $users[1]->getKey(), 1.0, 5),
            new GraphEdge($users[1]->getKey(), 999, 1.0, 5),
            new GraphEdge($users[1]->getKey(), 998, 1.0, 5),
        ],
    );

    $version = InclusionSignalVersion::v1(); // minDegree=2, minEvent=1

    $action = new EvaluateInclusionSignals;
    $signals = $action->handle($institution, $version, $graph);

    // Only users[0] meets the criteria for inclusion signal
    expect($signals)->toHaveCount(1)
        ->and($signals->first()->subject_id)->toBe($users[0]->getKey())
        ->and($signals->first()->version)->toBe('1.0.0')
        ->and($signals->first()->status)->toBe(InclusionSignalStatus::New)
        ->and($signals->first()->evidence_summary['degree'])->toBe(1);
});

test('idempotency: running evaluation twice does not duplicate signals', function () {
    ['institution' => $institution, 'users' => $users] = inclusionFixture(1);

    $node0 = new GraphNode(userId: $users[0]->getKey(), eventCount: 5, degree: 1);
    $graph = new CollaborationGraph(
        version: '1.0.0',
        institutionId: $institution->getKey(),
        periodStart: Carbon::now()->subDays(90),
        periodEnd: Carbon::now(),
        nodes: [$node0],
        edges: [],
    );

    $action = new EvaluateInclusionSignals;
    $version = InclusionSignalVersion::v1();

    $action->handle($institution, $version, $graph);
    $action->handle($institution, $version, $graph);

    expect(InclusionSignal::count())->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Data Sufficiency Refusal
|--------------------------------------------------------------------------
*/

test('throws SignalDataSufficiencyException if graph institution does not match', function () {
    ['institution' => $institution] = inclusionFixture(1);

    $graph = new CollaborationGraph(
        version: '1.0.0',
        institutionId: 9999, // Mismatch
        periodStart: Carbon::now()->subDays(90),
        periodEnd: Carbon::now(),
        nodes: [],
        edges: [],
    );

    $action = new EvaluateInclusionSignals;

    expect(fn () => $action->handle($institution, InclusionSignalVersion::v1(), $graph))
        ->toThrow(SignalDataSufficiencyException::class, 'Graph institution does not match');
});

test('throws SignalDataSufficiencyException if graph is empty', function () {
    ['institution' => $institution] = inclusionFixture(1);

    $graph = new CollaborationGraph(
        version: '1.0.0',
        institutionId: $institution->getKey(),
        periodStart: Carbon::now()->subDays(90),
        periodEnd: Carbon::now(),
        nodes: [], // Empty
        edges: [],
    );

    $action = new EvaluateInclusionSignals;

    expect(fn () => $action->handle($institution, InclusionSignalVersion::v1(), $graph))
        ->toThrow(SignalDataSufficiencyException::class, 'Graph is empty');
});

/*
|--------------------------------------------------------------------------
| Append-Only Enforcement for Reviews
|--------------------------------------------------------------------------
*/

test('inclusion reviews cannot be updated', function () {
    $review = InclusionReview::factory()->create();

    expect(fn () => $review->save())
        ->toThrow(LogicException::class, 'append-only');
});

test('inclusion reviews cannot be deleted', function () {
    $review = InclusionReview::factory()->create();

    expect(fn () => $review->delete())
        ->toThrow(LogicException::class, 'append-only');
});

/*
|--------------------------------------------------------------------------
| Policy Authorization
|--------------------------------------------------------------------------
*/

test('campus admin can view inclusion signals for their institution', function () {
    ['institution' => $institution, 'users' => $users, 'admin' => $admin] = inclusionFixture(1);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->getKey(),
        'subject_id' => $users[0]->getKey(),
    ]);

    expect($admin->can('view', $signal))->toBeTrue();
});

test('student cannot view inclusion signals', function () {
    ['institution' => $institution, 'users' => $users] = inclusionFixture(1);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->getKey(),
        'subject_id' => $users[0]->getKey(),
    ]);

    expect($users[0]->can('view', $signal))->toBeFalse();
});

test('campus admin from another institution cannot view signals', function () {
    ['institution' => $institutionA, 'users' => $usersA] = inclusionFixture(1);
    ['admin' => $otherAdmin] = inclusionFixture(1);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institutionA->getKey(),
        'subject_id' => $usersA[0]->getKey(),
    ]);

    expect($otherAdmin->can('view', $signal))->toBeFalse();
});
