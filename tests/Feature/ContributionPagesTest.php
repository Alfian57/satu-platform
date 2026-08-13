<?php

declare(strict_types=1);

use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\PortfolioVisibility;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('student contribution pages expose only their tenant-scoped ledger and composer options', function () {
    $context = contributionPageContext();
    $contribution = contributionPageContribution($context);
    $foreignProject = Project::factory()
        ->open()
        ->for(Institution::factory()->active())
        ->create(['title' => 'Project tenant lain']);

    $this->actingAs($context['student'])
        ->get(route('contributions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/index')
            ->where('can_create', true)
            ->has('contributions', 1)
            ->where('contributions.0.id', $contribution->getKey())
            ->where('contributions.0.project.title', $context['project']->title)
            ->missing('contributions.0.owner')
            ->missing('contributions.0.current_version.claim'));

    $this->actingAs($context['student'])
        ->get(route('contributions.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/create')
            ->where('can_create', true)
            ->has('projects', 1)
            ->where('projects.0.id', $context['project']->getKey())
            ->where('projects.0.tasks.0.id', $context['task']->getKey())
            ->where('projects.0.evidence.0.id', $context['attachment']->getKey())
            ->missing('projects.0.evidence.0.path')
            ->missing('projects.0.evidence.0.disk'));

    expect($foreignProject->institution_id)->not->toBe($context['institution']->getKey());
});

test('student can open a contribution docket with review feedback and immutable history', function () {
    $context = contributionPageContext();
    $contribution = contributionPageContribution($context);

    $this->actingAs($context['student'])
        ->get(route('contributions.show', $contribution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/show')
            ->where('contribution.id', $contribution->getKey())
            ->where('contribution.current_version.claim', 'Klaim contribution untuk halaman student.')
            ->where('contribution.current_version.evidence.0.available', true)
            ->where('permissions.can_update', true)
            ->where('permissions.can_submit', true)
            ->has('contribution.versions', 1)
            ->has('contribution.reviews', 0));
});

test('student contribution docket exposes task to review to portfolio provenance', function () {
    $reference = now();

    try {
        Carbon::setTestNow($reference->copy()->subMinutes(3));
        $context = contributionPageContext();
        $contribution = contributionPageContribution($context);
        $reviewer = User::factory()->create(['name' => 'Reviewer Provenance']);

        InstitutionMembership::factory()
            ->campusAdmin()
            ->verifiedByApprovedDomain()
            ->for($reviewer)
            ->for($context['institution'])
            ->create();

        $version = $contribution->currentVersion;
        Carbon::setTestNow($reference->copy()->subMinute());
        ContributionReview::factory()
            ->for($version, 'contributionVersion')
            ->for($reviewer, 'reviewer')
            ->approved()
            ->create();
        $contribution->forceFill(['status' => ContributionStatus::Approved])->save();

        Carbon::setTestNow($reference);
        $entry = PortfolioEntry::factory()->create([
            'institution_id' => $context['institution']->getKey(),
            'user_id' => $context['student']->getKey(),
            'contribution_id' => $contribution->getKey(),
            'contribution_version_id' => $version->getKey(),
            'visibility' => PortfolioVisibility::Private,
        ]);
    } finally {
        Carbon::setTestNow();
    }

    $this->actingAs($context['student'])
        ->get(route('contributions.show', $contribution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('contribution.provenance.timeline', 3)
            ->where('contribution.provenance.timeline.0.type', 'version_created')
            ->where('contribution.provenance.timeline.1.type', 'review_decision')
            ->where('contribution.provenance.timeline.1.decision', ContributionReviewDecision::Approved->value)
            ->where('contribution.provenance.timeline.1.reviewer.name', $reviewer->name)
            ->where('contribution.provenance.timeline.2.type', 'portfolio_projection')
            ->where('contribution.provenance.portfolio.id', $entry->getKey())
            ->where('contribution.provenance.portfolio.status', 'private')
            ->missing('contribution.provenance.timeline.1.reason')
            ->missing('contribution.provenance.timeline.1.note'));
});

test('detail keeps a deleted evidence reference visible as a recoverable missing file', function () {
    $context = contributionPageContext();
    $contribution = contributionPageContribution($context);
    $context['attachment']->delete();

    $this->actingAs($context['student'])
        ->get(route('contributions.show', $contribution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/show')
            ->where('contribution.current_version.evidence.0.available', false)
            ->where('contribution.current_version.evidence.0.attachment.original_name', 'catatan-validasi.pdf'));
});

test('student without a verified affiliation receives a safe empty contribution boundary', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->get(route('contributions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/index')
            ->where('can_create', false)
            ->has('contributions', 0));

    $this->actingAs($student)
        ->get(route('contributions.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contributions/create')
            ->where('can_create', false)
            ->has('projects', 0));
});

test('cross tenant student cannot open the contribution page', function () {
    $context = contributionPageContext();
    $contribution = contributionPageContribution($context);
    $foreignInstitution = Institution::factory()->active()->create();
    $outsider = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($outsider)
        ->for($foreignInstitution)
        ->create();

    $this->actingAs($outsider)
        ->get(route('contributions.show', $contribution))
        ->assertForbidden();
});

/**
 * @return array{institution: Institution, student: User, project: Project, task: Task, attachment: Attachment}
 */
function contributionPageContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Contribution Pages',
    ]);
    $student = User::factory()->create(['name' => 'Student Contribution Pages']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create(['title' => 'Project contribution pages']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Task contribution pages']);
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($student, 'uploadedBy')
        ->create(['original_name' => 'catatan-validasi.pdf']);

    return compact('institution', 'student', 'project', 'task', 'attachment');
}

/**
 * @param  array{project: Project, student: User, task: Task, attachment: Attachment}  $context
 */
function contributionPageContribution(array $context): Contribution
{
    $contribution = Contribution::factory()
        ->draft()
        ->for($context['project'])
        ->for($context['student'], 'owner')
        ->create(['institution_id' => $context['project']->institution_id]);
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $context['task']->getKey()])
        ->create([
            'claim' => 'Klaim contribution untuk halaman student.',
            'summary' => 'Ringkasan pekerjaan yang dapat ditinjau reviewer.',
        ]);

    ContributionEvidence::query()->forceCreate([
        'contribution_version_id' => $version->getKey(),
        'attachment_id' => $context['attachment']->getKey(),
        'source_label' => $context['attachment']->original_name,
        'notes' => null,
    ]);

    $contribution->forceFill([
        'current_version_id' => $version->getKey(),
    ])->save();

    return $contribution->fresh();
}
