<?php

use App\Actions\Matching\HideRecommendation;
use App\Actions\Matching\MarkRecommendationNotRelevant;
use App\Actions\Matching\MarkRecommendationProfileFix;
use App\Actions\Matching\RecommendationQuery;
use App\Enums\MatchingDimension;
use App\Enums\RecommendationFeedbackType;
use App\Exceptions\StaleRecommendation;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\RecommendationFeedback;
use App\Models\User;
use App\Support\Matching\RecommendationSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Schema;

/**
 * @return array{candidate: User, owner: User, institution: Institution, version: MatchScoreVersion, recommendation: Recommendation}
 */
function recommendationBackendContext(string $versionValue = '1.0.0'): array
{
    $institution = Institution::factory()->active()->create();
    $candidate = User::factory()->create();
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($candidate)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    $version = MatchScoreVersion::factory()->version($versionValue)->create([
        'activated_at' => now(),
    ]);
    $context = compact('candidate', 'owner', 'institution', 'version');
    $recommendation = recommendationBackendRecommendation($context, 0.75, 'Recommendation utama');

    return [...$context, 'recommendation' => $recommendation];
}

/**
 * @param  array{candidate: User, owner: User, institution: Institution, version: MatchScoreVersion}  $context
 */
function recommendationBackendRecommendation(
    array $context,
    float $totalScore = 0.75,
    string $title = 'Recommendation project',
): Recommendation {
    $project = Project::factory()
        ->open()
        ->for($context['institution'])
        ->for($context['owner'], 'owner')
        ->create(['title' => $title]);
    $run = MatchRun::factory()
        ->for($context['institution'])
        ->for($context['candidate'], 'actor')
        ->for($project)
        ->for($context['version'], 'version')
        ->create([
            'institution_id' => $context['institution']->getKey(),
            'actor_id' => $context['candidate']->getKey(),
            'project_id' => $project->getKey(),
            'version_id' => $context['version']->getKey(),
        ]);

    return Recommendation::factory()
        ->for($run, 'matchRun')
        ->for($context['institution'])
        ->for($project)
        ->for($context['candidate'], 'candidate')
        ->create([
            'match_run_id' => $run->getKey(),
            'institution_id' => $context['institution']->getKey(),
            'project_id' => $project->getKey(),
            'candidate_id' => $context['candidate']->getKey(),
            'component_scores' => [
                MatchingDimension::SkillFit->value => 0.5,
                MatchingDimension::ProjectNeed->value => 0.9,
                MatchingDimension::Availability->value => 0.7,
                MatchingDimension::ConnectivityOpportunity->value => 0.95,
            ],
            'total_score' => $totalScore,
            'reason_candidates' => [
                [
                    'dimension' => MatchingDimension::SkillFit->value,
                    'score' => 0.5,
                    'type' => 'neutral',
                    'reason' => 'Skill dapat dibandingkan dengan kebutuhan project.',
                ],
                [
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => 0.9,
                    'type' => 'positive',
                    'reason' => 'Kebutuhan project banyak tercakup.',
                ],
                [
                    'dimension' => MatchingDimension::Availability->value,
                    'score' => 0.7,
                    'type' => 'positive',
                    'reason' => 'Availability cukup sesuai.',
                ],
                [
                    'dimension' => MatchingDimension::ConnectivityOpportunity->value,
                    'score' => 0.95,
                    'type' => 'positive',
                    'reason' => 'Internal connectivity detail.',
                ],
            ],
        ]);
}

test('feedback schema uses bounded MySQL identifiers and append-only columns', function () {
    expect(Schema::hasTable('recommendation_feedback'))->toBeTrue()
        ->and(Schema::hasColumns('recommendation_feedback', [
            'recommendation_id',
            'institution_id',
            'actor_id',
            'feedback_type',
            'created_at',
        ]))->toBeTrue();

    $migration = file_get_contents(
        database_path('migrations/2026_08_12_021835_create_recommendation_feedback_table.php'),
    );

    expect($migration)->toBeString()
        ->toContain("'recommendation_feedback_recommendation_fk'")
        ->toContain("'recommendation_feedback_recommendation_actor_uq'")
        ->toContain("'recommendation_feedback_tenant_actor_type_idx'");
});

