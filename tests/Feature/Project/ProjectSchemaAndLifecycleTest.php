<?php

use App\Actions\Project\CreateProject;
use App\Actions\Project\TransitionProjectStatus;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Enums\SkillProficiency;
use App\Exceptions\InvalidProjectTransition;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution}
 */
function projectTestOwnerContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    return [$owner, $institution];
}

test('project schema exposes institution ownership, lifecycle, requirements, and bounded indexes', function () {
    expect(Schema::hasTable('projects'))->toBeTrue()
        ->and(Schema::hasTable('project_roles'))->toBeTrue()
        ->and(Schema::hasTable('project_role_skills'))->toBeTrue()
        ->and(Schema::hasColumns('projects', [
            'institution_id',
            'owner_id',
            'title',
            'description',
            'status',
            'visibility',
            'capacity',
            'deadline',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('project_roles', [
            'project_id',
            'title',
            'capacity',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('project_role_skills', [
            'project_role_id',
            'skill_taxonomy_id',
            'proficiency',
        ]))->toBeTrue();

    $migration = file_get_contents(database_path('migrations/2026_08_11_151844_create_project_tables.php'));

    expect($migration)->toBeString()
        ->toContain("'projects_institution_fk'")
        ->toContain("'projects_owner_fk'")
        ->toContain("'project_roles_project_fk'")
        ->toContain("'project_role_skills_taxonomy_fk'")
        ->toContain("'projects_institution_status_deadline_idx'")
        ->toContain("'projects_discovery_filters_idx'")
        ->toContain("'project_role_skills_role_taxonomy_unique'");

    foreach ([
        'projects_institution_fk',
        'projects_owner_fk',
        'project_roles_project_fk',
        'project_role_skills_taxonomy_fk',
        'projects_institution_status_deadline_idx',
        'projects_discovery_filters_idx',
        'project_role_skills_role_taxonomy_unique',
    ] as $constraintName) {
        expect(mb_strlen($constraintName))->toBeLessThanOrEqual(64);
    }
});

test('verified student can create a project with role capacities and verified skill requirements', function () {
    [$owner, $institution] = projectTestOwnerContext();
    $designSkill = SkillTaxonomy::factory()->create(['name' => 'Product Design']);
    $phpSkill = SkillTaxonomy::factory()->create(['name' => 'PHP']);

    $project = app(CreateProject::class)->handle($owner, $institution, [
        'title' => 'Platform kolaborasi kampus',
        'description' => 'Membangun alur kerja kolaborasi yang dapat diverifikasi.',
        'capacity' => 3,
        'visibility' => ProjectVisibility::Institution,
        'deadline' => now()->addWeeks(3),
        'roles' => [
            [
                'title' => 'Product Designer',
                'capacity' => 1,
                'skills' => [[
                    'taxonomy_id' => $designSkill->getKey(),
                    'proficiency' => SkillProficiency::Advanced,
                ]],
            ],
            [
                'title' => 'Backend Engineer',
                'capacity' => 2,
                'skills' => [[
                    'taxonomy_id' => $phpSkill->getKey(),
                    'proficiency' => 'intermediate',
                ]],
            ],
        ],
    ]);

    expect($project->status)->toBe(ProjectStatus::Draft)
        ->and($project->visibility)->toBe(ProjectVisibility::Institution)
        ->and($project->institution_id)->toBe($institution->getKey())
        ->and($project->owner_id)->toBe($owner->getKey())
        ->and($project->capacity)->toBe(3)
        ->and($project->acceptsMembers())->toBeFalse()
        ->and($project->roles)->toHaveCount(2)
        ->and($project->roles->sum('capacity'))->toBe(3)
        ->and($project->roles->first()->skills->first()->proficiency)
        ->toBe(SkillProficiency::Advanced)
        ->and($project->roles->last()->skills->first()->taxonomy->is($phpSkill))
        ->toBeTrue();
});

test('project creation rejects role capacity beyond project capacity without partial writes', function () {
    [$owner, $institution] = projectTestOwnerContext();

    expect(fn () => app(CreateProject::class)->handle($owner, $institution, [
        'title' => 'Project kapasitas invalid',
        'capacity' => 2,
        'deadline' => now()->addDay(),
        'roles' => [
            ['title' => 'Role A', 'capacity' => 1, 'skills' => []],
            ['title' => 'Role B', 'capacity' => 2, 'skills' => []],
        ],
    ]))->toThrow(ValidationException::class);

    expect(Project::query()->count())->toBe(0)
        ->and(ProjectRole::query()->count())->toBe(0);
});

test('project creation requires future deadline and verified taxonomies', function () {
    [$owner, $institution] = projectTestOwnerContext();
    $unverifiedSkill = SkillTaxonomy::factory()->create(['is_verified' => false]);

    expect(fn () => app(CreateProject::class)->handle($owner, $institution, [
        'title' => 'Project dengan skill invalid',
        'deadline' => now()->addDay(),
        'roles' => [[
            'title' => 'Engineer',
            'capacity' => 1,
            'skills' => [['taxonomy_id' => $unverifiedSkill->getKey()]],
        ]],
    ]))->toThrow(ValidationException::class);

    expect(fn () => app(CreateProject::class)->handle($owner, $institution, [
        'title' => 'Project dengan deadline invalid',
        'deadline' => now()->subMinute(),
        'roles' => [['title' => 'Engineer', 'capacity' => 1, 'skills' => []]],
    ]))->toThrow(ValidationException::class);

    expect(Project::query()->count())->toBe(0);
});

test('project lifecycle transitions enforce allowed states, deadline, and optional occupancy capacity', function () {
    [$owner, $institution] = projectTestOwnerContext();
    $project = Project::factory()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['capacity' => 3]);
    $action = app(TransitionProjectStatus::class);

    $action->handle($owner, $project, ProjectStatus::Forming, 1);
    expect($project->refresh()->status)->toBe(ProjectStatus::Forming);

    expect(fn () => $action->handle($owner, $project, ProjectStatus::Full, 1))
        ->toThrow(ValidationException::class);

    $action->handle($owner, $project, ProjectStatus::Full, 3);
    expect($project->refresh()->status)->toBe(ProjectStatus::Full)
        ->and($project->acceptsMembers())->toBeFalse();

    $action->handle($owner, $project, ProjectStatus::Forming, 2);
    $action->handle($owner, $project, ProjectStatus::Closed);
    expect($project->refresh()->status)->toBe(ProjectStatus::Closed);

    expect(fn () => $action->handle($owner, $project, ProjectStatus::Open))
        ->toThrow(InvalidProjectTransition::class);

    $overdueProject = Project::factory()
        ->for($institution)
        ->for($owner, 'owner')
        ->overdue()
        ->create();

    expect(fn () => $action->handle($owner, $overdueProject, ProjectStatus::Forming, 1))
        ->toThrow(ValidationException::class);
});

test('project policy enforces verified institution context and owner mutation boundary', function () {
    [$owner, $institution] = projectTestOwnerContext();
    $project = Project::factory()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $sameInstitutionStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($sameInstitutionStudent)
        ->for($institution)
        ->create();
    $campusAdmin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($campusAdmin)
        ->for($institution)
        ->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($foreignStudent)
        ->for($foreignInstitution)
        ->create();
    $unverifiedStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->for($unverifiedStudent)
        ->for($institution)
        ->create();
    $privateProject = Project::factory()
        ->for($institution)
        ->for($owner, 'owner')
        ->privateVisibility()
        ->create();

    expect(Gate::forUser($owner)->allows('view', $project))->toBeTrue()
        ->and(Gate::forUser($owner)->allows('update', $project))->toBeTrue()
        ->and(Gate::forUser($sameInstitutionStudent)->allows('view', $project))->toBeTrue()
        ->and(Gate::forUser($sameInstitutionStudent)->denies('update', $project))->toBeTrue()
        ->and(Gate::forUser($campusAdmin)->allows('view', $project))->toBeTrue()
        ->and(Gate::forUser($campusAdmin)->denies('update', $project))->toBeTrue()
        ->and(Gate::forUser($foreignStudent)->denies('view', $project))->toBeTrue()
        ->and(Gate::forUser($unverifiedStudent)->denies('view', $project))->toBeTrue()
        ->and(Gate::forUser($owner)->allows('view', $privateProject))->toBeTrue()
        ->and(Gate::forUser($sameInstitutionStudent)->denies('view', $privateProject))->toBeTrue()
        ->and(Gate::forUser($campusAdmin)->denies('view', $privateProject))->toBeTrue()
        ->and(Gate::forUser($owner)->allows('create', [Project::class, $institution]))->toBeTrue()
        ->and(Gate::forUser($owner)->denies('create', [Project::class, $foreignInstitution]))->toBeTrue()
        ->and(Gate::forUser($unverifiedStudent)->denies('create', [Project::class, $institution]))->toBeTrue();
});

test('project requirement relations reject duplicate skills and cascade with the project', function () {
    $project = Project::factory()->create();
    $role = ProjectRole::factory()->for($project)->create();
    $skill = SkillTaxonomy::factory()->create();

    ProjectRoleSkill::factory()
        ->for($role, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create();

    expect(fn () => ProjectRoleSkill::factory()
        ->for($role, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create())->toThrow(QueryException::class);

    $project->delete();

    expect(ProjectRole::query()->whereKey($role)->exists())->toBeFalse()
        ->and(ProjectRoleSkill::query()->where('project_role_id', $role->getKey())->exists())->toBeFalse();
});
