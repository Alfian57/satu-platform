<?php

use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Laravel\Pennant\Feature;

function campusInclusionBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU Inklusi',
    ]);
    $admin = User::factory()->create(['name' => 'Dzikra Admins']);
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();
    Feature::for($admin)->activate('inclusion-signal-engine');

    $subject = User::factory()->create(['name' => 'Budi Pertiwi']);
    $version = InclusionSignalVersion::factory()->create(['version' => '1.0']);
    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $subject->id,
        'version_id' => $version->id,
        'period' => '2026-S1',
        'restricted_feature_state' => true,
        'data_sufficiency_met' => true,
        'evidence_summary' => [
            'factor' => 'Pola partisipasi membutuhkan tinjauan kesempatan.',
            'events' => 3,
        ],
    ]);

    return compact('institution', 'admin', 'signal');
}

test('inclusion queue renders restricted signal, keyboard focus, and safe language', function () {
    $context = campusInclusionBrowserContext();
    $this->actingAs($context['admin']);

    visit(route('campus.inclusion.index', $context['institution']))
        ->resize(1366, 900)
        ->assertSee('Restricted Operational Surface')
        ->assertSee('Budi Pertiwi')
        ->assertSee('Kecukupan data terpenuhi')
        ->assertScript(
            <<<'JS'
function() {
    const item = document.querySelector('[data-test="inclusion-queue-item"]');
    if (!item) {
        return false;
    }

    return getComputedStyle(item).cursor === 'pointer'
        && item.getAttribute('role') === 'button'
        && parseInt(item.getAttribute('tabindex'), 10) === 0;
}
JS,
            true,
        )
        ->assertDontSee('terisolasi')
        ->assertDontSee('vulnerable')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('reviewer selects a signal with the keyboard and submits a human review', function () {
    $context = campusInclusionBrowserContext();
    $this->actingAs($context['admin']);

    visit(route('campus.inclusion.index', $context['institution']))
        ->resize(1366, 900)
        ->keys('@inclusion-queue-item', 'Enter')
        ->wait(0.4)
        ->assertScript(
            'document.querySelectorAll(\'[data-test="inclusion-detail"]\').length === 1',
            true,
        )
        ->assertSee('Periode / Versi')
        ->assertSee('Pola partisipasi membutuhkan tinjauan kesempatan.')
        ->assertNoAccessibilityIssues()
        ->fill('@inclusion-reason', 'Konfirmasi bahwa mahasiswa memiliki kesempatan partisipasi yang memadai.')
        ->click('@inclusion-submit')
        ->wait(0.5)
        ->assertSee('Konfirmasi bahwa mahasiswa memiliki kesempatan partisipasi yang memadai.')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('disabled feature keeps the queue behind a not-allowed cursor banner', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();
    Feature::for($admin)->deactivate('inclusion-signal-engine');
    $this->actingAs($admin);

    visit(route('campus.inclusion.index', $institution))
        ->resize(390, 844)
        ->assertSee('Engine Inklusi Non-Aktif / Mode Sintetis')
        ->assertScript(
            <<<'JS'
function() {
    const button = document.querySelector('[data-test="inclusion-filter-button"]');
    return button && button.disabled && getComputedStyle(button).cursor === 'not-allowed';
}
JS,
            true,
        )
        ->assertNoAccessibilityIssues()
        ->assertNoJavaScriptErrors();
});

test('inclusion screenshots cover real desktop and mobile evidence', function (
    int $width,
    int $height,
    bool $fullPage,
    string $filename,
) {
    $context = campusInclusionBrowserContext();
    $this->actingAs($context['admin']);

    visit(route('campus.inclusion.index', $context['institution']))
        ->resize($width, $height)
        ->assertNoAccessibilityIssues()
        ->assertNoJavaScriptErrors()
        ->screenshot($fullPage, $filename);
})->with([
    'real light desktop' => [
        1366,
        900,
        false,
        'p58-inclusion-review-light-1366x900',
    ],
    'real light mobile full' => [
        390,
        844,
        true,
        'p58-inclusion-review-light-390x844-full',
    ],
]);
