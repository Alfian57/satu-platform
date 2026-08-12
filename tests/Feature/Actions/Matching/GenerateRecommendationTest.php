<?php

use App\Actions\Matching\CreateMatchScoreVersion;
use App\Actions\Matching\GenerateRecommendation;
use App\Enums\MatchingDimension;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\Recommendation;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Schema;

function matchingFeatureContext(): array
{
    $institution = Institution::factory()->active()->create();
    $candidate = User::factory()->create();
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($candidate)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    $skill = SkillTaxonomy::factory()->create(['name' => 'PHP']);
    $profile = StudentProfile::factory()
        ->for($candidate, 'user')
        ->for($institution)
        ->create();
    ProfileSkill::factory()->for($profile, 'studentProfile')->create([
        'skill_taxonomy_id' => $skill->getKey(),
        'proficiency' => 'advanced',
    ]);
    $profile->availabilityWindows()->create([
        'day_of_week' => 1,
        'starts_at' => '09:00:00',
        'ends_at' => '17:00:00',
        'timezone' => 'Asia/Jakarta',
    ]);

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Backend Engineer',
        'capacity' => 1,
    ]);
    ProjectRoleSkill::factory()
        ->for($role, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create(['proficiency' => 'advanced']);

    $version = MatchScoreVersion::factory()->create();

    return [$candidate, $owner, $institution, $profile, $project, $version];
}

function matchingFeatureWeights(): array
{
    return [
        MatchingDimension::SkillFit->value => 0.35,
        MatchingDimension::ProjectNeed->value => 0.30,
        MatchingDimension::Availability->value => 0.20,
        MatchingDimension::ConnectivityOpportunity->value => 0.15,
    ];
}

function matchingFeatureParameters(): array
{
    return [
        'availability_target_minutes' => 1200,
        'connectivity_cap' => 5,
    ];
}

test('matching tables store bounded schema and explicit MySQL identifiers', function () {
    expect(Schema::hasTable('match_score_versions'))->toBeTrue()
        ->and(Schema::hasTable('match_runs'))->toBeTrue()
        ->and(Schema::hasTable('recommendations'))->toBeTrue()
        ->and(Schema::hasColumns('match_score_versions', [
            'version',
            'dimensions',
            'weights',
            'parameters',
            'activated_at',
            'author_id',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('match_runs', [
            'institution_id',
            'actor_id',
            'project_id',
            'version_id',
            'input_snapshot',
            'computed_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('recommendations', [
            'match_run_id',
            'institution_id',
            'project_id',
            'candidate_id',
            'component_scores',
            'total_score',
            'reason_candidates',
        ]))->toBeTrue();

    $migration = file_get_contents(database_path('migrations/2026_08_12_013323_create_matching_tables.php'));

    expect($migration)->toBeString()
        ->toContain("'match_score_versions_author_fk'")
        ->toContain("'match_runs_tenant_actor_project_idx'")
        ->toContain("'recommendations_tenant_project_score_idx'");
});

test('platform admin can persist an explicit matching version and students cannot create one', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $version = app(CreateMatchScoreVersion::class)->execute(
        actor: $admin,
        version: '2.0.0',
        weights: matchingFeatureWeights(),
        parameters: matchingFeatureParameters(),
        notes: 'Version evaluasi fairness.',
    );

    expect($version->exists)->toBeTrue()
        ->and($version->weights)->toEqual(matchingFeatureWeights())
        ->and($version->parameters)->toEqual(matchingFeatureParameters())
        ->and($version->supportedDimensions())->toHaveCount(4)
        ->and($version->author_id)->toBe($admin->getKey());

    $student = User::factory()->create();

    expect(fn () => app(CreateMatchScoreVersion::class)->execute(
        actor: $student,
        version: '2.0.1',
        weights: matchingFeatureWeights(),
        parameters: matchingFeatureParameters(),
    ))->toThrow(AuthorizationException::class);

    $version->weights = [...$version->weights, 'skill_fit' => 0.4];

    expect(fn () => $version->save())->toThrow(LogicException::class);
});

test('verified candidate receives a persisted reproducible recommendation with safe explanation', function () {
    [$candidate, $owner, $institution, $profile, $project, $version] = matchingFeatureContext();

    $recommendation = app(GenerateRecommendation::class)->execute(
        actor: $candidate,
        studentProfile: $profile,
        project: $project,
        version: $version,
    );

    expect($recommendation)->toBeInstanceOf(Recommendation::class)
        ->and($recommendation->total_score)->toBeGreaterThan(0.0)
        ->and($recommendation->component_scores)->toHaveKeys([
            'skill_fit',
            'project_need',
            'availability',
            'connectivity_opportunity',
        ])
        ->and(MatchRun::query()->count())->toBe(1)
        ->and($recommendation->matchRun->version->is($version))->toBeTrue()
        ->and($recommendation->matchRun->actor_id)->toBe($candidate->getKey())
        ->and($recommendation->matchRun->input_snapshot)->toHaveKeys([
            'schema_version',
            'profile_skills',
            'project_requirements',
            'availability_windows',
            'prior_connection_count',
        ])
        ->and($recommendation->matchRun->input_snapshot)
        ->not->toHaveKey('message_content')
        ->not->toHaveKey('inclusion_signal')
        ->and($recommendation->safeExplanation()['component_scores'])
        ->not->toHaveKey('connectivity_opportunity')
        ->and($recommendation->safeExplanation()['reason_candidates'])
        ->sequence(
            fn ($reason) => $reason->dimension->not->toBe(MatchingDimension::ConnectivityOpportunity->value),
            fn ($reason) => $reason->dimension->not->toBe(MatchingDimension::ConnectivityOpportunity->value),
            fn ($reason) => $reason->dimension->not->toBe(MatchingDimension::ConnectivityOpportunity->value),
        )
        ->and($recommendation->toArray())
        ->not->toHaveKey('component_scores')
        ->and($candidate->can('view', $recommendation))->toBeTrue()
        ->and($owner->can('view', $recommendation))->toBeTrue();

    expect($institution->getKey())->toBe($project->institution_id);
});

test('recommendation policy denies another tenant and cross-tenant generation', function () {
    [$candidate, $owner, $institution, $profile, $project, $version] = matchingFeatureContext();
    $recommendation = app(GenerateRecommendation::class)->execute(
        actor: $candidate,
        studentProfile: $profile,
        project: $project,
        version: $version,
    );

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignUser = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($foreignUser)
        ->for($foreignInstitution)
        ->create();

    $foreignProject = Project::factory()
        ->open()
        ->for($foreignInstitution)
        ->for($foreignUser, 'owner')
        ->create();

    expect($foreignUser->can('view', $recommendation))->toBeFalse()
        ->and(fn () => app(GenerateRecommendation::class)->execute(
            actor: $candidate,
            studentProfile: $profile,
            project: $foreignProject,
            version: $version,
        ))->toThrow(AuthorizationException::class)
        ->and($institution->getKey())->not->toBe($foreignInstitution->getKey());
});
