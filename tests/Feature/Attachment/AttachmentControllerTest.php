<?php

declare(strict_types=1);

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * @return array{owner: User, member: User, institution: Institution, project: Project}
 */
function attachmentControllerContext(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = attachmentVerifiedStudent($institution, 'Attachment Owner');
    $member = attachmentVerifiedStudent($institution, 'Attachment Member');

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    return compact('owner', 'member', 'institution', 'project');
}

function attachmentVerifiedStudent(Institution $institution, string $name): User
{
    $student = User::factory()->create(['name' => $name]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

test('attachment schema and private disk contract are explicit', function () {
    expect(Schema::hasTable('attachments'))->toBeTrue()
        ->and(Schema::hasColumns('attachments', [
            'project_id',
            'message_id',
            'uploaded_by_id',
            'purpose',
            'disk',
            'path',
            'original_name',
            'mime_type',
            'size_bytes',
            'sha256',
            'deduplication_key',
            'deleted_at',
        ]))->toBeTrue()
        ->and(collect(Schema::getIndexes('attachments'))->pluck('name'))
        ->toContain(
            'attachments_project_message_created_idx',
            'attachments_project_checksum_deleted_idx',
        )
        ->and(config('filesystems.disks.private.root'))->toContain('storage')
        ->and(config('filesystems.disks.private.serve'))->toBeFalse();

    $migration = file_get_contents(
        database_path('migrations/2026_08_12_095400_create_attachments_table.php'),
    );

    expect($migration)->toBeString()
        ->toContain("'attachments_project_fk'")
        ->toContain("'attachments_message_fk'")
        ->toContain("'attachments_project_checksum_deleted_idx'");
});

test('active team members can upload safe private evidence metadata', function () {
    Storage::fake('private');
    ['member' => $member, 'project' => $project, 'institution' => $institution] = attachmentControllerContext();
    $message = Message::factory()
        ->for($project)
        ->for($member, 'author')
        ->create();
    $file = UploadedFile::fake()->create('hasil kerja.pdf', 20, 'application/pdf');

    $response = $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), [
            'file' => $file,
            'purpose' => AttachmentPurpose::Evidence->value,
            'message_id' => $message->getKey(),
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.purpose', AttachmentPurpose::Evidence->value)
        ->assertJsonPath('data.message_id', $message->getKey())
        ->assertJsonPath('data.original_name', 'hasil kerja.pdf')
        ->assertJsonPath('data.mime_type', 'application/pdf')
        ->assertJsonPath('data.uploaded_by.id', $member->getKey())
        ->assertJsonMissingPath('data.disk')
        ->assertJsonMissingPath('data.path')
        ->assertJsonMissingPath('data.sha256');

    $attachment = Attachment::query()->firstOrFail();

    expect($attachment->project_id)->toBe($project->getKey())
        ->and($attachment->message_id)->toBe($message->getKey())
        ->and($attachment->uploaded_by_id)->toBe($member->getKey())
        ->and($attachment->path)
        ->toStartWith("institutions/{$institution->getKey()}/projects/{$project->getKey()}/attachments/")
        ->and($attachment->path)->not->toContain('hasil kerja.pdf')
        ->and($attachment->disk)->toBe('private');

    Storage::disk('private')->assertExists($attachment->path);
    expect(AuditLog::query()->where('operation', 'attachment.uploaded')->exists())->toBeTrue();
});

test('authorized members can download an attachment but receive no public URL', function () {
    Storage::fake('private');
    ['member' => $member, 'project' => $project] = attachmentControllerContext();
    $file = UploadedFile::fake()->create('catatan.txt', 2, 'text/plain');

    $created = $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $file])
        ->assertCreated();
    $attachment = Attachment::query()->findOrFail($created->json('data.id'));

    $this->actingAs($member)
        ->get(route('projects.workspace.attachments.download', [
            'project' => $project,
            'attachment' => $attachment,
        ]))
        ->assertDownload('catatan.txt')
        ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    $preview = $this->actingAs($member)
        ->get(route('projects.workspace.attachments.preview', [
            'project' => $project,
            'attachment' => $attachment,
        ]));

    $preview->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    expect($preview->headers->get('Content-Disposition'))->toStartWith('inline;');
});

