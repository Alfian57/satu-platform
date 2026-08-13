<?php

declare(strict_types=1);

use App\Actions\Contribution\ReviseContribution;
use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Actions\Profile\UpdateStudentProfileVisibility;
use App\Actions\Talent\UpdateTalentCandidateProjection;
use App\Enums\ContributionStatus;
use App\Enums\PortfolioVerificationLevel;
use App\Enums\PortfolioVisibility;
use App\Events\ContributionApproved;
use App\Listeners\SyncApprovedContributionPortfolio;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\Task;
use App\Models\User;
use App\Support\Portfolio\PortfolioEntrySerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

test('approved contribution creates one idempotent verified portfolio entry', function () {
    $fixture = portfolioEntryFixture();
    $event = approvedPortfolioEvent($fixture);

    app(SyncApprovedContributionPortfolio::class)->handle($event);
    app(SyncApprovedContributionPortfolio::class)->handle($event);

    $entry = PortfolioEntry::query()->sole();
    $projection = TalentCandidateProjection::query()->sole();

    expect($entry->institution_id)->toBe($fixture['institution']->getKey())
        ->and($entry->user_id)->toBe($fixture['student']->getKey())
        ->and($entry->contribution_version_id)->toBe($fixture['version']->getKey())
        ->and($entry->verification_level)->toBe(PortfolioVerificationLevel::InstitutionVerified)
        ->and($entry->visibility)->toBe(PortfolioVisibility::Private)
        ->and($entry->withdrawn_at)->toBeNull()
        ->and($projection->is_visible)->toBeFalse()
        ->and($projection->contributions)->toBe([]);
});

test('per-entry visibility and recruiter discoverability remain separate controls', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $entry = PortfolioEntry::query()->sole();

    $entry = app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        $entry,
        ['visibility' => PortfolioVisibility::Public->value],
    );

    $projection = TalentCandidateProjection::query()->sole();
    expect($entry->published_at)->not->toBeNull()
        ->and($projection->is_visible)->toBeTrue()
        ->and($projection->contributions)->toHaveCount(1)
        ->and($projection->contributions[0])->toHaveKeys([
            'id',
            'title',
            'summary',
            'verification_level',
            'verification_label',
            'published_at',
        ])
        ->and($projection->contributions[0])->not->toHaveKeys([
            'evidence',
            'private_evidence',
            'review_notes',
            'raw_audit',
        ]);

    app(UpdateStudentProfileVisibility::class)->handle(
        $fixture['student'],
        $fixture['profile'],
        ['recruiter_discoverable' => false],
    );

    expect($fixture['profile']->fresh()->portfolio_visibility)->toBe(PortfolioVisibility::Public)
        ->and($fixture['profile']->fresh()->recruiter_discoverable)->toBeFalse()
        ->and(TalentCandidateProjection::query()->sole()->is_visible)->toBeFalse();

    app(UpdateStudentProfileVisibility::class)->handle(
        $fixture['student'],
        $fixture['profile']->fresh(),
        ['recruiter_discoverable' => true],
    );

    expect(TalentCandidateProjection::query()->sole()->is_visible)->toBeTrue();
});

test('making a published entry private withdraws its recruiter projection and can republish', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $entry = app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        PortfolioEntry::query()->sole(),
        ['visibility' => PortfolioVisibility::Recruiter->value],
    );

    $withdrawn = app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        $entry,
        ['visibility' => PortfolioVisibility::Private->value],
    );

    expect($withdrawn->withdrawn_at)->not->toBeNull()
        ->and($withdrawn->withdrawal_reason)->toBe('visibility_private')
        ->and(TalentCandidateProjection::query()->sole()->is_visible)->toBeFalse();

    $republished = app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        $withdrawn,
        ['visibility' => PortfolioVisibility::Recruiter->value],
    );

    expect($republished->withdrawn_at)->toBeNull()
        ->and($republished->published_at)->not->toBeNull()
        ->and(TalentCandidateProjection::query()->sole()->is_visible)->toBeTrue()
        ->and(PortfolioEntry::query()->visibleToPublic()->pluck('id')->all())->toBe([]);

    app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        $republished,
        ['visibility' => PortfolioVisibility::Public->value],
    );

    $publicEntry = PortfolioEntry::query()->visibleToPublic()->sole();
    $publicProjection = app(PortfolioEntrySerializer::class)->publicProjection($publicEntry);

    expect($publicProjection)->toHaveKeys([
        'id',
        'title',
        'summary',
        'verification_level',
        'verification_label',
        'published_at',
    ])->not->toHaveKeys([
        'contribution_id',
        'contribution_version_id',
        'evidence',
        'review_notes',
        'raw_audit',
    ]);
});

