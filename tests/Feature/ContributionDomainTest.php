<?php

use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

test('contribution lifecycle schema stores versioned provenance with bounded identifiers', function () {
    expect(Schema::hasColumns('contributions', [
        'institution_id',
        'owner_id',
        'project_id',
        'status',
        'current_version_id',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('contribution_versions', [
            'contribution_id',
            'created_by_id',
            'task_id',
            'version_number',
            'claim',
            'summary',
            'declaration',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('contribution_evidence', [
            'contribution_version_id',
            'attachment_id',
            'source_label',
            'notes',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('contribution_reviews', [
            'contribution_version_id',
            'reviewer_id',
            'decision',
            'reason',
            'note',
            'reviewed_at',
        ]))->toBeTrue();

    foreach ([
        'contributions',
        'contribution_versions',
        'contribution_evidence',
        'contribution_reviews',
    ] as $table) {
        foreach (Schema::getIndexes($table) as $index) {
            expect(mb_strlen($index['name']))->toBeLessThanOrEqual(64);
        }
    }
});

test('owner can create and submit a contribution with task provenance and private evidence', function () {
    $fixture = contributionFixture();

    $contribution = app(CreateContribution::class)->handle(
        actor: $fixture['owner'],
        project: $fixture['project'],
        data: [
            'task_id' => $fixture['task']->getKey(),
            'claim' => 'Menyusun alur validasi kontribusi.',
            'summary' => 'Saya menyusun alur validasi dan memastikan task memiliki provenance yang dapat ditinjau.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
            'evidence' => [$fixture['attachment']->getKey()],
        ],
    );

    expect($contribution->status)->toBe(ContributionStatus::Draft)
        ->and($contribution->currentVersion)->not->toBeNull()
        ->and($contribution->currentVersion->version_number)->toBe(1)
        ->and($contribution->currentVersion->task->is($fixture['task']))->toBeTrue()
        ->and($contribution->currentVersion->evidence)->toHaveCount(1)
        ->and($contribution->currentVersion->evidence->first()->attachment->is($fixture['attachment']))->toBeTrue();

    expect(DB::table('contribution_versions')
        ->where('contribution_id', $contribution->getKey())
        ->where('task_id', $fixture['task']->getKey())
        ->where('version_number', 1)
        ->exists())->toBeTrue();
    expect(DB::table('contribution_evidence')
        ->where('contribution_version_id', $contribution->current_version_id)
        ->where('attachment_id', $fixture['attachment']->getKey())
        ->exists())->toBeTrue();

    $submitted = app(SubmitContribution::class)->handle($fixture['owner'], $contribution);

    expect($submitted->status)->toBe(ContributionStatus::Pending)
        ->and(AuditLog::query()->whereIn('operation', [
            'contribution.created',
            'contribution.submitted',
        ])->count())->toBe(2);
});

test('submission requires a current version with active evidence', function () {
    $fixture = contributionFixture();
    $contribution = app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        [
            'task_id' => $fixture['task']->getKey(),
            'claim' => 'Membuat draft kontribusi.',
            'summary' => 'Draft ini belum memiliki evidence.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
            'evidence' => [],
        ],
    );

    expect(fn () => app(SubmitContribution::class)->handle($fixture['owner'], $contribution))
        ->toThrow(ValidationException::class);

    ContributionEvidence::factory()
        ->for($contribution->currentVersion, 'contributionVersion')
        ->for($fixture['attachment'])
        ->create();

    expect(app(SubmitContribution::class)->handle($fixture['owner'], $contribution)->status)
        ->toBe(ContributionStatus::Pending);
});

test('contribution creation rejects task and evidence from another project', function () {
    $fixture = contributionFixture();
    $otherProject = Project::factory()
        ->for($fixture['institution'])
        ->for($fixture['owner'], 'owner')
        ->open()
        ->create();
    $otherTask = Task::factory()
        ->for($otherProject)
        ->for($fixture['owner'], 'createdBy')
        ->create();
    $otherAttachment = Attachment::factory()
        ->evidence()
        ->for($otherProject)
        ->for($fixture['owner'], 'uploadedBy')
        ->create();

    expect(fn () => app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        [
            'task_id' => $otherTask->getKey(),
            'claim' => 'Klaim tidak valid.',
            'summary' => 'Task ini bukan bagian dari project contribution.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
            'evidence' => [$fixture['attachment']->getKey()],
        ],
    ))->toThrow(ValidationException::class);

    expect(fn () => app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        [
            'task_id' => $fixture['task']->getKey(),
            'claim' => 'Klaim dengan evidence asing.',
            'summary' => 'Evidence harus berasal dari project yang sama.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
            'evidence' => [$otherAttachment->getKey()],
        ],
    ))->toThrow(ValidationException::class);

    expect(Contribution::query()->count())->toBe(0);
});

test('tenant and project membership policies protect contribution access', function () {
    $fixture = contributionFixture();
    $contribution = app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        contributionData($fixture),
    );
    $teammate = User::factory()->create();
    InstitutionMembership::factory()
        ->for($teammate)
        ->for($fixture['institution'])
        ->student()
        ->verifiedByRosterExactMatch()
        ->create();
    TeamMembership::factory()
        ->for($fixture['project'])
        ->for($teammate)
        ->active()
        ->create();
    $outsider = User::factory()->create();
    InstitutionMembership::factory()
        ->for($outsider)
        ->for($fixture['institution'])
        ->student()
        ->verifiedByRosterExactMatch()
        ->create();
    $otherInstitution = Institution::factory()->active()->create();
    $otherAdmin = User::factory()->create();
    InstitutionMembership::factory()
        ->for($otherAdmin)
        ->for($otherInstitution)
        ->campusAdmin()
        ->verifiedByCampusAdmin($fixture['owner'])
        ->create();

    expect(Gate::forUser($fixture['owner'])->allows('view', $contribution))->toBeTrue()
        ->and(Gate::forUser($teammate)->allows('view', $contribution))->toBeTrue()
        ->and(Gate::forUser($teammate)->allows('create', [Contribution::class, $fixture['project']]))->toBeTrue()
        ->and(Gate::forUser($outsider)->allows('view', $contribution))->toBeFalse()
        ->and(Gate::forUser($outsider)->allows('create', [Contribution::class, $fixture['project']]))->toBeFalse()
        ->and(Gate::forUser($otherAdmin)->allows('view', $contribution))->toBeFalse();
});

test('campus admin can review pending contribution while students cannot', function () {
    $fixture = contributionFixture();
    $contribution = app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        contributionData($fixture),
    );
    $contribution = app(SubmitContribution::class)->handle($fixture['owner'], $contribution);
    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->for($admin)
        ->for($fixture['institution'])
        ->campusAdmin()
        ->verifiedByCampusAdmin($fixture['owner'])
        ->create();

    expect(Gate::forUser($fixture['owner'])->allows('review', $contribution))->toBeFalse()
        ->and(Gate::forUser($admin)->allows('view', $contribution))->toBeTrue()
        ->and(Gate::forUser($admin)->allows('review', $contribution))->toBeTrue();
});

test('revision appends a version and preserves prior evidence and review provenance', function () {
    $fixture = contributionFixture();
    $newAttachment = Attachment::factory()
        ->evidence()
        ->for($fixture['project'])
        ->for($fixture['owner'], 'uploadedBy')
        ->create();
    $contribution = app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        contributionData($fixture),
    );
    $oldVersion = $contribution->currentVersion;
    ContributionReview::factory()
        ->for($oldVersion, 'contributionVersion')
        ->for($fixture['owner'], 'reviewer')
        ->revisionRequested()
        ->create();
    $contribution->forceFill(['status' => ContributionStatus::Revision])->save();

    $revised = app(ReviseContribution::class)->handle(
        $fixture['owner'],
        $contribution,
        [
            'claim' => 'Menyusun alur validasi kontribusi versi revisi.',
            'evidence' => [$newAttachment->getKey()],
        ],
    );

    $newVersion = $revised->currentVersion;
    $oldVersion->refresh();

    expect($revised->status)->toBe(ContributionStatus::Draft)
        ->and($revised->versions)->toHaveCount(2)
        ->and($newVersion->version_number)->toBe(2)
        ->and($newVersion->claim)->toContain('versi revisi')
        ->and($oldVersion->claim)->toBe('Menyusun alur validasi kontribusi.')
        ->and($oldVersion->evidence)->toHaveCount(1)
        ->and($newVersion->evidence)->toHaveCount(2)
        ->and($oldVersion->reviews)->toHaveCount(1)
        ->and(ContributionReview::query()->count())->toBe(1)
        ->and($revised->current_version_id)->toBe($newVersion->getKey());

    expect(fn () => $oldVersion->forceFill(['claim' => 'Perubahan ilegal'])->save())
        ->toThrow(LogicException::class);
    expect(fn () => $oldVersion->delete())->toThrow(LogicException::class);
    expect(fn () => DB::table('contribution_versions')
        ->where('id', $oldVersion->getKey())
        ->update(['claim' => 'Perubahan langsung']))
        ->toThrow(QueryException::class);
});