test('query returns ordered top reasons and a safe stale-aware projection', function () {
    $context = recommendationBackendContext();
    $second = recommendationBackendRecommendation($context, 0.75, 'Recommendation kedua');

    $result = app(RecommendationQuery::class)->execute(
        $context['candidate'],
        $context['institution'],
    );
    $payload = app(RecommendationSerializer::class)->page($result);
    $first = $payload['data'][0];

    expect($payload['meta']['total'])->toBe(2)
        ->and($first['id'])->toBe($context['recommendation']->getKey())
        ->and($first['project']['id'])->not->toBe($second->project_id)
        ->and($first['top_reasons'])->toHaveCount(3)
        ->and($first['top_reasons'][0]['dimension'])->toBe(MatchingDimension::ProjectNeed->value)
        ->and($first['components'])->toHaveKeys([
            MatchingDimension::SkillFit->value,
            MatchingDimension::ProjectNeed->value,
            MatchingDimension::Availability->value,
        ])
        ->and($first['components'])->not->toHaveKey(MatchingDimension::ConnectivityOpportunity->value)
        ->and($first['score_version']['version'])->toBe('1.0.0')
        ->and($first['is_stale'])->toBeFalse();

    expect(json_encode($payload, JSON_THROW_ON_ERROR))
        ->not->toContain(MatchingDimension::ConnectivityOpportunity->value)
        ->not->toContain('input_snapshot')
        ->not->toContain('Internal connectivity detail.');
});

test('hide feedback is idempotent, audited, and removes the recommendation from the query', function () {
    $context = recommendationBackendContext();
    $action = app(HideRecommendation::class);

    $feedback = $action->execute($context['candidate'], $context['recommendation']);
    $repeat = $action->execute($context['candidate'], $context['recommendation']);

    expect($feedback->feedback_type)->toBe(RecommendationFeedbackType::Hidden)
        ->and($repeat->is($feedback))->toBeTrue()
        ->and(RecommendationFeedback::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'recommendation.hidden')->count())->toBe(1)
        ->and(app(RecommendationQuery::class)
            ->execute($context['candidate'], $context['institution'])
            ->paginator
            ->total())->toBe(0);
});

test('not relevant and profile fix actions persist distinct feedback outcomes', function () {
    $context = recommendationBackendContext();
    $profileFixRecommendation = recommendationBackendRecommendation($context, 0.6, 'Profile fix project');

    $notRelevant = app(MarkRecommendationNotRelevant::class)->execute(
        $context['candidate'],
        $context['recommendation'],
    );
    $profileFix = app(MarkRecommendationProfileFix::class)->execute(
        $context['candidate'],
        $profileFixRecommendation,
    );

    expect($notRelevant->feedback_type)->toBe(RecommendationFeedbackType::NotRelevant)
        ->and($profileFix->feedback_type)->toBe(RecommendationFeedbackType::ProfileFix)
        ->and(RecommendationFeedback::query()->count())->toBe(2)
        ->and(AuditLog::query()->whereIn('operation', [
            'recommendation.not_relevant',
            'recommendation.profile_fix',
        ])->count())->toBe(2)
        ->and(app(RecommendationQuery::class)
            ->execute($context['candidate'], $context['institution'])
            ->paginator
            ->total())->toBe(0);
});

test('stale score versions remain visible as stale and reject feedback mutation', function () {
    $context = recommendationBackendContext();
    MatchScoreVersion::factory()->version('2.0.0')->create([
        'activated_at' => now(),
    ]);

    $payload = app(RecommendationSerializer::class)->page(
        app(RecommendationQuery::class)->execute(
            $context['candidate'],
            $context['institution'],
        ),
    );

    expect($payload['data'][0]['is_stale'])->toBeTrue()
        ->and(fn () => app(HideRecommendation::class)->execute(
            $context['candidate'],
            $context['recommendation'],
        ))->toThrow(StaleRecommendation::class)
        ->and(RecommendationFeedback::query()->count())->toBe(0);
});

test('feedback policy and query deny cross-tenant or non-candidate access', function () {
    $context = recommendationBackendContext();
    $foreign = recommendationBackendContext('2.0.0');

    expect($context['candidate']->can('viewAny', [Recommendation::class, $context['institution']]))->toBeTrue()
        ->and($context['candidate']->can('hide', $context['recommendation']))->toBeTrue()
        ->and($context['candidate']->can('notRelevant', $context['recommendation']))->toBeTrue()
        ->and($context['candidate']->can('profileFix', $context['recommendation']))->toBeTrue()
        ->and($context['owner']->can('feedback', $context['recommendation']))->toBeFalse()
        ->and($foreign['candidate']->can('feedback', $context['recommendation']))->toBeFalse()
        ->and(fn () => app(RecommendationQuery::class)->execute(
            $context['candidate'],
            $foreign['institution'],
        ))->toThrow(AuthorizationException::class)
        ->and(fn () => app(HideRecommendation::class)->execute(
            $foreign['candidate'],
            $context['recommendation'],
        ))->toThrow(AuthorizationException::class);
});

test('recommendation feedback records remain append-only', function () {
    $context = recommendationBackendContext();
    $feedback = app(HideRecommendation::class)->execute(
        $context['candidate'],
        $context['recommendation'],
    );

    $feedback->feedback_type = RecommendationFeedbackType::ProfileFix;

    expect(fn () => $feedback->save())
        ->toThrow(LogicException::class, 'append-only')
        ->and(fn () => $feedback->delete())
        ->toThrow(LogicException::class, 'append-only');
});
