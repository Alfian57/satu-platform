<?php

use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Schema and Factory
|--------------------------------------------------------------------------
*/

test('it creates a recruiter organization with default status', function () {
    $org = RecruiterOrganization::factory()->create();

    expect($org->status->value)->toBe('pending')
        ->and($org->evidence_metadata)->toBeArray();
});

test('it prevents duplicate memberships in the same organization', function () {
    $org = RecruiterOrganization::factory()->create();
    $user = User::factory()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $user->id,
    ]);

    expect(fn () => RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $user->id,
    ]))->toThrow(QueryException::class);
});

test('it restricts deletion from organization if append-only history exists', function () {
    $org = RecruiterOrganization::factory()->create();
    $membership = RecruiterMembership::factory()->create(['recruiter_organization_id' => $org->id]);
    $review = RecruiterVerificationReview::factory()->create(['recruiter_organization_id' => $org->id]);

    expect(fn () => $org->delete())->toThrow(QueryException::class);
});

/*
|--------------------------------------------------------------------------
| Append-Only Enforcement
|--------------------------------------------------------------------------
*/

test('recruiter verification reviews cannot be updated', function () {
    $review = RecruiterVerificationReview::factory()->create();

    expect(fn () => $review->save())
        ->toThrow(LogicException::class, 'append-only');
});

test('recruiter verification reviews cannot be deleted', function () {
    $review = RecruiterVerificationReview::factory()->create();

    expect(fn () => $review->delete())
        ->toThrow(LogicException::class, 'append-only');
});

/*
|--------------------------------------------------------------------------
| Policies
|--------------------------------------------------------------------------
*/

test('user can view their own recruiter organization', function () {
    $membership = RecruiterMembership::factory()->create();
    $user = $membership->user;
    $org = $membership->organization;

    expect($user->can('view', $org))->toBeTrue();
});

test('user cannot view a different recruiter organization', function () {
    $user = User::factory()->create();
    $org = RecruiterOrganization::factory()->create();

    expect($user->can('view', $org))->toBeFalse();
});

test('organization owner can update the organization', function () {
    $membership = RecruiterMembership::factory()->owner()->create();
    $user = $membership->user;
    $org = $membership->organization;

    expect($user->can('update', $org))->toBeTrue();
});

test('organization recruiter cannot update the organization', function () {
    $membership = RecruiterMembership::factory()->create(); // default is recruiter role
    $user = $membership->user;
    $org = $membership->organization;

    expect($user->can('update', $org))->toBeFalse();
});

test('platform admin can review organization', function () {
    $admin = clone User::factory()->create();
    $admin->setAttribute('is_platform_admin', true); // stubbing the platform admin logic

    $org = RecruiterOrganization::factory()->create();

    expect($admin->can('review', $org))->toBeTrue();
});

test('regular user cannot review organization', function () {
    $user = User::factory()->create();
    $org = RecruiterOrganization::factory()->create();

    expect($user->can('review', $org))->toBeFalse();
});

test('organization owner can create memberships in verified organization', function () {
    $org = RecruiterOrganization::factory()->verified()->create();
    $membership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $user = $membership->user;

    expect($user->can('create', [RecruiterMembership::class, $org->id]))->toBeTrue();
});

test('organization owner cannot create memberships in pending organization', function () {
    $org = RecruiterOrganization::factory()->create(); // default is pending
    $membership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $user = $membership->user;

    expect($user->can('create', [RecruiterMembership::class, $org->id]))->toBeFalse();
});

test('platform admin can view all reviews', function () {
    $admin = clone User::factory()->create();
    $admin->setAttribute('is_platform_admin', true);

    $review = RecruiterVerificationReview::factory()->create();

    expect($admin->can('view', $review))->toBeTrue();
});

test('organization member can view reviews for their own organization', function () {
    $membership = RecruiterMembership::factory()->create();
    $review = RecruiterVerificationReview::factory()->create(['recruiter_organization_id' => $membership->organization->id]);

    expect($membership->user->can('view', $review))->toBeTrue();
});

test('organization member cannot view reviews for another organization', function () {
    $membership = RecruiterMembership::factory()->create();
    $review = RecruiterVerificationReview::factory()->create(); // different org

    expect($membership->user->can('view', $review))->toBeFalse();
});

it('projects evidence only to authorized platform admins', function () {
    $organization = RecruiterOrganization::factory()->create();
    $admin = User::factory()->create();
    $admin->setAttribute('is_platform_admin', true);
    $stranger = User::factory()->create();
    $stranger->setAttribute('is_platform_admin', false);

    $path = "recruiter-evidence/{$organization->id}/test-evidence.pdf";
    Storage::disk('local')->put($path, 'dummy content');

    // Stranger gets forbidden
    $this->actingAs($stranger)
        ->get(route('platform.recruiter-organizations.evidence.show', ['organization' => $organization->id, 'filename' => 'test-evidence.pdf']))
        ->assertForbidden();

    // Admin gets the file
    $this->actingAs($admin)
        ->get(route('platform.recruiter-organizations.evidence.show', ['organization' => $organization->id, 'filename' => 'test-evidence.pdf']))
        ->assertOk();
});
