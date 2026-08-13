<?php

use App\Actions\Contribution\ContributionReviewQueue;
use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Enums\ContributionStatus;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authorized campus reviewer receives an institution-scoped contribution queue', function () {
    $context = campusContributionReviewContext();
    $pending = campusPendingContribution($context, 'Contribution perlu ditinjau.');
    $foreign = campusPendingContribution(
        campusContributionReviewContext(),
        'Contribution tenant lain.',
    );

    $this->actingAs($context['reviewer'])
        ->get(route('campus.contributions.index', $context['institution']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/contributions')
            ->where('institution.id', $context['institution']->getKey())
            ->where('filters.status', ContributionStatus::Pending->value)
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('reviewQueue.items.0.id', $pending->getKey())
                ->where('reviewQueue.items.0.project.title', 'Campus review project')
                ->where('reviewQueue.items.0.contributor.name', 'Contribution owner')
                ->where('reviewQueue.items.0.current_version.claim', 'Contribution perlu ditinjau.')
                ->where('reviewQueue.summary.pending', 1)
                ->missing('reviewQueue.items.0.current_version.evidence.0.attachment.path')
                ->missing('reviewQueue.items.0.current_version.evidence.0.attachment.disk')
                ->missing('reviewQueue.items.0.current_version.evidence.0.attachment.sha256')
                ->missing('reviewQueue.items.0.current_version.evidence.0.attachment.download_url')),
        );

    expect($foreign->institution_id)->not->toBe($context['institution']->getKey());
});

test('queue supports all status filters and stable oldest or newest order', function () {
    $context = campusContributionReviewContext();
    $oldest = campusPendingContribution($context, 'Oldest contribution.');
    $newest = campusPendingContribution($context, 'Newest contribution.');
    $newest->forceFill(['updated_at' => now()->addMinute()])->save();

    $this->actingAs($context['reviewer'])
        ->get(route('campus.contributions.index', [
            'institution' => $context['institution'],
            'sort' => 'newest',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('reviewQueue.items.0.id', $newest->getKey())
                ->where('reviewQueue.items.1.id', $oldest->getKey())));

    $oldest->forceFill(['status' => ContributionStatus::Approved])->save();

    $this->actingAs($context['reviewer'])
        ->get(route('campus.contributions.index', [
            'institution' => $context['institution'],
            'status' => ContributionStatus::Approved->value,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('reviewQueue.items.0.id', $oldest->getKey())
                ->where('reviewQueue.summary.approved', 1)));
});

test('students, foreign reviewers, and inactive institutions cannot enumerate the queue', function () {
    $context = campusContributionReviewContext();
    campusPendingContribution($context, 'Private queue item.');
    $student = $context['student'];
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignReviewer = campusReviewerForContribution($foreignInstitution);

    $this->actingAs($student)
        ->get(route('campus.contributions.index', $context['institution']))
        ->assertForbidden();

    $this->actingAs($foreignReviewer)
        ->get(route('campus.contributions.index', $context['institution']))
        ->assertForbidden();

    $inactive = Institution::factory()->suspended()->create();
    $inactiveReviewer = campusReviewerForContribution($inactive);

    expect(fn () => app(ContributionReviewQueue::class)->paginate(
        $inactiveReviewer,
        $inactive,
    ))->toThrow(AuthorizationException::class);
});

test('campus reviewer can open contribution evidence while other users remain denied', function () {
    $context = campusContributionReviewContext();
    $contribution = campusPendingContribution($context, 'Evidence access.');
    $attachment = $context['attachment'];
    $reviewer = $context['reviewer'];
    $student = $context['student'];

    expect(Gate::forUser($reviewer)->allows('view', $attachment))->toBeTrue()
        ->and(Gate::forUser($student)->allows('view', $attachment))->toBeTrue();

    $foreignReviewer = campusReviewerForContribution(Institution::factory()->active()->create());

    expect(Gate::forUser($foreignReviewer)->denies('view', $attachment))->toBeTrue()
        ->and($contribution->institution_id)->toBe($context['institution']->getKey());
});

/**
 * @return array{institution: Institution, reviewer: User, student: User, project: Project, task: Task, attachment: Attachment}
 */
function campusContributionReviewContext(): array
{
    $institution = Institution::factory()->active()->create();
    $reviewer = User::factory()->create(['name' => 'Campus Reviewer']);
    $student = User::factory()->create(['name' => 'Contribution owner']);

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();
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
        ->create(['title' => 'Campus review project']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Review contribution task']);
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($student, 'uploadedBy')
        ->create(['original_name' => 'review-evidence.pdf']);

    return compact('institution', 'reviewer', 'student', 'project', 'task', 'attachment');
}

function campusReviewerForContribution(Institution $institution): User
{
    $reviewer = User::factory()->create();

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();

    return $reviewer;
}

/**
 * @param  array{institution: Institution, reviewer: User, student: User, project: Project, task: Task, attachment: Attachment}  $context
 */
function campusPendingContribution(array $context, string $claim): Contribution
{
    $contribution = app(CreateContribution::class)->handle(
        actor: $context['student'],
        project: $context['project'],
        data: [
            'task_id' => $context['task']->getKey(),
            'claim' => $claim,
            'summary' => 'Ringkasan pekerjaan yang dapat ditinjau reviewer kampus.',
            'declaration' => 'Saya menyatakan bahwa contribution ini merepresentasikan pekerjaan saya.',
            'evidence' => [$context['attachment']->getKey()],
        ],
    );

    return app(SubmitContribution::class)->handle($context['student'], $contribution);
}
