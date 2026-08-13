<?php

use App\Actions\Gamification\CreateBadgeDefinition;
use App\Actions\Gamification\CreateBadgeRuleVersion;
use App\Actions\Gamification\EvaluateContributionBadges;
use App\Actions\Gamification\IssueBadge;
use App\Actions\Gamification\RevokeBadge;
use App\Enums\BadgeCategory;
use App\Enums\BadgeRuleType;
use App\Events\ContributionApproved;
use App\Listeners\AwardContributionBadges;
use App\Models\AuditLog;
use App\Models\BadgeAward;
use App\Models\BadgeDefinition;
use App\Models\BadgeRevocation;
use App\Models\BadgeRuleVersion;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('badge taxonomy schema keeps bounded names and provenance tables', function () {
    expect(Schema::hasColumns('badge_definitions', [
        'key',
        'category',
        'level',
        'public_name',
        'public_description',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('badge_rule_versions', [
            'badge_definition_id',
            'version',
            'rule_type',
            'criteria',
            'policy_version',
            'is_active',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('badge_awards', [
            'user_id',
            'institution_id',
            'badge_definition_id',
            'badge_rule_version_id',
            'source_type',
            'source_id',
            'source_version_id',
            'source_label',
            'idempotency_key',
            'awarded_at',
            'revoked_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('badge_revocations', [
            'badge_award_id',
            'actor_id',
            'reason',
            'revoked_at',
        ]))->toBeTrue();

    foreach (['badge_definitions', 'badge_rule_versions', 'badge_awards', 'badge_revocations'] as $table) {
        foreach (Schema::getIndexes($table) as $index) {
            expect(mb_strlen($index['name']))->toBeLessThanOrEqual(64);
        }
    }
});

test('platform admin can create public badge taxonomy and versioned active rules', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

    $definition = app(CreateBadgeDefinition::class)->execute(
        actor: $platformAdmin,
        key: 'verified-contributor-1',
        category: BadgeCategory::Contribution,
        level: 1,
        publicName: 'Kontributor Terverifikasi',
        publicDescription: 'Kontribusi pertama yang disetujui campus reviewer.',
    );
    $firstRule = app(CreateBadgeRuleVersion::class)->execute(
        actor: $platformAdmin,
        definition: $definition,
        ruleType: BadgeRuleType::VerifiedContributionCount,
        criteria: ['minimum_approved_contributions' => 1],
    );
    $secondRule = app(CreateBadgeRuleVersion::class)->execute(
        actor: $platformAdmin,
        definition: $definition,
        ruleType: BadgeRuleType::VerifiedContributionCount,
        criteria: ['minimum_approved_contributions' => 5],
    );

    expect($definition->category)->toBe(BadgeCategory::Contribution)
        ->and($definition->level)->toBe(1)
        ->and($definition->public_name)->toBe('Kontributor Terverifikasi')
        ->and($firstRule->version)->toBe(1)
        ->and($firstRule->fresh()->is_active)->toBeFalse()
        ->and($secondRule->version)->toBe(2)
        ->and($secondRule->is_active)->toBeTrue()
        ->and(BadgeRuleVersion::query()->where('is_active', true)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'badge.definition.created')->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'badge.rule_version.created')->count())->toBe(2);
});

test('badge evaluation awards an approved contribution idempotently without loading private evidence', function () {
    $fixture = badgeContributionFixture();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'first-verified-contribution',
    ]);
    $rule = BadgeRuleVersion::factory()->forDefinition($definition)->create([
        'criteria' => ['minimum_approved_contributions' => 1],
    ]);

    $queryMeasure = measureDatabaseQueries(
        fn () => app(EvaluateContributionBadges::class)->handle(
            $fixture['contribution'],
            $fixture['reviewer'],
        ),
        ['messages', 'contribution_evidence', 'inclusion_signals', 'collaboration_events'],
    );
    $first = app(EvaluateContributionBadges::class)->handle(
        $fixture['contribution'],
        $fixture['reviewer'],
    );
    $second = app(EvaluateContributionBadges::class)->handle(
        $fixture['contribution'],
        $fixture['reviewer'],
    );
    $laterContribution = badgeContributionFixture(
        institution: $fixture['institution'],
        student: $fixture['student'],
        reviewer: $fixture['reviewer'],
        contributionKey: 'later',
    );
    $third = app(EvaluateContributionBadges::class)->handle(
        $laterContribution['contribution'],
        $fixture['reviewer'],
    );
    $award = $first->sole();

    expect($first)->toHaveCount(1)
        ->and($second)->toHaveCount(1)
        ->and($third)->toHaveCount(1)
        ->and($award->getKey())->toBe($second->sole()->getKey())
        ->and($award->getKey())->toBe($third->sole()->getKey())
        ->and(BadgeAward::query()->count())->toBe(1)
        ->and($award->user_id)->toBe($fixture['student']->getKey())
        ->and($award->institution_id)->toBe($fixture['institution']->getKey())
        ->and($award->badge_definition_id)->toBe($definition->getKey())
        ->and($award->badge_rule_version_id)->toBe($rule->getKey())
        ->and($award->source_type)->toBe(Contribution::class)
        ->and($award->source_id)->toBe($fixture['contribution']->getKey())
        ->and($award->source_version_id)->toBe($fixture['version']->getKey())
        ->and($award->sourceExplanation())->toMatchArray([
            'type' => 'Contribution',
            'id' => $fixture['contribution']->getKey(),
            'version' => 1,
        ])
        ->and($award->source->relationLoaded('evidence'))->toBeFalse()
        ->and($award->sourceExplanation())->not->toHaveKey('evidence')
        ->and($queryMeasure['tables'])->toMatchArray([
            'messages' => 0,
            'contribution_evidence' => 0,
            'inclusion_signals' => 0,
            'collaboration_events' => 0,
        ]);
});

