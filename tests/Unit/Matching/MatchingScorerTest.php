<?php

use App\Enums\MatchingDimension;
use App\Support\Matching\MatchingInput;
use App\Support\Matching\MatchingResult;
use App\Support\Matching\MatchingScorer;

function scorerWeights(): array
{
    return [
        MatchingDimension::SkillFit->value => 0.25,
        MatchingDimension::ProjectNeed->value => 0.25,
        MatchingDimension::Availability->value => 0.25,
        MatchingDimension::ConnectivityOpportunity->value => 0.25,
    ];
}

function scorerParameters(): array
{
    return [
        'availability_target_minutes' => 1200,
        'connectivity_cap' => 5,
    ];
}

function scorerInput(array $overrides = []): MatchingInput
{
    $defaults = [
        'institutionId' => 1,
        'candidateId' => 10,
        'projectId' => 20,
        'projectOwnerId' => 11,
        'profileSkills' => [[
            'taxonomy_id' => 100,
            'proficiency' => 4,
        ]],
        'profileInterests' => [],
        'projectRequirements' => [[
            'role_id' => 30,
            'role_title' => 'Backend Engineer',
            'role_capacity' => 1,
            'taxonomy_id' => 100,
            'skill_name' => 'PHP',
            'required_proficiency' => 4,
        ]],
        'availabilityWindows' => [[
            'day_of_week' => 1,
            'starts_at' => '09:00:00',
            'ends_at' => '17:00:00',
            'timezone' => 'Asia/Jakarta',
        ]],
        'requiredAvailabilityWindows' => [],
        'priorConnectionCount' => 0,
        'collaborationEventCount' => 1,
    ];

    return new MatchingInput(...array_merge($defaults, $overrides));
}

test('matching scores are deterministic and snapshots normalize input ordering', function () {
    $scorer = new MatchingScorer;
    $input = scorerInput([
        'profileSkills' => [
            ['taxonomy_id' => 101, 'proficiency' => 2],
            ['taxonomy_id' => 100, 'proficiency' => 4],
        ],
        'profileInterests' => [101, 100, 101],
        'projectRequirements' => [
            [
                'role_id' => 31,
                'role_title' => 'Data Engineer',
                'role_capacity' => 1,
                'taxonomy_id' => 101,
                'skill_name' => 'Data',
                'required_proficiency' => 2,
            ],
            [
                'role_id' => 30,
                'role_title' => 'Backend Engineer',
                'role_capacity' => 1,
                'taxonomy_id' => 100,
                'skill_name' => 'PHP',
                'required_proficiency' => 4,
            ],
        ],
    ]);

    $reordered = scorerInput([
        'profileSkills' => [
            ['taxonomy_id' => 100, 'proficiency' => 4],
            ['taxonomy_id' => 101, 'proficiency' => 2],
        ],
        'profileInterests' => [100, 101],
        'projectRequirements' => [
            [
                'role_id' => 30,
                'role_title' => 'Backend Engineer',
                'role_capacity' => 1,
                'taxonomy_id' => 100,
                'skill_name' => 'PHP',
                'required_proficiency' => 4,
            ],
            [
                'role_id' => 31,
                'role_title' => 'Data Engineer',
                'role_capacity' => 1,
                'taxonomy_id' => 101,
                'skill_name' => 'Data',
                'required_proficiency' => 2,
            ],
        ],
    ]);

    $first = $scorer->score($input, scorerWeights(), scorerParameters());
    $second = $scorer->score($reordered, scorerWeights(), scorerParameters());

    expect($first->toArray())->toBe($second->toArray())
        ->and($input->toSnapshot())->toBe($reordered->toSnapshot());
});

test('matching score reaches the upper boundary when every dimension is fully supported', function () {
    $result = (new MatchingScorer)->score(
        scorerInput(),
        scorerWeights(),
        array_replace(scorerParameters(), ['availability_target_minutes' => 480]),
    );

    expect($result->components)->toBe([
        'skill_fit' => 1.0,
        'project_need' => 1.0,
        'availability' => 1.0,
        'connectivity_opportunity' => 1.0,
    ])->and($result->totalScore)->toBe(1.0)
        ->and(collect($result->reasonCandidates)->pluck('type')->all())
        ->toBe(['positive', 'positive', 'positive', 'positive']);
});

