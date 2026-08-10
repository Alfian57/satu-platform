<?php

use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

test('organization review is denied for all users until platform-admin mechanism exists', function () {
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

test('cross-tenant review viewing is denied until platform-admin mechanism exists', function () {
    $membership = RecruiterMembership::factory()->create();
    $review = RecruiterVerificationReview::factory()->create(); // different org

    expect($membership->user->can('view', $review))->toBeFalse();
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

test('organization cannot be updated if its status is suspended', function () {
    $org = RecruiterOrganization::factory()->suspended()->create();
    $membership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $user = $membership->user;

    expect($user->can('update', $org))->toBeFalse();
});

test('organization cannot be updated if its status is rejected', function () {
    $org = RecruiterOrganization::factory()->rejected()->create();
    $membership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $user = $membership->user;

    expect($user->can('update', $org))->toBeFalse();
});

test('suspended member cannot update the organization', function () {
    $org = RecruiterOrganization::factory()->verified()->create();
    $membership = RecruiterMembership::factory()->owner()->suspended()->create(['recruiter_organization_id' => $org->id]);
    $user = $membership->user;

    expect($user->can('update', $org))->toBeFalse();
});

test('membership owner cannot be demoted or updated', function () {
    $org = RecruiterOrganization::factory()->verified()->create();
    $ownerMembership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $adminMembership = RecruiterMembership::factory()->admin()->create(['recruiter_organization_id' => $org->id]);

    expect($ownerMembership->user->can('update', $ownerMembership))->toBeFalse();
    expect($adminMembership->user->can('update', $ownerMembership))->toBeFalse();
});

test('membership owner cannot be deleted', function () {
    $org = RecruiterOrganization::factory()->verified()->create();
    $ownerMembership = RecruiterMembership::factory()->owner()->create(['recruiter_organization_id' => $org->id]);
    $adminMembership = RecruiterMembership::factory()->admin()->create(['recruiter_organization_id' => $org->id]);

    expect($ownerMembership->user->can('delete', $ownerMembership))->toBeFalse();
    expect($adminMembership->user->can('delete', $ownerMembership))->toBeFalse();
});
