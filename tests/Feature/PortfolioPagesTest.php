<?php

declare(strict_types=1);

use App\Enums\PortfolioVisibility;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('student portfolio page exposes deferred provenance without private evidence', function () {
    $context = portfolioPageContext();
    $entry = portfolioPageEntry($context);

    $this->actingAs($context['student'])
        ->get(route('portfolio.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/index')
            ->where('profile.id', $context['profile']->getKey())
            ->where('profile.portfolio_visibility', PortfolioVisibility::Public->value)
            ->where('profile.recruiter_discoverable', true)
            ->where('permissions.can_manage', true)
            ->missing('entries')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('entries', 1)
                ->where('entries.0.id', $entry->getKey())
                ->where('entries.0.title', 'Portfolio page entry')
                ->where('entries.0.verification_label', 'Institution-verified')
                ->where('entries.0.source.contribution_id', $context['contribution']->getKey())
                ->where('entries.0.source.version_number', 1)
                ->missing('entries.0.evidence')
                ->missing('entries.0.review_notes')
                ->missing('entries.0.raw_audit')));
});

test('student can open a portfolio detail and manage its audience', function () {
    $context = portfolioPageContext();
    $entry = portfolioPageEntry($context);

    $this->actingAs($context['student'])
        ->get(route('portfolio.show', $entry))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/show')
            ->where('entry.id', $entry->getKey())
            ->where('entry.source.status', 'approved')
            ->where('permissions.can_manage', true)
            ->where('permissions.can_manage_profile', true)
            ->missing('entry.evidence')
            ->missing('entry.review_notes')
            ->missing('entry.raw_audit'));
});

test('private portfolio entry cannot be opened by another verified student', function () {
    $context = portfolioPageContext();
    $entry = portfolioPageEntry($context);
    $peer = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($peer)
        ->for($context['institution'])
        ->create();

    $this->actingAs($peer)
        ->get(route('portfolio.show', $entry))
        ->assertForbidden();
});

test('student without verified affiliation receives a safe portfolio boundary', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->get(route('portfolio.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/index')
            ->where('profile', null)
            ->where('permissions.can_manage', false)
            ->missing('entries')
            ->loadDeferredProps(fn (Assert $reload) => $reload->has('entries', 0)));
});

/**
 * @return array{
 *     institution: Institution,
 *     student: User,
 *     profile: StudentProfile,
 *     project: Project,
 *     task: Task,
 *     contribution: Contribution,
 *     version: ContributionVersion,
 * }
 */
function portfolioPageContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Portfolio Pages',
    ]);
    $student = User::factory()->create([
        'name' => 'Student Portfolio Pages',
    ]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $profile = StudentProfile::factory()
        ->for($student)
        ->for($institution)
        ->create([
            'portfolio_visibility' => PortfolioVisibility::Public,
            'recruiter_discoverable' => true,
        ]);
    $project = Project::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->open()
        ->create(['title' => 'Project portfolio pages']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Task portfolio pages']);
    $contribution = Contribution::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->for($project)
        ->approved()
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->for($task, 'task')
        ->create([
            'summary' => 'Ringkasan portfolio yang sudah disetujui.',
        ]);
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    return compact(
        'institution',
        'student',
        'profile',
        'project',
        'task',
        'contribution',
        'version',
    );
}

/**
 * @param  array{institution: Institution, student: User, contribution: Contribution, version: ContributionVersion}  $context
 */
function portfolioPageEntry(array $context): PortfolioEntry
{
    return PortfolioEntry::factory()->create([
        'institution_id' => $context['institution']->getKey(),
        'user_id' => $context['student']->getKey(),
        'contribution_id' => $context['contribution']->getKey(),
        'contribution_version_id' => $context['version']->getKey(),
        'title' => 'Portfolio page entry',
        'summary' => 'Ringkasan entry portfolio untuk halaman student.',
        'visibility' => PortfolioVisibility::Private,
    ]);
}