test('missing profile and collaboration data never creates a false positive score', function () {
    $result = (new MatchingScorer)->score(scorerInput([
        'profileSkills' => [],
        'profileInterests' => [],
        'availabilityWindows' => [],
        'collaborationEventCount' => 0,
        'priorConnectionCount' => 0,
    ]), scorerWeights(), scorerParameters());

    expect($result->components)->toBe([
        'skill_fit' => 0.0,
        'project_need' => 0.0,
        'availability' => 0.0,
        'connectivity_opportunity' => 0.5,
    ])->and($result->totalScore)->toBe(0.125)
        ->and($result->reasonCandidates[2]['reason'])
        ->toContain('belum memiliki availability window');
});

test('missing project requirements use neutral values instead of inventing a match', function () {
    $result = (new MatchingScorer)->score(scorerInput([
        'projectRequirements' => [],
    ]), scorerWeights(), scorerParameters());

    expect($result->components['skill_fit'])->toBe(0.5)
        ->and($result->components['project_need'])->toBe(0.5)
        ->and($result->reasonCandidates[0]['type'])->toBe('neutral')
        ->and($result->reasonCandidates[1]['type'])->toBe('neutral');
});

test('availability compares required windows by deterministic intersection', function () {
    $result = (new MatchingScorer)->score(scorerInput([
        'availabilityWindows' => [[
            'day_of_week' => 1,
            'starts_at' => '09:00:00',
            'ends_at' => '13:00:00',
            'timezone' => 'Asia/Jakarta',
        ]],
        'requiredAvailabilityWindows' => [[
            'day_of_week' => 1,
            'starts_at' => '11:00:00',
            'ends_at' => '15:00:00',
            'timezone' => 'Asia/Jakarta',
        ]],
    ]), scorerWeights(), scorerParameters());

    expect($result->components['availability'])->toBe(0.5);
});

test('ranking resolves equal scores by project id', function () {
    $scorer = new MatchingScorer;
    $results = [
        new MatchingResult(projectId: 30, components: [], totalScore: 0.75, reasonCandidates: []),
        new MatchingResult(projectId: 20, components: [], totalScore: 0.75, reasonCandidates: []),
        new MatchingResult(projectId: 10, components: [], totalScore: 0.9, reasonCandidates: []),
    ];

    expect(array_map(
        static fn (MatchingResult $result): int => $result->projectId,
        $scorer->rank($results),
    ))->toBe([10, 20, 30]);
});

test('connectivity opportunity is monotonic and input snapshot excludes restricted signals', function () {
    $scorer = new MatchingScorer;
    $newConnection = $scorer->score(
        scorerInput(['priorConnectionCount' => 0, 'collaborationEventCount' => 10]),
        scorerWeights(),
        scorerParameters(),
    );
    $frequentConnection = $scorer->score(
        scorerInput(['priorConnectionCount' => 5, 'collaborationEventCount' => 10]),
        scorerWeights(),
        scorerParameters(),
    );

    expect($newConnection->components['connectivity_opportunity'])
        ->toBeGreaterThan($frequentConnection->components['connectivity_opportunity'])
        ->and($newConnection->totalScore)->toBeGreaterThan($frequentConnection->totalScore)
        ->and(scorerInput()->toSnapshot())
        ->not->toHaveKey('inclusion_signal')
        ->not->toHaveKey('message_content');
});

test('matching does not change for equivalent candidates when only identity differs', function () {
    $scorer = new MatchingScorer;
    $first = $scorer->score(
        scorerInput(['candidateId' => 10]),
        scorerWeights(),
        scorerParameters(),
    );
    $second = $scorer->score(
        scorerInput(['candidateId' => 99]),
        scorerWeights(),
        scorerParameters(),
    );

    expect($first->components)->toBe($second->components)
        ->and($first->totalScore)->toBe($second->totalScore)
        ->and($first->reasonCandidates)->toBe($second->reasonCandidates);
});

test('invalid weights are rejected instead of silently changing the scoring contract', function () {
    expect(fn () => (new MatchingScorer)->score(
        scorerInput(),
        [
            'skill_fit' => 1.0,
            'project_need' => 0.0,
            'availability' => 0.0,
        ],
        scorerParameters(),
    ))->toThrow(InvalidArgumentException::class);
});