test('revised contribution source is removed until its new version is approved', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $entry = app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        PortfolioEntry::query()->sole(),
        ['visibility' => PortfolioVisibility::Public->value],
    );
    $oldVersionId = $entry->contribution_version_id;

    $fixture['contribution']->forceFill(['status' => ContributionStatus::Revision])->save();
    $revised = app(ReviseContribution::class)->handle(
        $fixture['student'],
        $fixture['contribution']->fresh(),
        ['summary' => 'Ringkasan versi revisi yang sudah diperbarui.'],
    );

    expect($revised->status)->toBe(ContributionStatus::Draft)
        ->and(PortfolioEntry::query()->sole()->contribution_version_id)->toBe($oldVersionId)
        ->and(TalentCandidateProjection::query()->sole()->is_visible)->toBeFalse();

    $newVersion = $revised->currentVersion;
    $newReview = ContributionReview::factory()
        ->for($newVersion, 'contributionVersion')
        ->for($fixture['reviewer'], 'reviewer')
        ->approved()
        ->create();
    $revised->forceFill(['status' => ContributionStatus::Approved])->save();

    app(SyncApprovedContributionPortfolio::class)->handle(new ContributionApproved(
        contributionId: $revised->getKey(),
        contributionVersionId: $newVersion->getKey(),
        reviewId: $newReview->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: 'contribution-review-v1',
    ));

    $entry->refresh();
    expect($entry->contribution_version_id)->toBe($newVersion->getKey())
        ->and($entry->summary)->toBe('Ringkasan versi revisi yang sudah diperbarui.')
        ->and($entry->verification_level)->toBe(PortfolioVerificationLevel::InstitutionVerified)
        ->and(TalentCandidateProjection::query()->sole()->is_visible)->toBeTrue();
});

test('portfolio policy and serializer deny cross-tenant access and private fields', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $entry = PortfolioEntry::query()->sole();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($foreignStudent)
        ->for($foreignInstitution)
        ->create();

    expect(Gate::forUser($fixture['student'])->allows('view', $entry))->toBeTrue()
        ->and(Gate::forUser($fixture['student'])->allows('update', $entry))->toBeTrue()
        ->and(Gate::forUser($foreignStudent)->allows('view', $entry))->toBeFalse()
        ->and(Gate::forUser($foreignStudent)->allows('update', $entry))->toBeFalse();

    $serialized = app(PortfolioEntrySerializer::class)->toArray($entry);
    expect($serialized)->toHaveKeys([
        'id',
        'title',
        'summary',
        'verification_level',
        'visibility',
        'status',
        'source',
    ])->not->toHaveKeys([
        'evidence',
        'private_evidence',
        'review_notes',
        'raw_audit',
        'username',
        'phone',
    ]);
});

test('a student cannot inspect another students private portfolio entry', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $peer = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($peer)
        ->for($fixture['institution'])
        ->create();

    expect(Gate::forUser($peer)->allows('view', PortfolioEntry::query()->sole()))->toBeFalse()
        ->and(Gate::forUser($peer)->allows('viewAny', [
            PortfolioEntry::class,
            $fixture['profile'],
        ]))->toBeTrue();

    $fixture['student']->refresh();
    app(UpdatePortfolioEntryVisibility::class)->handle(
        $fixture['student'],
        PortfolioEntry::query()->sole(),
        ['visibility' => PortfolioVisibility::Institution->value],
    );

    expect(Gate::forUser($peer)->allows('view', PortfolioEntry::query()->sole()))->toBeTrue();
});

