<?php

declare(strict_types=1);

use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders credit mappings index page for campus operator', function () {
    $operator = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $operator->id,
        'status' => 'active',
    ]);

    AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'project',
        'credit_amount' => 3.0,
        'status' => CreditMappingStatus::Draft,
    ]);

    $response = $this->actingAs($operator)
        ->get(route('campus.credit-mappings.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('campus/credit-mappings')
        ->has('mappings', 1)
        ->where('mappings.0.activity_type', 'project')
    );
});

it('allows operator to create draft mapping via POST request', function () {
    $operator = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->active()->create();

    $response = $this->actingAs($operator)
        ->post(route('campus.credit-mappings.store'), [
            'activity_type' => 'competition',
            'credit_amount' => 4.0,
            'reason' => 'Hackathon SKS allocation',
        ]);

    $response->assertRedirect();
    expect(AcademicCreditMapping::query()->where('activity_type', 'competition')->exists())->toBeTrue();
});

it('allows operator to activate draft mapping via POST request', function () {
    $operator = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->active()->create();

    $draft = AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'research',
        'status' => CreditMappingStatus::Draft,
    ]);

    $response = $this->actingAs($operator)
        ->post(route('campus.credit-mappings.activate', ['id' => $draft->id]));

    $response->assertRedirect();
    expect($draft->fresh()->status)->toBe(CreditMappingStatus::Active);
});

it('allows operator to retire active mapping via POST request', function () {
    $operator = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->active()->create();

    $active = AcademicCreditMapping::factory()->create([
        'institution_id' => $institution->id,
        'activity_type' => 'organization',
        'status' => CreditMappingStatus::Active,
    ]);

    $response = $this->actingAs($operator)
        ->post(route('campus.credit-mappings.retire', ['id' => $active->id]), [
            'reason' => 'Curriculum policy update',
        ]);

    $response->assertRedirect();
    expect($active->fresh()->status)->toBe(CreditMappingStatus::Retired);
});