test('automatic badge rules require the configured verified contribution count', function () {
    $fixture = badgeContributionFixture();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'fifth-verified-contribution',
    ]);
    BadgeRuleVersion::factory()->forDefinition($definition)->create([
        'criteria' => ['minimum_approved_contributions' => 2],
    ]);

    expect(app(EvaluateContributionBadges::class)->handle(
        $fixture['contribution'],
        $fixture['reviewer'],
    ))->toBeEmpty();

    $secondFixture = badgeContributionFixture(
        institution: $fixture['institution'],
        student: $fixture['student'],
        reviewer: $fixture['reviewer'],
        contributionKey: 'second',
    );

    $awards = app(EvaluateContributionBadges::class)->handle(
        $secondFixture['contribution'],
        $fixture['reviewer'],
    );

    expect($awards)->toHaveCount(1)
        ->and($awards->sole()->source_id)->toBe($secondFixture['contribution']->getKey());
});

test('manual badge issuance requires campus review reason and revocation preserves history', function () {
    $fixture = badgeContributionFixture();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'campus-recognition',
        'category' => BadgeCategory::CampusRecognition,
    ]);
    $rule = BadgeRuleVersion::factory()
        ->forDefinition($definition)
        ->manual()
        ->create();

    $award = app(IssueBadge::class)->execute(
        actor: $fixture['reviewer'],
        ruleVersion: $rule,
        sourceContribution: $fixture['contribution'],
        reason: 'Kontribusi luar biasa pada project lintas program.',
    );

    $first = app(RevokeBadge::class)->execute(
        actor: $fixture['reviewer'],
        award: $award,
        reason: 'Hasil review anti-abuse.',
    );
    $second = app(RevokeBadge::class)->execute(
        actor: $fixture['reviewer'],
        award: $award,
        reason: 'Hasil review anti-abuse.',
    );

    expect($first->getKey())->toBe($second->getKey())
        ->and(BadgeAward::query()->count())->toBe(1)
        ->and(BadgeRevocation::query()->count())->toBe(1)
        ->and($award->fresh()->isRevoked())->toBeTrue()
        ->and($first->reason)->toBe('Hasil review anti-abuse.')
        ->and(AuditLog::query()->where('operation', 'badge.awarded')->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'badge.revoked')->count())->toBe(1);

    expect(fn () => app(IssueBadge::class)->execute(
        actor: $fixture['reviewer'],
        ruleVersion: $rule,
        sourceContribution: $fixture['contribution'],
    ))->toThrow(InvalidArgumentException::class);
});