test('portfolio entry factory creates a source-consistent approved entry', function () {
    $entry = PortfolioEntry::factory()->create();

    expect($entry->contribution_id)->toBe($entry->contribution->getKey())
        ->and($entry->contribution_version_id)->toBe($entry->sourceVersion->getKey())
        ->and($entry->institution_id)->toBe($entry->contribution->institution_id)
        ->and($entry->user_id)->toBe($entry->contribution->owner_id);
});

test('manual recruiter projection data is rejected in favor of approved portfolio sources', function () {
    $fixture = portfolioEntryFixture();

    expect(fn () => app(UpdateTalentCandidateProjection::class)->execute(
        actor: $fixture['student'],
        targetUser: $fixture['student'],
        institution: $fixture['institution'],
        data: ['contributions' => ['unverified claim']],
    ))->toThrow(AuthorizationException::class);
});

test('student portfolio endpoints list entries and update visibility with scoped binding', function () {
    $fixture = portfolioEntryFixture();
    app(SyncApprovedContributionPortfolio::class)->handle(approvedPortfolioEvent($fixture));
    $entry = PortfolioEntry::query()->sole();

    $this->actingAs($fixture['student'])
        ->getJson(route('student-profiles.portfolio.index', $fixture['profile']))
        ->assertOk()
        ->assertJsonPath('data.0.id', $entry->getKey())
        ->assertJsonPath('data.0.status', 'private');

    $this->actingAs($fixture['student'])
        ->patchJson(route('student-profiles.portfolio.visibility.update', [
            'studentProfile' => $fixture['profile'],
            'portfolioEntry' => $entry,
        ]), [
            'visibility' => PortfolioVisibility::Public->value,
        ])
        ->assertOk()
        ->assertJsonPath('data.visibility', PortfolioVisibility::Public->value)
        ->assertJsonPath('data.status', 'published');
});

/**
 * @return array{
 *     institution: Institution,
 *     student: User,
 *     reviewer: User,
 *     profile: StudentProfile,
 *     project: Project,
 *     task: Task,
 *     contribution: Contribution,
 *     version: ContributionVersion,
 *     review: ContributionReview,
 * }
 */
function portfolioEntryFixture(): array
{
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    $reviewer = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($student)
        ->for($institution)
        ->create();

    $profile = StudentProfile::factory()
        ->for($student)
        ->for($institution)
        ->create([
            'study_program' => 'Informatika',
            'portfolio_visibility' => PortfolioVisibility::Public,
            'recruiter_discoverable' => true,
        ]);
    $project = Project::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->open()
        ->create(['title' => 'Validasi Portfolio SATU']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create();
    $contribution = Contribution::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->for($project)
        ->approved()
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->create([
            'task_id' => $task->getKey(),
            'summary' => 'Ringkasan kontribusi yang sudah disetujui.',
        ]);
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();
    $review = ContributionReview::factory()
        ->for($version, 'contributionVersion')
        ->for($reviewer, 'reviewer')
        ->approved()
        ->create();

    return compact(
        'institution',
        'student',
        'reviewer',
        'profile',
        'project',
        'task',
        'contribution',
        'version',
        'review',
    );
}

/** @param  array{contribution: Contribution, version: ContributionVersion, review: ContributionReview, reviewer: User, institution: Institution}  $fixture */
function approvedPortfolioEvent(array $fixture): ContributionApproved
{
    return new ContributionApproved(
        contributionId: $fixture['contribution']->getKey(),
        contributionVersionId: $fixture['version']->getKey(),
        reviewId: $fixture['review']->getKey(),
        reviewerId: $fixture['reviewer']->getKey(),
        institutionId: $fixture['institution']->getKey(),
        policyVersion: 'contribution-review-v1',
    );
}
