<?php

declare(strict_types=1);

use App\Enums\ProjectStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution}
 */
function detailPageOwnerContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Detail SATU',
    ]);
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    return [$owner, $institution];
}

test('owner can open the project create, detail, and editor Inertia surfaces', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $skill = SkillTaxonomy::factory()->create(['name' => 'Laravel']);
    $project = Project::factory()
        ->draft()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Portal kontribusi mahasiswa',
        ]);
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Backend engineer',
        'capacity' => 2,
    ]);
    ProjectRoleSkill::factory()
        ->for($role, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create();

    $this->actingAs($owner)
        ->get(route('projects.create', ['institution_id' => $institution->getKey()]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/create')
            ->where('institution.id', $institution->getKey())
            ->where('institution.name', 'Universitas Detail SATU'));

    $this->actingAs($owner)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.id', $project->getKey())
            ->where('project.institution.name', 'Universitas Detail SATU')
            ->where('project.owner.name', $owner->name)
            ->where('project.roles.0.skills.0.name', 'Laravel')
            ->where('can_edit', true)
            ->where('can_transition', true));

    $this->actingAs($owner)
        ->get(route('projects.edit', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/edit')
            ->where('project.id', $project->getKey())
            ->where('project.status', ProjectStatus::Draft->value));
});

test('project detail keeps the read-only and tenant boundaries visible', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $reader = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($reader)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignProject = Project::factory()->for($foreignInstitution)->create();

    $this->actingAs($reader)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.id', $project->getKey())
            ->where('can_edit', false)
            ->where('can_transition', false));

    $this->actingAs($reader)
        ->get(route('projects.show', $foreignProject))
        ->assertForbidden();

    $privateProject = Project::factory()
        ->privateVisibility()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();

    $this->actingAs($reader)
        ->get(route('projects.show', $privateProject))
        ->assertForbidden();
});

test('owner receives a read-only detail for a project that cannot be edited in its current lifecycle', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $project = Project::factory()
        ->forming()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();

    $this->actingAs($owner)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.status', ProjectStatus::Forming->value)
            ->where('can_edit', false)
            ->where('can_transition', true));

    $this->actingAs($owner)
        ->get(route('projects.edit', $project))
        ->assertStatus(409);
});

test('json project detail remains available for command clients', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $project = Project::factory()
        ->draft()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();

    $this->actingAs($owner)
        ->getJson(route('projects.show', $project))
        ->assertOk()
        ->assertJsonPath('data.id', $project->getKey())
        ->assertJsonPath('data.institution.name', $institution->name)
        ->assertJsonPath('data.owner.id', $owner->getKey());
});

test('owner receives a scoped request queue and capacity projection', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $requester = User::factory()->create(['name' => 'Mahasiswa Peminta']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($requester)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['capacity' => 2]);
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Backend engineer',
    ]);
    TeamJoinRequest::factory()
        ->for($project)
        ->for($requester, 'requester')
        ->forRole($role)
        ->create(['message' => 'Saya siap mengerjakan API.']);

    $this->actingAs($owner)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('team.capacity.total', 2)
            ->where('team.capacity.occupied', 0)
            ->where('team.capacity.remaining', 2)
            ->where('team.permissions.can_manage_requests', true)
            ->where('team.join_requests.0.requester.name', 'Mahasiswa Peminta')
            ->where('team.join_requests.0.role.title', 'Backend engineer')
            ->where('team.join_requests.0.message', 'Saya siap mengerjakan API.')
            ->missing('team.join_requests.0.requester.phone'));
});

test('student receives only their project invitation and join state', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $student = User::factory()->create(['name' => 'Mahasiswa Undangan']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Product designer',
    ]);
    TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($student, 'invitee')
        ->forRole($role)
        ->create();

    $this->actingAs($student)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('team.capacity.state', 'open')
            ->where('team.permissions.can_request_join', true)
            ->where('team.pending_invitations.0.person.name', $owner->name)
            ->where('team.pending_invitations.0.role.title', 'Product designer')
            ->where('team.pending_invitations.0.status', 'pending')
            ->has('team.join_requests', 0));
});

test('student receives a read-only capacity state when the team is full', function () {
    [$owner, $institution] = detailPageOwnerContext();
    $member = User::factory()->create(['name' => 'Anggota Aktif']);
    $student = User::factory()->create(['name' => 'Mahasiswa Menunggu Slot']);

    foreach ([$member, $student] as $user) {
        InstitutionMembership::factory()
            ->student()
            ->verifiedByApprovedDomain()
            ->for($user)
            ->for($institution)
            ->create();
    }

    $project = Project::factory()
        ->full()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['capacity' => 1]);
    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    $this->actingAs($student)
        ->get(route('projects.show', $project))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('team.capacity.state', 'full')
            ->where('team.capacity.occupied', 1)
            ->where('team.capacity.remaining', 0)
            ->where('team.capacity.is_full', true)
            ->where('team.permissions.can_request_join', false)
            ->where('team.pending_join_request', null));
});