test('badge issuance and revocation enforce institution authorization', function () {
    $fixture = badgeContributionFixture();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($foreignReviewer)
        ->for($foreignInstitution)
        ->create();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'authorized-badge',
    ]);
    $rule = BadgeRuleVersion::factory()->forDefinition($definition)->create();

    expect(fn () => app(IssueBadge::class)->execute(
        actor: $foreignReviewer,
        ruleVersion: $rule,
        sourceContribution: $fixture['contribution'],
    ))->toThrow(AuthorizationException::class);

    $award = app(IssueBadge::class)->execute(
        actor: $fixture['reviewer'],
        ruleVersion: $rule,
        sourceContribution: $fixture['contribution'],
    );

    expect(fn () => app(RevokeBadge::class)->execute(
        actor: $foreignReviewer,
        award: $award,
        reason: 'Tidak berwenang.',
    ))->toThrow(AuthorizationException::class);
});

test('badge rule and award histories cannot be rewritten', function () {
    $fixture = badgeContributionFixture();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'immutable-history',
    ]);
    $rule = BadgeRuleVersion::factory()->forDefinition($definition)->create();
    $award = app(IssueBadge::class)->execute(
        actor: $fixture['reviewer'],
        ruleVersion: $rule,
        sourceContribution: $fixture['contribution'],
    );
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $nextRule = app(CreateBadgeRuleVersion::class)->execute(
        actor: $platformAdmin,
        definition: $definition,
        ruleType: BadgeRuleType::VerifiedContributionCount,
        criteria: ['minimum_approved_contributions' => 5],
    );

    expect(fn () => $rule->forceFill(['criteria' => ['minimum_approved_contributions' => 99]])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $award->forceFill(['source_label' => 'changed'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $award->delete())
        ->toThrow(LogicException::class)
        ->and($nextRule->version)->toBe(2)
        ->and($award->fresh()->badge_rule_version_id)->toBe($rule->getKey())
        ->and($rule->fresh()->criteria)->toBe(['minimum_approved_contributions' => 1]);
});

test('approved contribution badge consumer is queued after commit', function () {
    expect(AwardContributionBadges::class)->toImplement(ShouldQueueAfterCommit::class);

    $fixture = badgeContributionFixture();
    $definition = BadgeDefinition::factory()->create([
        'key' => 'event-badge',
    ]);
    BadgeRuleVersion::factory()->forDefinition($definition)->create();

    app(AwardContributionBadges::class)->handle(new ContributionApproved(
        contributionId: $fixture['contribution']->getKey(),
        contributionVersionId: $fixture['version']->getKey(),
        reviewId: $fixture['review']->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: 'contribution-review-v1',
    ));

    expect(BadgeAward::query()->count())->toBe(1);
});

/**
 * @return array{
 *     institution: Institution,
 *     student: User,
 *     reviewer: User,
 *     contribution: Contribution,
 *     version: ContributionVersion,
 *     review: ContributionReview,
 * }
 */
function badgeContributionFixture(
    ?Institution $institution = null,
    ?User $student = null,
    ?User $reviewer = null,
    string $contributionKey = 'first',
): array {
    $institution ??= Institution::factory()->active()->create();
    $student ??= User::factory()->create();
    $reviewer ??= User::factory()->create();

    if (! InstitutionMembership::query()
        ->where('institution_id', $institution->getKey())
        ->where('user_id', $student->getKey())
        ->where('role', 'student')
        ->exists()) {
        InstitutionMembership::factory()
            ->student()
            ->verifiedByRosterExactMatch()
            ->for($student)
            ->for($institution)
            ->create();
    }

    if (! InstitutionMembership::query()
        ->where('institution_id', $institution->getKey())
        ->where('user_id', $reviewer->getKey())
        ->where('role', 'campus_admin')
        ->exists()) {
        InstitutionMembership::factory()
            ->campusAdmin()
            ->verifiedByApprovedDomain()
            ->for($reviewer)
            ->for($institution)
            ->create();
    }

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create(['title' => "Badge project {$contributionKey}"]);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create();
    $contribution = Contribution::factory()
        ->approved()
        ->for($project)
        ->for($student, 'owner')
        ->create(['institution_id' => $institution->getKey()]);
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $task->getKey()])
        ->create([
            'claim' => "Kontribusi {$contributionKey} tervalidasi",
        ]);
    $contribution->forceFill([
        'current_version_id' => $version->getKey(),
    ])->save();
    $review = ContributionReview::factory()
        ->for($version, 'contributionVersion')
        ->for($reviewer, 'reviewer')
        ->approved()
        ->create();

    return [
        'institution' => $institution,
        'student' => $student,
        'reviewer' => $reviewer,
        'contribution' => $contribution->fresh(),
        'version' => $version,
        'review' => $review,
    ];
}
