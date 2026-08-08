<?php

use App\Actions\Graph\BuildCollaborationGraph;
use App\Enums\CollaborationEventType;
use App\Enums\InstitutionStatus;
use App\Models\CollaborationEvent;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Support\Graph\CollaborationGraph;
use App\Support\Graph\GraphProjectionVersion;
use App\Support\Graph\InsufficientDataException;
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
function graphFixture(int $userCount = 4): array
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

/**
 * Create collaboration events between users in an institution.
 *
 * @param  array<int, User>  $users
 */
function seedCollaborationEvents(
    Institution $institution,
    array $users,
    int $eventsPerPair = 3,
    ?Carbon $occurredAt = null,
    bool $isSynthetic = false,
): void {
    $occurredAt ??= Carbon::now()->subDays(10);

    for ($i = 0; $i < count($users); $i++) {
        for ($j = $i + 1; $j < count($users); $j++) {
            for ($k = 0; $k < $eventsPerPair; $k++) {
                CollaborationEvent::factory()->create([
                    'institution_id' => $institution->getKey(),
                    'actor_id' => $users[$i]->getKey(),
                    'target_id' => $users[$j]->getKey(),
                    'event_type' => CollaborationEventType::TaskCompleted,
                    'occurred_at' => $occurredAt->copy()->addMinutes($k),
                    'is_synthetic' => $isSynthetic,
                ]);
            }
        }
    }
}

/*
|--------------------------------------------------------------------------
| Graph Projection: Happy Path
|--------------------------------------------------------------------------
*/

test('builds a graph from valid collaboration events', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);
    seedCollaborationEvents($institution, $users);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();
    $graph = $action->handle($institution, $version);

    expect($graph)
        ->toBeInstanceOf(CollaborationGraph::class)
        ->and($graph->nodeCount())->toBeGreaterThanOrEqual(3)
        ->and($graph->edgeCount())->toBeGreaterThanOrEqual(1)
        ->and($graph->version)->toBe('1.0.0')
        ->and($graph->institutionId)->toBe($institution->getKey())
        ->and($graph->isEmpty())->toBeFalse();
});

test('graph serializes to a reproducible array', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);
    seedCollaborationEvents($institution, $users);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();
    $graph = $action->handle($institution, $version);

    $array = $graph->toArray();

    expect($array)
        ->toHaveKeys(['version', 'institution_id', 'period_start', 'period_end', 'node_count', 'edge_count', 'nodes', 'edges'])
        ->and($array['version'])->toBe('1.0.0')
        ->and($array['institution_id'])->toBe($institution->getKey())
        ->and($array['nodes'])->toBeArray()
        ->and($array['edges'])->toBeArray();
});

/*
|--------------------------------------------------------------------------
| Idempotency
|--------------------------------------------------------------------------
*/

test('same inputs produce the same graph (idempotent)', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);
    $fixedTime = Carbon::create(2026, 6, 15, 12, 0, 0);
    seedCollaborationEvents($institution, $users, occurredAt: $fixedTime);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();
    $start = Carbon::create(2026, 6, 1);
    $end = Carbon::create(2026, 7, 1);

    $graph1 = $action->handle($institution, $version, $start, $end);
    $graph2 = $action->handle($institution, $version, $start->copy(), $end->copy());

    expect($graph1->toArray())->toBe($graph2->toArray());
});

/*
|--------------------------------------------------------------------------
| Time Window Scoping
|--------------------------------------------------------------------------
*/

test('excludes events outside the time window', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);

    $insideTime = Carbon::create(2026, 6, 15);
    $outsideTime = Carbon::create(2026, 1, 1);

    seedCollaborationEvents($institution, $users, occurredAt: $insideTime);

    CollaborationEvent::factory()->count(5)->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => $users[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => $outsideTime,
    ]);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();
    $graph = $action->handle(
        $institution,
        $version,
        periodStart: Carbon::create(2026, 6, 1),
        periodEnd: Carbon::create(2026, 7, 1),
    );

    $totalEventsInGraph = 0;
    foreach ($graph->edges as $edge) {
        $totalEventsInGraph += $edge->eventCount;
    }

    $totalEventsInDb = CollaborationEvent::forInstitution($institution)->count();
    expect($totalEventsInDb)->toBeGreaterThan($totalEventsInGraph);
});

/*
|--------------------------------------------------------------------------
| Tenant Boundary
|--------------------------------------------------------------------------
*/

