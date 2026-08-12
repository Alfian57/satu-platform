<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

/**
 * @return array{owner: User, member: User, institution: Institution, project: Project}
 */
function discussionControllerContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = discussionVerifiedStudent($institution, 'Discussion Owner');
    $member = discussionVerifiedStudent($institution, 'Discussion Member');

    $project = Project::factory()
        ->open()
        ->for($owner, 'owner')
        ->for($institution)
        ->create([
            'title' => 'Discussion project',
        ]);

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    return compact('owner', 'member', 'institution', 'project');
}

function discussionVerifiedStudent(Institution $institution, ?string $name = null): User
{
    $student = User::factory()->create([
        'name' => $name ?? 'Discussion Student',
    ]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

test('discussion schema has tenant foreign keys and deterministic ordering index', function () {
    expect(Schema::hasTable('messages'))->toBeTrue()
        ->and(Schema::hasColumns('messages', [
            'project_id',
            'author_id',
            'body',
        ]))->toBeTrue()
        ->and(collect(Schema::getIndexes('messages'))->pluck('name'))
        ->toContain('messages_project_created_idx');

    $migration = file_get_contents(
        database_path('migrations/2026_08_12_091536_create_messages_table.php'),
    );

    expect($migration)->toBeString()
        ->toContain("'messages_project_fk'")
        ->toContain("'messages_author_fk'")
        ->toContain("'messages_project_created_idx'");
});

test('active members can create and paginate newest discussions with a safe projection', function () {
    ['member' => $member, 'owner' => $owner, 'project' => $project] = discussionControllerContext();
    $old = Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Pesan paling lama.',
            'created_at' => now()->subMinutes(3),
            'updated_at' => now()->subMinutes(3),
        ]);
    $middle = Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Pesan di tengah.',
            'created_at' => now()->subMinutes(2),
            'updated_at' => now()->subMinutes(2),
        ]);
    $new = Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Pesan terbaru.',
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);

    $this->actingAs($member)
        ->getJson(route('projects.workspace.discussions.index', [
            'project' => $project,
            'per_page' => 2,
        ]))
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $new->getKey())
        ->assertJsonPath('data.1.id', $middle->getKey())
        ->assertJsonPath('meta.total', 3)
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonMissingPath('data.0.project_id')
        ->assertJsonMissingPath('data.0.institution_id')
        ->assertJsonMissingPath('data.0.author.username')
        ->assertJsonMissingPath('data.0.author.password');

    $this->actingAs($member)
        ->getJson(route('projects.workspace.discussions.index', [
            'project' => $project,
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $old->getKey());

    $created = $this->actingAs($member)
        ->postJson(
            route('projects.workspace.discussions.store', $project),
            ['body' => '  Catatan baru untuk team.  '],
        )
        ->assertCreated()
        ->assertJsonPath('data.body', 'Catatan baru untuk team.')
        ->assertJsonPath('data.author.id', $member->getKey());

    expect(Message::query()->findOrFail($created->json('data.id'))->author_id)
        ->toBe($member->getKey());
});

test('only the author can edit while the author or project owner can delete', function () {
    ['member' => $member, 'owner' => $owner, 'project' => $project] = discussionControllerContext();
    $createdMemberMessage = $this->actingAs($member)
        ->postJson(
            route('projects.workspace.discussions.store', $project),
            ['body' => 'Pesan milik anggota.'],
        )
        ->assertCreated();
    $memberMessage = Message::query()->findOrFail($createdMemberMessage->json('data.id'));
    $memberMessage->forceFill([
        'created_at' => now()->subMinute(),
        'updated_at' => now()->subMinute(),
    ])->saveQuietly();
    $ownerMessage = Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Pesan milik owner.',
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);

    $this->actingAs($member)
        ->patchJson(
            route('projects.workspace.discussions.update', [
                'project' => $project,
                'message' => $memberMessage,
            ]),
            ['body' => 'Pesan anggota yang sudah diedit.'],
        )
        ->assertOk()
        ->assertJsonPath('data.body', 'Pesan anggota yang sudah diedit.')
        ->assertJsonPath('data.is_edited', true);

    $this->actingAs($member)
        ->patchJson(
            route('projects.workspace.discussions.update', [
                'project' => $project,
                'message' => $ownerMessage,
            ]),
            ['body' => 'Tidak boleh mengedit pesan orang lain.'],
        )
        ->assertForbidden();

    $this->actingAs($member)
        ->deleteJson(route('projects.workspace.discussions.destroy', [
            'project' => $project,
            'message' => $ownerMessage,
        ]))
        ->assertForbidden();

    $this->actingAs($owner)
        ->deleteJson(route('projects.workspace.discussions.destroy', [
            'project' => $project,
            'message' => $memberMessage,
        ]))
        ->assertOk()
        ->assertJsonPath('data.deleted', true)
        ->assertJsonPath('data.message_id', $memberMessage->getKey());

    expect(Message::query()->whereKey($memberMessage)->exists())->toBeFalse()
        ->and(AuditLog::query()->where('operation', 'discussion.created')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'discussion.updated')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'discussion.deleted')->exists())->toBeTrue();

    $auditPayload = AuditLog::query()
        ->whereIn('operation', [
            'discussion.created',
            'discussion.updated',
            'discussion.deleted',
        ])
        ->get()
        ->toJson();

    expect($auditPayload)->not->toContain('Pesan anggota yang sudah diedit.');
});

test('discussion routes deny non-members and keep child binding inside the project', function () {
    ['member' => $member, 'institution' => $institution, 'project' => $project] = discussionControllerContext();
    $otherOwner = discussionVerifiedStudent($institution, 'Other Project Owner');
    $otherProject = Project::factory()
        ->open()
        ->for($otherOwner, 'owner')
        ->for($institution)
        ->create();
    $foreignMessage = Message::factory()
        ->for($otherProject)
        ->for($otherOwner, 'author')
        ->create();

    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = discussionVerifiedStudent($foreignInstitution, 'Foreign Student');

    $this->actingAs($otherOwner)
        ->getJson(route('projects.workspace.discussions.index', $project))
        ->assertForbidden();

    $this->actingAs($foreignStudent)
        ->getJson(route('projects.workspace.discussions.index', $project))
        ->assertForbidden();

    $this->actingAs($member)
        ->patchJson(
            route('projects.workspace.discussions.update', [
                'project' => $project,
                'message' => $foreignMessage,
            ]),
            ['body' => 'Tidak boleh lintas project.'],
        )
        ->assertNotFound();
});

test('discussion body is required and bounded', function () {
    ['member' => $member, 'project' => $project] = discussionControllerContext();

    $this->actingAs($member)
        ->postJson(
            route('projects.workspace.discussions.store', $project),
            ['body' => '   '],
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');

    $this->actingAs($member)
        ->postJson(
            route('projects.workspace.discussions.store', $project),
            ['body' => str_repeat('x', 5001)],
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
});
