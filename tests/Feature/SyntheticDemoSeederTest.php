<?php

use App\Models\AffiliationRequest;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\CollaborationEvent;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Models\MatchRun;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Laravel\Pennant\Feature;

uses(RefreshDatabase::class);

function seedTypicalSyntheticDemo(): void
{
    config(['app.demo_state' => 'typical']);
    Artisan::call('db:seed', ['--class' => DemoSeeder::class]);
}

test('it seeds the synthetic demo dataset successfully without errors', function () {
    expect(fn () => Artisan::call('db:seed', ['--class' => DemoSeeder::class]))
        ->not->toThrow(Exception::class);
});

test('it seeds realistic data volume for typical state', function () {
    seedTypicalSyntheticDemo();

    expect(Institution::count())->toBeGreaterThanOrEqual(2)
        ->and(User::count())->toBeGreaterThanOrEqual(80);
});

test('it keeps the minimum synthetic state intentionally small', function () {
    config(['app.demo_state' => 'minimum']);
    Artisan::call('db:seed', ['--class' => DemoSeeder::class]);

    expect(Institution::count())->toBe(1)
        ->and(Project::count())->toBe(1)
        ->and(AffiliationRequest::count())->toBe(1)
        ->and(InclusionSignal::count())->toBe(1);
});

test('it expands the maximum synthetic state across ten institutions', function () {
    config(['app.demo_state' => 'maximum']);
    Artisan::call('db:seed', ['--class' => DemoSeeder::class]);

    expect(Institution::count())->toBe(10)
        ->and(User::count())->toBeGreaterThanOrEqual(1010)
        ->and(Project::count())->toBe(40)
        ->and(InclusionSignal::count())->toBe(10);
});

test('it covers each remaining synthetic demo scenario with explicit labels', function () {
    seedTypicalSyntheticDemo();

    expect(Project::count())->toBeGreaterThanOrEqual(4)
        ->and(CollaborationEvent::query()->where('is_synthetic', true)->count())->toBeGreaterThan(0)
        ->and(TeamMembershipEvent::count())->toBeGreaterThan(0)
        ->and(Contribution::count())->toBeGreaterThan(0)
        ->and(ContributionEvidence::query()->where('source_label', 'Synthetic demo evidence')->count())
        ->toBeGreaterThan(0)
        ->and(ContributionReview::query()->where('policy_version', 'like', 'synthetic-demo-%')->count())
        ->toBeGreaterThan(0)
        ->and(PortfolioEntry::query()->where('visibility', 'recruiter')->count())->toBeGreaterThan(0)
        ->and(AffiliationRequest::query()->where('status', 'pending_review')->count())->toBeGreaterThan(0)
        ->and(MatchRun::count())->toBeGreaterThan(0)
        ->and(Recommendation::count())->toBeGreaterThan(0)
        ->and(InclusionSignal::query()->where('restricted_feature_state', true)->count())->toBeGreaterThan(0)
        ->and(InclusionReview::count())->toBeGreaterThan(0)
        ->and(Attachment::query()->where('original_name', 'like', 'synthetic-%')->count())
        ->toBeGreaterThan(0)
        ->and(AuditLog::query()->where('operation', 'demo.synthetic_dataset_seeded')->count())
        ->toBeGreaterThan(0);

    expect(CollaborationEvent::query()->get()->every(
        fn (CollaborationEvent $event): bool => $event->is_synthetic,
    ))->toBeTrue();
    expect(AuditLog::query()->get()->every(
        fn (AuditLog $audit): bool => ($audit->request_context['is_synthetic'] ?? false) === true,
    ))->toBeTrue();
});

test('it keeps seeded records inside their institution boundary', function () {
    seedTypicalSyntheticDemo();

    $projectViolations = Project::query()
        ->with('institution')
        ->get()
        ->filter(fn (Project $project): bool => $project->institution_id !== $project->institution->getKey());
    $matchRunViolations = MatchRun::query()
        ->with('project')
        ->get()
        ->filter(fn (MatchRun $run): bool => $run->institution_id !== $run->project->institution_id);
    $recommendationViolations = Recommendation::query()
        ->with(['project', 'matchRun'])
        ->get()
        ->filter(fn (Recommendation $recommendation): bool => $recommendation->institution_id !== $recommendation->project->institution_id
            || $recommendation->institution_id !== $recommendation->matchRun->institution_id
        );
    $contributionViolations = Contribution::query()
        ->with('project')
        ->get()
        ->filter(fn (Contribution $contribution): bool => $contribution->institution_id !== $contribution->project->institution_id
        );
    $portfolioViolations = PortfolioEntry::query()
        ->with('contribution')
        ->get()
        ->filter(fn (PortfolioEntry $entry): bool => $entry->institution_id !== $entry->contribution->institution_id
        );

    expect($projectViolations)->toBeEmpty()
        ->and($matchRunViolations)->toBeEmpty()
        ->and($recommendationViolations)->toBeEmpty()
        ->and($contributionViolations)->toBeEmpty()
        ->and($portfolioViolations)->toBeEmpty();
});

test('it is repeatable without increasing the synthetic record counts', function () {
    seedTypicalSyntheticDemo();

    $tables = [
        'institutions' => Institution::class,
        'users' => User::class,
        'projects' => Project::class,
        'collaboration_events' => CollaborationEvent::class,
        'contributions' => Contribution::class,
        'portfolio_entries' => PortfolioEntry::class,
        'affiliation_requests' => AffiliationRequest::class,
        'match_runs' => MatchRun::class,
        'recommendations' => Recommendation::class,
        'inclusion_signals' => InclusionSignal::class,
        'inclusion_reviews' => InclusionReview::class,
    ];
    $firstCounts = collect($tables)->mapWithKeys(
        fn (string $model, string $table): array => [$table => $model::count()],
    )->all();

    seedTypicalSyntheticDemo();

    $secondCounts = collect($tables)->mapWithKeys(
        fn (string $model, string $table): array => [$table => $model::count()],
    )->all();

    expect($secondCounts)->toBe($firstCounts);
});

test('seeded gated inclusion data remains unavailable outside the campus tenant boundary', function () {
    seedTypicalSyntheticDemo();

    $alpha = Institution::query()->where('slug', 'synthetic-universitas-sintetik-alpha')->firstOrFail();
    $beta = Institution::query()->where('slug', 'synthetic-institut-teknologi-sintetik-beta')->firstOrFail();
    $alphaStudent = User::query()->where('username', 'synthetic-universitas-sintetik-alpha-student-1')->firstOrFail();
    $alphaAdmin = User::query()->where('username', 'synthetic-universitas-sintetik-alpha-admin')->firstOrFail();

    Feature::for($alphaStudent)->activate('inclusion-signal-engine');
    Feature::for($alphaAdmin)->activate('inclusion-signal-engine');

    $this->withoutVite()
        ->actingAs($alphaStudent)
        ->get(route('campus.inclusion.index', $alpha))
        ->assertForbidden();

    $this->withoutVite()
        ->actingAs($alphaAdmin)
        ->get(route('campus.inclusion.index', $beta))
        ->assertForbidden();
});