test('excludes events from other institutions', function () {
    ['institution' => $institutionA, 'users' => $usersA] = graphFixture(3);
    ['institution' => $institutionB, 'users' => $usersB] = graphFixture(3);

    seedCollaborationEvents($institutionA, $usersA);
    seedCollaborationEvents($institutionB, $usersB);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();

    $graphA = $action->handle($institutionA, $version);
    $graphB = $action->handle($institutionB, $version);

    $nodeIdsA = array_map(fn ($n) => $n->userId, $graphA->nodes);
    $nodeIdsB = array_map(fn ($n) => $n->userId, $graphB->nodes);

    expect(array_intersect($nodeIdsA, $nodeIdsB))->toBeEmpty()
        ->and($graphA->institutionId)->toBe($institutionA->getKey())
        ->and($graphB->institutionId)->toBe($institutionB->getKey());
});

/*
|--------------------------------------------------------------------------
| Data Sufficiency
|--------------------------------------------------------------------------
*/

test('throws InsufficientDataException when unique actors below threshold', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(1);

    CollaborationEvent::factory()->count(5)->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => null,
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now()->subDays(5),
    ]);

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();

    expect(fn () => $action->handle($institution, $version))
        ->toThrow(InsufficientDataException::class, 'unique actors below threshold');
});

test('throws InsufficientDataException when no actor meets event threshold', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);

    foreach ($users as $user) {
        CollaborationEvent::factory()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $user->getKey(),
            'target_id' => $users[0]->getKey() === $user->getKey()
                ? $users[1]->getKey()
                : $users[0]->getKey(),
            'event_type' => CollaborationEventType::TaskCompleted,
            'occurred_at' => Carbon::now()->subDays(5),
        ]);
    }

    $action = new BuildCollaborationGraph;
    $version = new GraphProjectionVersion(
        version: '1.0.0',
        edgeRules: [CollaborationEventType::TaskCompleted->value => ['weight' => 1.5]],
        minEventsPerActor: 10,
        minUniqueActors: 2,
        timeWindowDays: 90,
    );

    expect(fn () => $action->handle($institution, $version))
        ->toThrow(InsufficientDataException::class, 'no actor meets minimum event threshold');
});

/*
|--------------------------------------------------------------------------
| Edge Rules
|--------------------------------------------------------------------------
*/

test('applies correct edge weights from version config', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);

    $fixedTime = Carbon::now()->subDays(10);

    for ($i = 0; $i < 3; $i++) {
        CollaborationEvent::factory()->taskCompleted()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $users[0]->getKey(),
            'target_id' => $users[1]->getKey(),
            'occurred_at' => $fixedTime->copy()->addMinutes($i),
        ]);
    }

    for ($i = 0; $i < 3; $i++) {
        CollaborationEvent::factory()->peerReviewed()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $users[1]->getKey(),
            'target_id' => $users[2]->getKey(),
            'occurred_at' => $fixedTime->copy()->addMinutes($i),
        ]);
    }

    for ($i = 0; $i < 3; $i++) {
        CollaborationEvent::factory()->teamJoined()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $users[0]->getKey(),
            'target_id' => $users[2]->getKey(),
            'occurred_at' => $fixedTime->copy()->addMinutes($i),
        ]);
    }

    $action = new BuildCollaborationGraph;
    $version = GraphProjectionVersion::v1();
    $graph = $action->handle($institution, $version);

    $edgeMap = [];
    foreach ($graph->edges as $edge) {
        $key = $edge->sourceId.'-'.$edge->targetId;
        $edgeMap[$key] = $edge;
    }

    $u0 = min($users[0]->getKey(), $users[1]->getKey());
    $u1 = max($users[0]->getKey(), $users[1]->getKey());
    $taskEdge = $edgeMap["{$u0}-{$u1}"] ?? null;

    expect($taskEdge)->not->toBeNull()
        ->and($taskEdge->weight)->toBe(4.5)
        ->and($taskEdge->eventCount)->toBe(3);
});

test('events with unrecognized types are excluded from edges', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);

    // Seed TaskCompleted events (will be excluded by version)
    seedCollaborationEvents($institution, $users);

    // Also seed PeerReviewed events so the version query finds data
    $fixedTime = Carbon::now()->subDays(5);
    for ($i = 0; $i < 3; $i++) {
        CollaborationEvent::factory()->peerReviewed()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $users[0]->getKey(),
            'target_id' => $users[1]->getKey(),
            'occurred_at' => $fixedTime->copy()->addMinutes($i),
        ]);
    }
    for ($i = 0; $i < 3; $i++) {
        CollaborationEvent::factory()->peerReviewed()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $users[1]->getKey(),
            'target_id' => $users[2]->getKey(),
            'occurred_at' => $fixedTime->copy()->addMinutes($i + 10),
        ]);
    }

    $action = new BuildCollaborationGraph;
    $version = new GraphProjectionVersion(
        version: '1.0.0-limited',
        edgeRules: [CollaborationEventType::PeerReviewed->value => ['weight' => 0.5]],
        minEventsPerActor: 1,
        minUniqueActors: 2,
        timeWindowDays: 90,
    );

    $graph = $action->handle($institution, $version);

    // Only PeerReviewed edges should exist, TaskCompleted excluded
    expect($graph->edgeCount())->toBe(2);
});

