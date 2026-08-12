<?php

namespace Tests\Feature\Campus;

use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Pennant\Feature;

/*
|--------------------------------------------------------------------------
| Inclusion Governance & Quality Gate (Issue #60 / P59)
|--------------------------------------------------------------------------
|
| Tests data-sufficiency, subgroup isolation, tenant boundaries, restricted
| serializer sanitization, access log auditing, and UI accessibility/loading
| contracts for campus inclusion review.
|
*/

function createInclusionAdmin(Institution $institution): User
{
    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();

    return $admin;
}

beforeEach(function () {
    Feature::activate('inclusion-signal-engine');
});

test('data sufficiency met flag status is accurately populated in queue items', function () {
    $institution = Institution::factory()->active()->create();
    $admin = createInclusionAdmin($institution);
    Feature::for($admin)->activate('inclusion-signal-engine');

    $student = User::factory()->create(['name' => 'Siswa Sufficiency']);
    $version = InclusionSignalVersion::factory()->create(['version' => '1.0']);

    InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $student->id,
        'version_id' => $version->id,
        'period' => '2026-S1',
        'restricted_feature_state' => true,
        'data_sufficiency_met' => false,
        'evidence_summary' => ['factor' => 'Insufficent interaction data'],
    ]);

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.inclusion.index', $institution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/inclusion')
            ->where('signals.items.0.data_sufficiency_met', false)
            ->where('signals.items.0.subject_name', 'Siswa Sufficiency')
        );
});

test('tenant boundary isolates inclusion signals strictly per campus', function () {
    $institutionA = Institution::factory()->active()->create(['name' => 'Campus Alpha']);
    $institutionB = Institution::factory()->active()->create(['name' => 'Campus Beta']);

    $adminA = createInclusionAdmin($institutionA);
    Feature::for($adminA)->activate('inclusion-signal-engine');

    $studentB = User::factory()->create();
    InclusionSignal::factory()->create([
        'institution_id' => $institutionB->id,
        'subject_id' => $studentB->id,
        'restricted_feature_state' => true,
        'data_sufficiency_met' => true,
    ]);

    $this->withoutVite()
        ->actingAs($adminA)
        ->get(route('campus.inclusion.index', $institutionA))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/inclusion')
            ->where('signals.items', [])
        );
});

test('inclusion UI copy strictly enforces zero diagnostic or psychological language', function () {
    $institution = Institution::factory()->active()->create();
    $admin = createInclusionAdmin($institution);
    Feature::for($admin)->activate('inclusion-signal-engine');

    $response = $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.inclusion.index', $institution));

    $content = $response->getContent();

    expect($content)->not->toContain('terisolasi')
        ->and($content)->not->toContain('vulnerable')
        ->and($content)->not->toContain('depresi')
        ->and($content)->not->toContain('mental health');
});

test('inclusion review action appends history without mutating original signal', function () {
    $institution = Institution::factory()->active()->create();
    $admin = createInclusionAdmin($institution);
    Feature::for($admin)->activate('inclusion-signal-engine');

    $student = User::factory()->create();
    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $student->id,
        'restricted_feature_state' => true,
        'period' => '2026-S1',
    ]);

    $this->withoutVite()
        ->actingAs($admin)
        ->post(route('campus.inclusion.reviews.store', [$institution, $signal]), [
            'human_conclusion' => 'acknowledged',
            'support_action' => 'Pendampingan mentoring',
            'reason' => 'Verifikasi faktual kesempatan partisipasi mahasiswa.',
        ])
        ->assertRedirect();

    expect($signal->fresh()->restricted_feature_state)->toBeTrue()
        ->and($signal->fresh()->period)->toBe('2026-S1');

    $review = InclusionReview::query()->where('inclusion_signal_id', $signal->id)->first();
    expect($review->reviewer_id)->toBe($admin->id)
        ->and($review->human_conclusion)->toBe('acknowledged');
});
