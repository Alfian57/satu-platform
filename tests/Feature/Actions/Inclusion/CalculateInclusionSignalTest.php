<?php

use App\Actions\Inclusion\CalculateInclusionSignal;
use App\Models\CollaborationEvent;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Pennant\Feature;

uses(RefreshDatabase::class);

it('refuses to calculate if engine is not active', function () {
    Feature::deactivate('inclusion-signal-engine');

    $institution = Institution::factory()->create();
    $subject = User::factory()->create();
    $version = InclusionSignalVersion::factory()->create();

    $action = new CalculateInclusionSignal;

    expect(fn () => $action->execute($institution, $subject, '2026-S1', $version))
        ->toThrow(Exception::class, 'Inclusion signal engine is not active.');
});

it('marks data sufficiency as false if events are below threshold', function () {
    Feature::activate('inclusion-signal-engine');

    $institution = Institution::factory()->create();
    $subject = User::factory()->create();
    $version = InclusionSignalVersion::factory()->create([
        'rules' => ['min_collaboration_events' => 5],
    ]);

    // Create only 3 events (below threshold)
    CollaborationEvent::factory(3)->create([
        'institution_id' => $institution->id,
        'actor_id' => $subject->id,
    ]);

    $action = new CalculateInclusionSignal;
    $signal = $action->execute($institution, $subject, '2026-S1', $version);

    expect($signal->data_sufficiency_met)->toBeFalse()
        ->and($signal->restricted_feature_state)->toBeFalse()
        ->and($signal->evidence_summary['factor'])->toBe('Insufficient data to perform inclusion signal calculation.');
});

it('marks as candidate if data sufficiency met but received events below threshold', function () {
    Feature::activate('inclusion-signal-engine');

    $institution = Institution::factory()->create();
    $subject = User::factory()->create();

    // min_collaboration_events = 5, low_collaboration_threshold = 2
    $version = InclusionSignalVersion::factory()->create([
        'rules' => ['min_collaboration_events' => 5],
        'metrics' => ['low_collaboration_threshold' => 2],
    ]);

    // Create 5 events where subject is actor (meets sufficiency)
    CollaborationEvent::factory(5)->create([
        'institution_id' => $institution->id,
        'actor_id' => $subject->id,
        'target_id' => User::factory()->create()->id,
    ]);

    // Create 1 event where subject is target (below threshold of 2)
    CollaborationEvent::factory(1)->create([
        'institution_id' => $institution->id,
        'actor_id' => User::factory()->create()->id,
        'target_id' => $subject->id,
    ]);

    $action = new CalculateInclusionSignal;
    $signal = $action->execute($institution, $subject, '2026-S1', $version);

    expect($signal->data_sufficiency_met)->toBeTrue()
        ->and($signal->restricted_feature_state)->toBeTrue()
        ->and($signal->evidence_summary['factor'])->toBe('User has received fewer collaboration events than the configured threshold.');
});

it('marks as safe if data sufficiency met and received events above threshold', function () {
    Feature::activate('inclusion-signal-engine');

    $institution = Institution::factory()->create();
    $subject = User::factory()->create();

    // min_collaboration_events = 5, low_collaboration_threshold = 2
    $version = InclusionSignalVersion::factory()->create([
        'rules' => ['min_collaboration_events' => 5],
        'metrics' => ['low_collaboration_threshold' => 2],
    ]);

    // Create 5 events where subject is target (meets sufficiency and above threshold)
    CollaborationEvent::factory(5)->create([
        'institution_id' => $institution->id,
        'actor_id' => User::factory()->create()->id,
        'target_id' => $subject->id,
    ]);

    $action = new CalculateInclusionSignal;
    $signal = $action->execute($institution, $subject, '2026-S1', $version);

    expect($signal->data_sufficiency_met)->toBeTrue()
        ->and($signal->restricted_feature_state)->toBeFalse()
        ->and($signal->evidence_summary['factor'])->toBe('User has sufficient collaboration events.');
});