/*
|--------------------------------------------------------------------------
| Provenance
|--------------------------------------------------------------------------
*/

test('synthetic events are preserved with provenance flag', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(3);
    seedCollaborationEvents($institution, $users, isSynthetic: true);

    $syntheticCount = CollaborationEvent::forInstitution($institution)
        ->syntheticOnly()
        ->count();

    $realCount = CollaborationEvent::forInstitution($institution)
        ->realOnly()
        ->count();

    expect($syntheticCount)->toBeGreaterThan(0)
        ->and($realCount)->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Append-Only Enforcement
|--------------------------------------------------------------------------
*/

test('collaboration events cannot be updated', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(2);

    $event = CollaborationEvent::factory()->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => $users[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now(),
    ]);

    expect(fn () => $event->save())
        ->toThrow(LogicException::class, 'append-only');
});

test('collaboration events cannot be deleted', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(2);

    $event = CollaborationEvent::factory()->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => $users[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now(),
    ]);

    expect(fn () => $event->delete())
        ->toThrow(LogicException::class, 'append-only');
});

/*
|--------------------------------------------------------------------------
| Policy: Authorization
|--------------------------------------------------------------------------
*/

test('campus admin can view collaboration events for their institution', function () {
    ['institution' => $institution, 'users' => $users, 'admin' => $admin] = graphFixture(2);

    $event = CollaborationEvent::factory()->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => $users[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now(),
    ]);

    expect($admin->can('view', $event))->toBeTrue();
});

test('student cannot view collaboration events', function () {
    ['institution' => $institution, 'users' => $users] = graphFixture(2);

    $event = CollaborationEvent::factory()->create([
        'institution_id' => $institution->getKey(),
        'actor_id' => $users[0]->getKey(),
        'target_id' => $users[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now(),
    ]);

    expect($users[0]->can('view', $event))->toBeFalse();
});

test('campus admin from another institution cannot view events', function () {
    ['institution' => $institutionA, 'users' => $usersA] = graphFixture(2);
    ['admin' => $otherAdmin] = graphFixture(2);

    $event = CollaborationEvent::factory()->create([
        'institution_id' => $institutionA->getKey(),
        'actor_id' => $usersA[0]->getKey(),
        'target_id' => $usersA[1]->getKey(),
        'event_type' => CollaborationEventType::TaskCompleted,
        'occurred_at' => Carbon::now(),
    ]);

    expect($otherAdmin->can('view', $event))->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Version Value Object
|--------------------------------------------------------------------------
*/

test('GraphProjectionVersion v1 has expected defaults', function () {
    $version = GraphProjectionVersion::v1();

    expect($version->version)->toBe('1.0.0')
        ->and($version->minEventsPerActor)->toBe(3)
        ->and($version->minUniqueActors)->toBe(2)
        ->and($version->timeWindowDays)->toBe(90)
        ->and($version->hasEdgeRule(CollaborationEventType::TeamJoined->value))->toBeTrue()
        ->and($version->hasEdgeRule(CollaborationEventType::TaskCompleted->value))->toBeTrue()
        ->and($version->hasEdgeRule(CollaborationEventType::ProjectContributed->value))->toBeTrue()
        ->and($version->hasEdgeRule(CollaborationEventType::PeerReviewed->value))->toBeTrue()
        ->and($version->hasEdgeRule('nonexistent'))->toBeFalse()
        ->and($version->weightFor(CollaborationEventType::TaskCompleted->value))->toBe(1.5)
        ->and($version->weightFor(CollaborationEventType::PeerReviewed->value))->toBe(0.5)
        ->and($version->weightFor('nonexistent'))->toBeNull();
});

test('GraphProjectionVersion serializes to array', function () {
    $version = GraphProjectionVersion::v1();
    $array = $version->toArray();

    expect($array)
        ->toHaveKeys(['version', 'edge_rules', 'min_events_per_actor', 'min_unique_actors', 'time_window_days'])
        ->and($array['version'])->toBe('1.0.0');
});