test('non-members cannot download an attachment across workspace boundaries', function () {
    Storage::fake('private');
    ['member' => $member, 'project' => $project] = attachmentControllerContext();
    $reader = attachmentVerifiedStudent($project->institution, 'Attachment Reader');
    $file = UploadedFile::fake()->create('private.pdf', 5, 'application/pdf');

    $created = $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $file])
        ->assertCreated();
    $attachment = Attachment::query()->findOrFail($created->json('data.id'));

    $this->actingAs($reader)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), [
            'file' => UploadedFile::fake()->create('unauthorized.pdf', 5, 'application/pdf'),
        ])
        ->assertForbidden();

    $this->actingAs($reader)
        ->get(route('projects.workspace.attachments.download', [
            'project' => $project,
            'attachment' => $attachment,
        ]))
        ->assertForbidden();
});

test('missing files return not found without exposing storage internals', function () {
    Storage::fake('private');
    ['member' => $member, 'project' => $project] = attachmentControllerContext();
    $file = UploadedFile::fake()->create('missing.pdf', 5, 'application/pdf');

    $created = $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $file])
        ->assertCreated();
    $attachment = Attachment::query()->findOrFail($created->json('data.id'));
    Storage::disk('private')->delete($attachment->path);

    $this->actingAs($member)
        ->get(route('projects.workspace.attachments.download', [
            'project' => $project,
            'attachment' => $attachment,
        ]))
        ->assertNotFound();
});

test('duplicate active uploads for the same project context are rejected and cleaned up', function () {
    Storage::fake('private');
    ['member' => $member, 'project' => $project] = attachmentControllerContext();
    $contents = 'same-evidence-content';
    $firstFile = UploadedFile::fake()->createWithContent('evidence.pdf', $contents);
    $secondFile = UploadedFile::fake()->createWithContent('renamed-evidence.pdf', $contents);

    $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $firstFile])
        ->assertCreated();

    $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $secondFile])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('file');

    expect(Attachment::query()->count())->toBe(1);
    expect(Storage::disk('private')->allFiles())->toHaveCount(1);
});

test('invalid MIME, executable, and oversized files are rejected', function (string $name, int $size, string $mime) {
    Storage::fake('private');
    ['member' => $member, 'project' => $project] = attachmentControllerContext();

    $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), [
            'file' => UploadedFile::fake()->create($name, $size, $mime),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('file');
})->with([
    'executable' => ['payload.exe', 10, 'application/x-msdownload'],
    'mime mismatch' => ['payload.pdf', 10, 'application/x-msdownload'],
    'oversized' => ['large.pdf', 10241, 'application/pdf'],
]);

test('uploader or project owner can delete and re-upload after cleanup', function () {
    Storage::fake('private');
    ['owner' => $owner, 'member' => $member, 'project' => $project] = attachmentControllerContext();
    $file = UploadedFile::fake()->createWithContent('replaceable.pdf', 'replaceable-content');

    $created = $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), ['file' => $file])
        ->assertCreated();
    $attachment = Attachment::query()->findOrFail($created->json('data.id'));
    $path = $attachment->path;

    $this->actingAs($owner)
        ->deleteJson(route('projects.workspace.attachments.destroy', [
            'project' => $project,
            'attachment' => $attachment,
        ]))
        ->assertOk()
        ->assertJsonPath('data.deleted', true)
        ->assertJsonPath('data.attachment_id', $attachment->getKey());

    expect($attachment->fresh()->deleted_at)->not->toBeNull();
    Storage::disk('private')->assertMissing($path);
    expect(AuditLog::query()->where('operation', 'attachment.deleted')->exists())->toBeTrue();

    $this->actingAs($member)
        ->withHeader('Accept', 'application/json')
        ->post(route('projects.workspace.attachments.store', $project), [
            'file' => UploadedFile::fake()->createWithContent('replaceable-again.pdf', 'replaceable-content'),
        ])
        ->assertCreated();
});
