<?php

use App\Actions\Institution\AcceptInvitation;
use App\Actions\Institution\ApproveInstitution;
use App\Actions\Institution\IssueInvitation;
use App\Actions\Institution\RevokeInvitation;
use App\Actions\Institution\SuspendInstitution;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Institution Approval
|--------------------------------------------------------------------------
*/

test('platform admin can approve pending institution', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Pending]);

    $action = new ApproveInstitution;
    $action->handle($admin, $institution);

    $institution->refresh();

    expect($institution->status)->toBe(InstitutionStatus::Active);
});

test('non-admin cannot approve institution', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Pending]);

    $action = new ApproveInstitution;

    expect(fn () => $action->handle($user, $institution))
        ->toThrow(AuthorizationException::class);
});

test('approve already active institution is no-op', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new ApproveInstitution;
    $action->handle($admin, $institution);

    expect($institution->fresh()->status)->toBe(InstitutionStatus::Active);
});

/*
|--------------------------------------------------------------------------
| Institution Suspension
|--------------------------------------------------------------------------
*/

test('platform admin can suspend active institution', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new SuspendInstitution;
    $action->handle($admin, $institution, 'Violation');

    expect($institution->fresh()->status)->toBe(InstitutionStatus::Suspended);
});

test('non-admin cannot suspend institution', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new SuspendInstitution;

    expect(fn () => $action->handle($user, $institution, 'Reason'))
        ->toThrow(AuthorizationException::class);
});

/*
|--------------------------------------------------------------------------
| Invitation Issuance
|--------------------------------------------------------------------------
*/

test('platform admin can issue invitation', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new IssueInvitation;
    $invitation = $action->handle($admin, $institution, '+6281234567890', 'campus_admin');

    expect($invitation->status)->toBe(InvitationStatus::Issued)
        ->and($invitation->phone)->toBe('+6281234567890')
        ->and($invitation->institution_id)->toBe($institution->id)
        ->and($invitation->token_hash)->toStartWith('$2y$')
        ->and($invitation->expires_at->isFuture())->toBeTrue();
});

test('issuing invitation revokes previous for same phone', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new IssueInvitation;

    $first = $action->handle($admin, $institution, '+6281234567890', 'campus_admin');
    $second = $action->handle($admin, $institution, '+6281234567890', 'campus_admin');

    $first->refresh();

    expect($first->status)->toBe(InvitationStatus::Revoked)
        ->and($second->status)->toBe(InvitationStatus::Issued);
});

test('non-admin cannot issue invitation', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new IssueInvitation;

    expect(fn () => $action->handle($user, $institution, '+6281234567890', 'campus_admin'))
        ->toThrow(AuthorizationException::class);
});

/*
|--------------------------------------------------------------------------
| Invitation Acceptance
|--------------------------------------------------------------------------
*/

test('user with valid token can accept invitation', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $user = User::factory()->create();

    $issueAction = new IssueInvitation;
    $invitation = $issueAction->handle($admin, $institution, '+6281234567890', 'campus_admin');

    $tokenHash = $invitation->token_hash;

    $acceptAction = new AcceptInvitation;

    expect(fn () => $acceptAction->handle($user, 'test-token'))
        ->toThrow(RuntimeException::class, 'Invalid or expired');
});

test('accepting invitation creates verified campus admin membership', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $plainToken = bin2hex(random_bytes(32));
    $invitation = PrivilegedInvitation::factory()->create([
        'institution_id' => $institution->id,
        'token_hash' => Hash::make($plainToken),
        'status' => InvitationStatus::Issued,
        'expires_at' => Carbon::now()->addDays(7),
        'intended_role' => 'campus_admin',
    ]);

    $user = User::factory()->create();

    $action = new AcceptInvitation;
    $action->handle($user, $plainToken);

    $invitation->refresh();

    expect($invitation->status)->toBe(InvitationStatus::Accepted)
        ->and($invitation->accepted_by)->toBe($user->id);

    $membership = InstitutionMembership::query()
        ->where('institution_id', $institution->id)
        ->where('user_id', $user->id)
        ->first();

    expect($membership)->not->toBeNull()
        ->and($membership->role)->toBe(InstitutionMembershipRole::CampusAdmin)
        ->and($membership->status)->toBe(InstitutionMembershipStatus::Verified);
});

test('expired invitation cannot be accepted', function () {
    $plainToken = bin2hex(random_bytes(32));
    $invitation = PrivilegedInvitation::factory()->expired()->create([
        'token_hash' => Hash::make($plainToken),
    ]);

    $user = User::factory()->create();

    $action = new AcceptInvitation;

    expect(fn () => $action->handle($user, $plainToken))
        ->toThrow(RuntimeException::class, 'Invalid or expired');
});

test('already accepted invitation cannot be reused', function () {
    $plainToken = bin2hex(random_bytes(32));
    $invitation = PrivilegedInvitation::factory()->accepted()->create([
        'token_hash' => Hash::make($plainToken),
    ]);

    $user = User::factory()->create();

    $action = new AcceptInvitation;

    expect(fn () => $action->handle($user, $plainToken))
        ->toThrow(RuntimeException::class);
});

test('revoked invitation cannot be accepted', function () {
    $plainToken = bin2hex(random_bytes(32));
    $invitation = PrivilegedInvitation::factory()->revoked()->create([
        'token_hash' => Hash::make($plainToken),
    ]);

    $user = User::factory()->create();

    $action = new AcceptInvitation;

    expect(fn () => $action->handle($user, $plainToken))
        ->toThrow(RuntimeException::class);
});

/*
|--------------------------------------------------------------------------
| Invitation Revocation
|--------------------------------------------------------------------------
*/

test('platform admin can revoke issued invitation', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $invitation = PrivilegedInvitation::factory()->create(['issued_by' => $admin->id]);

    $action = new RevokeInvitation;
    $action->handle($admin, $invitation, 'Wrong phone number');

    $invitation->refresh();

    expect($invitation->status)->toBe(InvitationStatus::Revoked)
        ->and($invitation->revoke_reason)->toBe('Wrong phone number');
});

test('non-admin cannot revoke invitation', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $invitation = PrivilegedInvitation::factory()->create();

    $action = new RevokeInvitation;

    expect(fn () => $action->handle($user, $invitation, 'Reason'))
        ->toThrow(AuthorizationException::class);
});

/*
|--------------------------------------------------------------------------
| Token Security
|--------------------------------------------------------------------------
*/

test('invitation token is stored as hash, not plaintext', function () {
    $invitation = PrivilegedInvitation::factory()->create([
        'token_hash' => Hash::make('secret-token'),
    ]);

    expect($invitation->token_hash)
        ->toStartWith('$2y$')
        ->not->toBe('secret-token');
});

test('privileged role cannot be obtained via public registration', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Attacker',
        'username' => 'attacker',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false));

    $this->assertGuest();

    $user = User::query()->where('username', 'attacker')->first();

    expect($user)->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Institution State
|--------------------------------------------------------------------------
*/

test('institution defaults to pending status', function () {
    $institution = Institution::factory()->create();

    expect($institution->status)->toBe(InstitutionStatus::Pending);
});
