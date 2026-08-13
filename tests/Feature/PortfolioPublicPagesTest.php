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

test('public route exposes only explicitly public portfolio projection fields', function () {
    $context = publicPortfolioContext();
    $publicEntry = publicPortfolioEntry(
        $context['profile'],
        'Public contribution entry',
        PortfolioVisibility::Public,
    );
    publicPortfolioEntry(
        $context['profile'],
        'Private contribution entry',
        PortfolioVisibility::Private,
    );
    publicPortfolioEntry(
        $context['profile'],
        'Recruiter contribution entry',
        PortfolioVisibility::Recruiter,
    );

    $response = $this->actingAs($context['student'])
        ->get(route('portfolio.share', $context['profile']->public_identifier));

    $response
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'index, follow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/public')
            ->where('state', 'published')
            ->where('profile.display_name', 'Student Public Portfolio')
            ->where('profile.study_program', 'Informatika')
            ->where('profile.institution_name', 'Universitas Public Portfolio')
            ->where('auth.user', null)
            ->where('shell.institutionMembership', null)
            ->has('entries', 1)
            ->where('entries.0.id', $publicEntry->getKey())
            ->where('entries.0.title', 'Public contribution entry')
            ->where('entries.0.verification_level', 'institution_verified')
            ->where('entries.0.verification_label', 'Institution-verified')
            ->missing('profile.id')
            ->missing('profile.user')
            ->missing('profile.username')
            ->missing('profile.phone')
            ->missing('entries.0.visibility')
            ->missing('entries.0.source')
            ->missing('entries.0.evidence')
            ->missing('entries.0.review_notes')
            ->missing('entries.0.raw_audit'));
});

test('public route is unavailable when profile audience is not public', function (
    PortfolioVisibility $visibility,
) {
    $context = publicPortfolioContext([
        'portfolio_visibility' => $visibility,
    ]);
    publicPortfolioEntry(
        $context['profile'],
        'Should not be disclosed',
        PortfolioVisibility::Public,
    );

    $this->get(route('portfolio.share', $context['profile']->public_identifier))
        ->assertStatus(410)
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/public')
            ->where('state', 'unavailable')
            ->where('profile', null)
            ->where('entries', [])
            ->where('auth.user', null)
            ->missing('profile.display_name')
            ->missing('entries.0.title'));
})->with([
    'private' => PortfolioVisibility::Private,
    'institution' => PortfolioVisibility::Institution,
    'recruiter' => PortfolioVisibility::Recruiter,
]);

test('public route is unavailable when no current public entry remains', function () {
    $context = publicPortfolioContext();
    $entry = publicPortfolioEntry(
        $context['profile'],
        'Withdrawn public entry',
        PortfolioVisibility::Public,
    );
    $entry->forceFill([
        'withdrawn_at' => now(),
        'withdrawal_reason' => 'visibility_private',
    ])->save();

    $this->get(route('portfolio.share', $context['profile']->public_identifier))
        ->assertStatus(410)
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('portfolio/public')
            ->where('state', 'unavailable')
            ->where('profile', null)
            ->has('entries', 0));
});

test('public route keeps same-user profiles isolated by institution', function () {
    $context = publicPortfolioContext();
    $otherInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas Public Portfolio B',
    ]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByRosterExactMatch()
        ->for($context['student'])
        ->for($otherInstitution)
        ->create();

    $otherProfile = StudentProfile::factory()
        ->for($context['student'])
        ->for($otherInstitution)
        ->create([
            'public_identifier' => '01J9Z4P5KQ2M6R8T1V3X7C9NAC',
            'portfolio_visibility' => PortfolioVisibility::Public,
        ]);
    $entryA = publicPortfolioEntry(
        $context['profile'],
        'Institution A public entry',
        PortfolioVisibility::Public,
    );
    publicPortfolioEntry(
        $otherProfile,
        'Institution B public entry',
        PortfolioVisibility::Public,
    );

    $this->get(route('portfolio.share', $context['profile']->public_identifier))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('state', 'published')
            ->has('entries', 1)
            ->where('entries.0.id', $entryA->getKey())
            ->where('entries.0.title', 'Institution A public entry'));
});

test('public identifier is generated once and remains stable', function () {
    $profile = StudentProfile::factory()->create();
    $identifier = $profile->public_identifier;

    expect($identifier)
        ->toBeString()
        ->toHaveLength(26);

    $profile->update(['bio' => 'Bio publik yang diperbarui.']);

    expect($profile->refresh()->public_identifier)->toBe($identifier);
});

test('unknown public identifier does not disclose a portfolio boundary', function () {
    $this->get(route('portfolio.share', '01J9Z4P5KQ2M6R8T1V3X7C9NAD'))
        ->assertNotFound();
});

/**
 * @param  array{portfolio_visibility?: PortfolioVisibility}  $overrides
 * @return array{institution: Institution, student: User, profile: StudentProfile}
 */
function publicPortfolioContext(array $overrides = []): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Public Portfolio',
    ]);
    $student = User::factory()->create([
        'name' => 'Student Public Portfolio',
    ]);

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
            'public_identifier' => '01J9Z4P5KQ2M6R8T1V3X7C9NAB',
            'portfolio_visibility' => PortfolioVisibility::Public,
            'recruiter_discoverable' => true,
            'study_program' => 'Informatika',
            'bio' => 'Bio yang sengaja dibagikan melalui portfolio publik.',
            ...$overrides,
        ]);

    return compact('institution', 'student', 'profile');
}

function publicPortfolioEntry(
    StudentProfile $profile,
    string $title,
    PortfolioVisibility $visibility,
): PortfolioEntry {
    $project = Project::factory()
        ->for($profile->institution)
        ->for($profile->user, 'owner')
        ->open()
        ->create(['title' => $title.' project']);
    $task = Task::factory()
        ->for($project)
        ->for($profile->user, 'createdBy')
        ->create(['title' => $title.' task']);
    $contribution = Contribution::factory()
        ->for($profile->institution)
        ->for($profile->user, 'owner')
        ->for($project)
        ->approved()
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->for($task, 'task')
        ->create([
            'summary' => $title.' summary',
        ]);
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    return PortfolioEntry::factory()->create([
        'institution_id' => $profile->institution_id,
        'user_id' => $profile->user_id,
        'contribution_id' => $contribution->getKey(),
        'contribution_version_id' => $version->getKey(),
        'title' => $title,
        'summary' => $title.' summary yang aman untuk publik.',
        'visibility' => $visibility,
        'published_at' => $visibility === PortfolioVisibility::Private
            ? null
            : now(),
    ]);
}
