<?php

declare(strict_types=1);

use App\Actions\Academic\ActivateCreditMapping;
use App\Actions\Academic\CreateCreditMapping;
use App\Actions\Academic\RetireCreditMapping;
use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;

uses(RefreshDatabase::class);

it('creates draft credit mapping ruleset for an institution', function () {
    $operator = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $action = app(CreateCreditMapping::class);
    $mapping = $action->execute(
        operator: $operator,
        institution: $institution,
        activityType: 'project',
        creditAmount: 3.0,
        reason: 'Initial curriculum SKS allocation',
    );

    expect($mapping)->toBeInstanceOf(AcademicCreditMapping::class)
        ->and($mapping->status)->toBe(CreditMappingStatus::Draft)
        ->and($mapping->credit_amount)->toBe(3.0)
        ->and($mapping->activity_type)->toBe('project');
});

it('activates draft credit mapping and retires existing active mapping for same activity type', function () {
    $approver = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $oldActive = AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'project',
        'status' => CreditMappingStatus::Active,
        'credit_amount' => 2.0,
    ]);

    $draft = AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'project',
        'status' => CreditMappingStatus::Draft,
        'credit_amount' => 4.0,
    ]);

    $activateAction = app(ActivateCreditMapping::class);
    $activated = $activateAction->execute($approver, $draft->id);

    expect($activated->status)->toBe(CreditMappingStatus::Active)
        ->and($activated->approver_user_id)->toBe($approver->id)
        ->and($oldActive->fresh()->status)->toBe(CreditMappingStatus::Retired);
});

it('retires an active credit mapping ruleset with reason', function () {
    $operator = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $activeMapping = AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'competition',
        'status' => CreditMappingStatus::Active,
    ]);

    $retireAction = app(RetireCreditMapping::class);
    $retired = $retireAction->execute($operator, $activeMapping->id, reason: 'Curriculum update');

    expect($retired->status)->toBe(CreditMappingStatus::Retired)
        ->and($retired->reason)->toBe('Curriculum update');
});

it('validates credit amount range', function () {
    $operator = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $action = app(CreateCreditMapping::class);

    expect(fn () => $action->execute($operator, $institution, 'project', creditAmount: 0.0))
        ->toThrow(InvalidArgumentException::class, 'Credit amount must be between 0.5 and 24 credits.');
});