test('review and evidence records are append-only and non-approved reviews require a reason', function () {
    $fixture = contributionFixture();
    $contribution = app(CreateContribution::class)->handle(
        $fixture['owner'],
        $fixture['project'],
        contributionData($fixture),
    );
    $version = $contribution->currentVersion;

    expect(fn () => ContributionReview::query()->forceCreate([
        'contribution_version_id' => $version->getKey(),
        'reviewer_id' => $fixture['owner']->getKey(),
        'decision' => ContributionReviewDecision::Revision,
        'reason' => null,
        'note' => null,
        'reviewed_at' => now(),
    ]))->toThrow(QueryException::class);

    $review = ContributionReview::factory()
        ->for($version, 'contributionVersion')
        ->for($fixture['owner'], 'reviewer')
        ->approved()
        ->create();
    $evidence = $version->evidence->first();

    expect($review->decision)->toBe(ContributionReviewDecision::Approved)
        ->and(fn () => $review->forceFill(['note' => 'Perubahan'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $review->delete())->toThrow(LogicException::class)
        ->and(fn () => $evidence->forceFill(['notes' => 'Perubahan'])->save())
        ->toThrow(LogicException::class)
        ->and(fn () => $evidence->delete())->toThrow(LogicException::class);
});

test('contribution status allows only the versioned lifecycle transitions', function () {
    expect(ContributionStatus::Draft->canTransitionTo(ContributionStatus::Pending))->toBeTrue()
        ->and(ContributionStatus::Pending->canTransitionTo(ContributionStatus::Revision))->toBeTrue()
        ->and(ContributionStatus::Revision->canTransitionTo(ContributionStatus::Draft))->toBeTrue()
        ->and(ContributionStatus::Approved->canTransitionTo(ContributionStatus::Archived))->toBeTrue()
        ->and(ContributionStatus::Rejected->canTransitionTo(ContributionStatus::Draft))->toBeFalse()
        ->and(ContributionStatus::Archived->canCreateVersion())->toBeFalse();
});

test('a student from another institution cannot create a contribution in this project', function () {
    $fixture = contributionFixture();
    $otherInstitution = Institution::factory()->active()->create();
    $otherStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->for($otherStudent)
        ->for($otherInstitution)
        ->student()
        ->verifiedByRosterExactMatch()
        ->create();

    expect(fn () => app(CreateContribution::class)->handle(
        $otherStudent,
        $fixture['project'],
        contributionData($fixture),
    ))->toThrow(AuthorizationException::class);
});

/**
 * @return array{institution: Institution, owner: User, project: Project, task: Task, attachment: Attachment}
 */
function contributionFixture(): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create();
    InstitutionMembership::factory()
        ->for($owner)
        ->for($institution)
        ->student()
        ->verifiedByRosterExactMatch()
        ->create();
    $project = Project::factory()
        ->for($institution)
        ->for($owner, 'owner')
        ->open()
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

    return compact('institution', 'owner', 'project', 'task', 'attachment');
}

/**
 * @param  array{task: Task, attachment: Attachment}  $fixture
 * @return array<string, mixed>
 */
function contributionData(array $fixture): array
{
    return [
        'task_id' => $fixture['task']->getKey(),
        'claim' => 'Menyusun alur validasi kontribusi.',
        'summary' => 'Saya menyusun alur validasi dan memastikan task memiliki provenance yang dapat ditinjau.',
        'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        'evidence' => [$fixture['attachment']->getKey()],
    ];
}
