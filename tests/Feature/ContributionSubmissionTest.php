<?php

use App\Enums\ContributionStatus;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ContributionSubmittedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('student can create a contribution draft through the scoped route', function () {
    $fixture = submissionContributionFixture();

    $response = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        submissionContributionData($fixture),
    );

    $contribution = Contribution::query()->firstOrFail();

    $response
        ->assertCreated()
        ->assertJsonPath('data.id', $contribution->getKey())
        ->assertJsonPath('data.status', ContributionStatus::Draft->value)
        ->assertJsonPath('data.current_version.version_number', 1)
        ->assertJsonPath('data.current_version.evidence.0.attachment_id', $fixture['attachment']->getKey())
        ->assertJsonMissingPath('data.current_version.evidence.0.attachment.path')
        ->assertJsonMissingPath('data.current_version.evidence.0.attachment.disk')
        ->assertJsonMissingPath('data.current_version.evidence.0.attachment.sha256');

    expect(AuditLog::query()
        ->where('auditable_id', $contribution->getKey())
        ->where('operation', 'contribution.created')
        ->exists())->toBeTrue();
});

test('student can link evidence as a new immutable version', function () {
    $fixture = submissionContributionFixture();
    $newAttachment = Attachment::factory()
        ->evidence()
        ->for($fixture['project'])
        ->for($fixture['owner'], 'uploadedBy')
        ->create(['original_name' => 'evidence-tambahan.pdf']);

    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        submissionContributionData($fixture),
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));

    $response = $this->actingAs($fixture['owner'])->postJson(
        route('contributions.evidence.store', $contribution),
        ['evidence' => [$newAttachment->getKey()]],
    );

    $response
        ->assertOk()
        ->assertJsonPath('data.status', ContributionStatus::Draft->value)
        ->assertJsonPath('data.current_version.version_number', 2)
        ->assertJsonCount(2, 'data.current_version.evidence');

    expect($contribution->fresh()->versions)->toHaveCount(2)
        ->and($contribution->fresh()->versions->first()->evidence)->toHaveCount(1)
        ->and(AuditLog::query()
            ->where('auditable_id', $contribution->getKey())
            ->where('operation', 'contribution.revised')
            ->count())->toBe(1);
});

test('submission requires evidence and repeated submit does not append audit history', function () {
    Notification::fake();
    $fixture = submissionContributionFixture();
    $data = submissionContributionData($fixture);
    $data['evidence'] = [];

    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        $data,
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.submit', $contribution))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('evidence');

    expect($contribution->fresh()->status)->toBe(ContributionStatus::Draft)
        ->and(AuditLog::query()->where('operation', 'contribution.submitted')->count())->toBe(0);

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.evidence.store', $contribution), [
            'evidence' => [$fixture['attachment']->getKey()],
        ])
        ->assertOk();

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.submit', $contribution->fresh()))
        ->assertOk()
        ->assertJsonPath('data.status', ContributionStatus::Pending->value);

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.submit', $contribution->fresh()))
        ->assertForbidden();

    expect(AuditLog::query()->where('operation', 'contribution.submitted')->count())->toBe(1);
});

test('submit notifies only verified campus reviewers through the database boundary', function () {
    Notification::fake();
    $fixture = submissionContributionFixture();
    $otherInstitution = Institution::factory()->active()->create();
    $otherAdmin = User::factory()->create();

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($otherAdmin)
        ->for($otherInstitution)
        ->create();

    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        submissionContributionData($fixture),
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.submit', $contribution))
        ->assertOk();

    Notification::assertSentTo($fixture['admin'], ContributionSubmittedNotification::class);
    Notification::assertNotSentTo($otherAdmin, ContributionSubmittedNotification::class);

    $notification = new ContributionSubmittedNotification($contribution->fresh());

    expect($notification->via($fixture['admin']))->toBe(['database'])
        ->and($notification->toArray($fixture['admin']))
        ->not->toHaveKeys(['path', 'disk', 'sha256', 'phone', 'evidence']);
});

test('student can respond to a revision request by appending a draft version', function () {
    $fixture = submissionContributionFixture();
    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        submissionContributionData($fixture),
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));
    $version = $contribution->currentVersion;

    ContributionReview::factory()
        ->for($version, 'contributionVersion')
        ->for($fixture['admin'], 'reviewer')
        ->revisionRequested()
        ->create();
    $contribution->forceFill(['status' => ContributionStatus::Revision])->save();

    $response = $this->actingAs($fixture['owner'])->postJson(
        route('contributions.revisions.store', $contribution),
        ['claim' => 'Klaim kontribusi setelah menanggapi catatan reviewer.'],
    );

    $response
        ->assertOk()
        ->assertJsonPath('data.status', ContributionStatus::Draft->value)
        ->assertJsonPath('data.current_version.version_number', 2)
        ->assertJsonPath('data.current_version.claim', 'Klaim kontribusi setelah menanggapi catatan reviewer.');

    expect($contribution->fresh()->versions)->toHaveCount(2)
        ->and($contribution->fresh()->versions->first()->reviews)->toHaveCount(1)
        ->and(AuditLog::query()->where('operation', 'contribution.revised')->count())->toBe(1);
});

test('cross tenant student cannot read or mutate a contribution route', function () {
    $fixture = submissionContributionFixture();
    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture['project']),
        submissionContributionData($fixture),
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));

    $otherInstitution = Institution::factory()->active()->create();
    $outsider = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($outsider)
        ->for($otherInstitution)
        ->create();

    $this->actingAs($outsider)
        ->getJson(route('contributions.show', $contribution))
        ->assertForbidden();

    $this->actingAs($outsider)
        ->postJson(route('contributions.evidence.store', $contribution), [
            'evidence' => [$fixture['attachment']->getKey()],
        ])
        ->assertForbidden();
});

test('revision route rejects an empty revision payload', function () {
    $fixture = submissionContributionFixture();
    $createResponse = $this->actingAs($fixture['owner'])->postJson(
        route('projects.contributions.store', $fixture),
        submissionContributionData($fixture),
    );
    $contribution = Contribution::query()->findOrFail($createResponse->json('data.id'));

    $this->actingAs($fixture['owner'])
        ->postJson(route('contributions.revisions.store', $contribution), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('revision');
});

/**
 * @return array{institution: Institution, owner: User, admin: User, project: Project, task: Task, attachment: Attachment}
 */
function submissionContributionFixture(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($owner)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByCampusAdmin($owner)
        ->for($admin)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create();
    $task = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create();
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($owner, 'uploadedBy')
        ->create();

    return compact('institution', 'owner', 'admin', 'project', 'task', 'attachment');
}

/**
 * @param  array{task: Task, attachment: Attachment}  $fixture
 * @return array<string, mixed>
 */
function submissionContributionData(array $fixture): array
{
    return [
        'task_id' => $fixture['task']->getKey(),
        'claim' => 'Menyusun alur validasi kontribusi.',
        'summary' => 'Saya menyusun alur validasi dengan provenance task dan evidence privat.',
        'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        'evidence' => [$fixture['attachment']->getKey()],
    ];
}
