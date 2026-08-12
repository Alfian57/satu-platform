<?php

declare(strict_types=1);

use App\Enums\SkillProficiency;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution}
 */
function discoveryViewerContext(): array
{
    $institution = Institution::factory()->active()->create();
    $viewer = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($viewer)
        ->for($institution)
        ->create();

    return [$viewer, $institution];
}

test('renders URL-addressable project discovery with a stable page contract', function () {
    [$viewer, $institution] = discoveryViewerContext();
    $skill = SkillTaxonomy::factory()->create(['name' => 'Laravel']);

    $first = Project::factory()
        ->for($institution)
        ->for($viewer, 'owner')
        ->create([
            'title' => 'Laravel Platform',
            'deadline' => now()->addDays(2),
        ]);
    $firstRole = ProjectRole::factory()
        ->for($first)
        ->create(['title' => 'Backend Engineer']);
    ProjectRoleSkill::factory()
        ->for($firstRole, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create(['proficiency' => SkillProficiency::Advanced]);

    $second = Project::factory()
        ->forming()
        ->for($institution)
        ->create([
            'title' => 'Campus Discovery',
            'deadline' => now()->addDays(3),
        ]);
    ProjectRole::factory()
        ->for($second)
        ->create(['title' => 'Laravel Engineer']);

    Project::factory()
        ->for(Institution::factory()->active())
        ->create(['title' => 'Laravel Foreign Project']);

    $this->actingAs($viewer)
        ->get(route('projects.index', [
            'q' => 'Laravel',
            'status' => 'open,forming',
            'visibility' => 'institution,public',
            'sort' => 'deadline',
            'direction' => 'asc',
            'per_page' => 1,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->where('institution.id', $institution->getKey())
            ->where('filters.q', 'Laravel')
            ->where('filters.status', ['open', 'forming'])
            ->where('filters.visibility', ['institution', 'public'])
            ->where('filters.sort', 'deadline')
            ->where('filters.direction', 'asc')
            ->where('filters.institution_id', $institution->getKey())
            ->where('projects.meta.total', 2)
            ->where('projects.meta.current_page', 1)
            ->where('projects.meta.last_page', 2)
            ->has('projects.data', 1)
            ->where('projects.data.0.id', $first->getKey())
            ->where('projects.data.0.roles.0.skills.0.name', 'Laravel')
            ->where('filter_options.sort', ['deadline', 'newest', 'title'])
        );
});

test('defaults to active shared projects within the viewer institution', function () {
    [$viewer, $institution] = discoveryViewerContext();

    $open = Project::factory()
        ->for($institution)
        ->create([
            'title' => 'Open project',
            'deadline' => now()->addDay(),
        ]);
    $forming = Project::factory()
        ->forming()
        ->for($institution)
        ->create([
            'title' => 'Forming project',
            'deadline' => now()->addDays(2),
        ]);
    Project::factory()->closed()->for($institution)->create();
    Project::factory()->draft()->for($institution)->create();
    Project::factory()
        ->privateVisibility()
        ->for($institution)
        ->for($viewer, 'owner')
        ->create();

    Project::factory()
        ->for(Institution::factory()->active())
        ->create();

    $this->actingAs($viewer)
        ->get(route('projects.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('projects.meta.total', 2)
            ->has('projects.data', 2)
            ->where('projects.data.0.id', $open->getKey())
            ->where('projects.data.1.id', $forming->getKey())
            ->where('projects.data.0.institution_id', $institution->getKey())
            ->where('projects.data.1.institution_id', $institution->getKey())
        );
});

test('supports an authorized institution filter and denies a foreign tenant', function () {
    [$viewer, $institution] = discoveryViewerContext();
    $otherInstitution = Institution::factory()->active()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($viewer)
        ->for($otherInstitution)
        ->create();

    $otherProject = Project::factory()->for($otherInstitution)->create();
    $foreignInstitution = Institution::factory()->active()->create();
    Project::factory()->for($foreignInstitution)->create();

    $this->actingAs($viewer)
        ->get(route('projects.index', ['institution_id' => $otherInstitution->getKey()]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.institution_id', $otherInstitution->getKey())
            ->where('projects.meta.total', 1)
            ->where('projects.data.0.id', $otherProject->getKey())
        );

    $this->actingAs($viewer)
        ->get(route('projects.index', ['institution_id' => $foreignInstitution->getKey()]))
        ->assertForbidden();
});

test('keeps deadline pagination deterministic and eager loads discovery relationships', function () {
    [$viewer, $institution] = discoveryViewerContext();
    $skill = SkillTaxonomy::factory()->create();
    $deadline = now()->addWeek();

    $projects = collect(range(1, 3))->map(function (int $number) use ($institution, $deadline, $skill): Project {
        $project = Project::factory()
            ->for($institution)
            ->create([
                'title' => "Project {$number}",
                'deadline' => $deadline,
            ]);
        $role = ProjectRole::factory()->for($project)->create();
        ProjectRoleSkill::factory()
            ->for($role, 'projectRole')
            ->for($skill, 'taxonomy')
            ->create();

        return $project;
    });

    $relationQueries = [
        'project_roles' => 0,
        'project_role_skills' => 0,
        'skill_taxonomies' => 0,
    ];
    DB::listen(function (QueryExecuted $query) use (&$relationQueries): void {
        $sql = strtolower($query->sql);

        foreach (array_keys($relationQueries) as $table) {
            if (str_contains($sql, $table)) {
                $relationQueries[$table]++;
            }
        }
    });

    $this->actingAs($viewer)
        ->get(route('projects.index', [
            'sort' => 'deadline',
            'direction' => 'asc',
            'per_page' => 2,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('projects.meta.total', 3)
            ->where('projects.data.0.id', $projects[0]->getKey())
            ->where('projects.data.1.id', $projects[1]->getKey())
        );

    expect($relationQueries['project_roles'])->toBe(1)
        ->and($relationQueries['project_role_skills'])->toBe(1)
        ->and($relationQueries['skill_taxonomies'])->toBe(1);
});

test('project discovery query budget stays bounded as result volume grows', function () {
    [$viewer, $institution] = discoveryViewerContext();
    $skill = SkillTaxonomy::factory()->create(['name' => 'Testing volume']);

    collect(range(1, 3))->each(function (int $number) use ($institution, $skill): void {
        $project = Project::factory()
            ->for($institution)
            ->create([
                'title' => 'Baseline discovery '.$number,
                'deadline' => now()->addDays($number),
            ]);
        $role = ProjectRole::factory()->for($project)->create();
        ProjectRoleSkill::factory()
            ->for($role, 'projectRole')
            ->for($skill, 'taxonomy')
            ->create();
    });

    $baseline = measureDatabaseQueries(function () use ($viewer): void {
        $this->actingAs($viewer)
            ->get(route('projects.index', [
                'sort' => 'deadline',
                'direction' => 'asc',
                'per_page' => 2,
            ]))
            ->assertSuccessful();
    });

    collect(range(4, 27))->each(function (int $number) use ($institution, $skill): void {
        $project = Project::factory()
            ->for($institution)
            ->create([
                'title' => 'Volume discovery '.$number,
                'deadline' => now()->addDays($number),
            ]);
        $role = ProjectRole::factory()->for($project)->create();
        ProjectRoleSkill::factory()
            ->for($role, 'projectRole')
            ->for($skill, 'taxonomy')
            ->create();
    });

    $expanded = measureDatabaseQueries(function () use ($viewer): void {
        $this->actingAs($viewer)
            ->get(route('projects.index', [
                'sort' => 'deadline',
                'direction' => 'asc',
                'per_page' => 2,
            ]))
            ->assertSuccessful();
    });

    expect($expanded['total'])->toBe($baseline['total']);
});

test('rejects unsupported discovery filters', function () {
    [$viewer] = discoveryViewerContext();

    $this->actingAs($viewer)
        ->get(route('projects.index', [
            'status' => 'draft',
            'visibility' => 'secret',
            'per_page' => 51,
        ]))
        ->assertSessionHasErrors(['status', 'visibility', 'per_page']);
});
