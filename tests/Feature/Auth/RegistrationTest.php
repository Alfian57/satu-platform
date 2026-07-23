<?php

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    Notification::fake();

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('verification.notice', absolute: false));

    $user = User::query()->where('email', 'test@example.com')->firstOrFail();

    expect($user->email_verified_at)->toBeNull()
        ->and($user->institutionMemberships)->toBeEmpty();

    Notification::assertSentTo($user, VerifyEmail::class);
});

test('registration ignores privileged role and membership fields', function () {
    Notification::fake();

    $this->post(route('register.store'), [
        'name' => 'Student Without Affiliation',
        'email' => 'student@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'campus_admin',
        'institution_id' => 999,
        'membership_status' => 'verified',
        'verification_method' => 'approved_domain',
    ])->assertRedirect(route('verification.notice', absolute: false));

    $user = User::query()->where('email', 'student@example.com')->firstOrFail();

    expect($user->institutionMemberships)->toBeEmpty()
        ->and($user->getAttribute('role'))->toBeNull();
});

test('registration always redirects to the internal verification notice', function () {
    Notification::fake();

    $response = $this->withSession([
        'url.intended' => 'https://malicious.example/steal-session',
    ])->post(route('register.store'), [
        'name' => 'Safe Redirect User',
        'email' => 'safe-redirect@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('verification.notice', absolute: false));
});

test('registration rejects duplicate email addresses', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Duplicate User',
        'email' => 'existing@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHasErrors('email');

    expect(User::query()->where('email', 'existing@example.com')->count())->toBe(1);
});
