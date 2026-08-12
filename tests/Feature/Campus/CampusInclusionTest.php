<?php

use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Pennant\Feature;

function campusAdminForInclusion(Institution $institution): User
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

test('authorized campus admin can view restricted inclusion review queue UI', function () {
    $institution = Institution::factory()->active()->create(['name' => 'Universitas SATU Inklusi']);
    $admin = campusAdminForInclusion($institution);
    Feature::for($admin)->activate('inclusion-signal-engine');

    $student = User::factory()->create(['name' => 'Budi Pertiwi']);
    $version = InclusionSignalVersion::factory()->create(['version' => '1.0']);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $student->id,
        'version_id' => $version->id,
        'period' => '2026-S1',
        'restricted_feature_state' => true,
        'data_sufficiency_met' => true,
        'evidence_summary' => ['factor' => 'Pola partisipasi membutuhkan tinjauan'],
    ]);

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.inclusion.index', $institution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/inclusion')
            ->where('institution.name', 'Universitas SATU Inklusi')
            ->where('engineActive', true)
            ->where('signals.items.0.id', $signal->id)
            ->where('signals.items.0.subject_name', 'Budi Pertiwi')
        );
});

test('campus inclusion interface renders inactive banner when feature disabled', function () {
    $institution = Institution::factory()->active()->create();
    $admin = campusAdminForInclusion($institution);
    Feature::for($admin)->deactivate('inclusion-signal-engine');

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.inclusion.index', $institution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/inclusion')
            ->where('engineActive', false)
            ->where('signals.items', [])
        );
});

test('unauthorized users cannot access inclusion UI', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    InstitutionMembership::factory()->for($student)->for($institution)->create(['status' => 'unverified']);
    Feature::for($student)->activate('inclusion-signal-engine');

    $this->withoutVite()
        ->actingAs($student)
        ->get(route('campus.inclusion.index', $institution))
        ->assertForbidden();
});

test('reviewer can submit human inclusion review decision with required reason', function () {
    $institution = Institution::factory()->active()->create();
    $admin = campusAdminForInclusion($institution);
    Feature::for($admin)->activate('inclusion-signal-engine');

    $student = User::factory()->create();
    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $student->id,
        'restricted_feature_state' => true,
    ]);

    $this->withoutVite()
        ->actingAs($admin)
        ->post(route('campus.inclusion.reviews.store', [$institution, $signal]), [
            'human_conclusion' => 'acknowledged',
            'support_action' => 'Menawarkan pendampingan proyek',
            'reason' => 'Telah ditinjau dan dikonfirmasi tidak membutuhkan tindakan darurat.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inclusion_reviews', [
        'inclusion_signal_id' => $signal->id,
        'reviewer_id' => $admin->id,
        'human_conclusion' => 'acknowledged',
        'support_action' => 'Menawarkan pendampingan proyek',
        'reason' => 'Telah ditinjau dan dikonfirmasi tidak membutuhkan tindakan darurat.',
    ]);
});
