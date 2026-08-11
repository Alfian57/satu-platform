<?php

use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution}
 */
function projectCommandOwnerContext(): array
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

/**
 * @return array<string, mixed>
 */
function projectCommandPayload(Institution $institution, ?SkillTaxonomy $skill = null): array
{
    return [
        'institution_id' => $institution->getKey(),
        'title' => 'Project kolaborasi kampus',
        'description' => 'Project untuk menguji command lifecycle.',
        'visibility' => ProjectVisibility::Institution->value,
        'capacity' => 3,
        'deadline' => now()->addWeeks(3)->toIso8601String(),
        'roles' => [[
            'title' => 'Backend Engineer',
            'description' => 'Membangun integrasi domain.',
            'capacity' => 2,
            'skills' => $skill === null ? [] : [[
                'taxonomy_id' => $skill->getKey(),
                'proficiency' => 'advanced',
            ]],
        ]],
    ];
}

test('verified owner can create a draft project and the command is audited', function () {
    [$owner, $institution] = projectCommandOwnerContext();

    $response = $this->actingAs($owner)->postJson(
        route('projects.store'),
        projectCommandPayload($institution),
    );

    $response->assertCreated()
        ->assertJsonPath('data.status', ProjectStatus::Draft->value)
        ->assertJsonPath('data.owner_id', $owner->getKey())
        ->assertJsonPath('data.institution_id', $institution->getKey());

    $project = Project::query()->firstOrFail();

    expect($project->status)->toBe(ProjectStatus::Draft)
        ->and(AuditLog::query()
            ->where('operation', 'project.created')
            ->where('auditable_id', $project->getKey())
            ->exists())->toBeTrue();
});

test('owner can update project metadata and replace requirements while other tenants are denied', function () {
    [$owner, $institution] = projectCommandOwnerContext();
    $skill = SkillTaxonomy::factory()->create();
    $project = Project::factory()
        ->draft()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();

    $response = $this->actingAs($owner)->patchJson(
        route('projects.update', $project),
        [
            'title' => 'Project diperbarui',
            'capacity' => 2,
            'roles' => [[
                'title' => 'Data Engineer',
                'capacity' => 2,
                'skills' => [[
                    'taxonomy_id' => $skill->getKey(),
                    'proficiency' => 'intermediate',
                ]],
            ]],
        ],
    );

    $response->assertOk()
        ->assertJsonPath('data.title', 'Project diperbarui')
        ->assertJsonPath('data.capacity', 2)
        ->assertJsonCount(1, 'data.roles');

    expect(ProjectRole::query()->where('project_id', $project->getKey())->count())->toBe(1)
        ->and(AuditLog::query()
            ->where('operation', 'project.updated')
            ->where('auditable_id', $project->getKey())
            ->exists())->toBeTrue();

    $this->actingAs($owner)
        ->patchJson(route('projects.update', $project), ['capacity' => 1])
        ->assertStatus(422)
        ->assertJsonValidationErrors('capacity');

    expect($project->refresh()->capacity)->toBe(2);

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignUser = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($foreignUser)
        ->for($foreignInstitution)
        ->create();

    $this->actingAs($foreignUser)
        ->patchJson(route('projects.update', $project), ['title' => 'Tidak boleh'])
        ->assertForbidden();
});

test('project lifecycle commands open, cancel, archive, and audit each transition', function () {
    [$owner, $institution] = projectCommandOwnerContext();
    $response = $this->actingAs($owner)->postJson(
        route('projects.store'),
        projectCommandPayload($institution),
    );
    $project = Project::query()->firstOrFail();

    $response->assertCreated();

    $this->actingAs($owner)
        ->postJson(route('projects.open', $project), ['reason' => 'Requirement sudah siap'])
        ->assertOk()
        ->assertJsonPath('data.status', ProjectStatus::Open->value);

    $this->actingAs($owner)
        ->postJson(route('projects.cancel', $project), ['reason' => 'Scope berubah'])
        ->assertOk()
        ->assertJsonPath('data.status', ProjectStatus::Cancelled->value);

    $this->actingAs($owner)
        ->postJson(route('projects.archive', $project), ['reason' => 'Riwayat ditutup'])
        ->assertOk()
        ->assertJsonPath('data.status', ProjectStatus::Archived->value);

    expect(AuditLog::query()
        ->where('auditable_id', $project->getKey())
        ->whereIn('operation', [
            'project.created',
            'project.opened',
            'project.cancelled',
            'project.archived',
        ])
        ->count())->toBe(4);
});

test('invalid project transitions return validation errors without changing state or audit history', function () {
    [$owner, $institution] = projectCommandOwnerContext();
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $auditCount = AuditLog::query()->count();

    $this->actingAs($owner)
        ->postJson(route('projects.open', $project))
        ->assertStatus(422)
        ->assertJsonValidationErrors('status');

    $this->actingAs($owner)
        ->postJson(route('projects.archive', $project))
        ->assertStatus(422)
        ->assertJsonValidationErrors('status');

    expect($project->refresh()->status)->toBe(ProjectStatus::Open)
        ->and(AuditLog::query()->count())->toBe($auditCount);
});

test('unverified membership and non-owner cannot create or mutate institution projects', function () {
    $institution = Institution::factory()->active()->create();
    $unverified = User::factory()->create();
    InstitutionMembership::factory()
        ->unverified()
        ->for($unverified)
        ->for($institution)
        ->create();

    $this->actingAs($unverified)
        ->postJson(route('projects.store'), projectCommandPayload($institution))
        ->assertForbidden();

    [$owner, $ownerInstitution] = projectCommandOwnerContext();
    $project = Project::factory()
        ->draft()
        ->for($ownerInstitution)
        ->for($owner, 'owner')
        ->create();
    $sameInstitutionStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($sameInstitutionStudent)
        ->for($ownerInstitution)
        ->create();

    $this->actingAs($sameInstitutionStudent)
        ->postJson(route('projects.open', $project))
        ->assertForbidden();
});
