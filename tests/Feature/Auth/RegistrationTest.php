<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'username' => 'testuser',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::query()->where('username', 'testuser')->firstOrFail();

    expect($user->name)->toBe('Test User')
        ->and($user->institutionMemberships)->toBeEmpty();
});

test('registration ignores privileged role and membership fields', function () {
    $this->post(route('register.store'), [
        'name' => 'Student Without Affiliation',
        'username' => 'student_no_affil',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'campus_admin',
        'institution_id' => 999,
        'membership_status' => 'verified',
        'verification_method' => 'approved_domain',
    ])->assertRedirect(route('dashboard', absolute: false));

    $user = User::query()->where('username', 'student_no_affil')->firstOrFail();

    expect($user->institutionMemberships)->toBeEmpty()
        ->and($user->getAttribute('role'))->toBeNull();
});

test('registration always redirects to the internal dashboard', function () {
    $response = $this->withSession([
        'url.intended' => 'https://malicious.example/steal-session',
    ])->post(route('register.store'), [
        'name' => 'Safe Redirect User',
        'username' => 'safe_redirect',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
});

test('registration rejects duplicate usernames', function () {
    User::factory()->create(['username' => 'existing']);

    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Duplicate User',
        'username' => 'existing',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHasErrors('username');

    expect(User::query()->where('username', 'existing')->count())->toBe(1);
});
