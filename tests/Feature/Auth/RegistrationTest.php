<?php

use App\Models\User;
use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
    $this->fakeWhatsApp = new FakeWhatsAppGateway;
    $this->app->instance(WhatsAppGateway::class, $this->fakeWhatsApp);
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.start'), [
        'name' => 'Test User',
        'username' => 'testuser',
        'phone' => '+6281234567890',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false));

    $response = $this->post(route('register.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('onboarding.show', absolute: false));

    $user = User::query()->where('username', 'testuser')->firstOrFail();

    expect($user->name)->toBe('Test User')
        ->and($user->institutionMemberships)->toBeEmpty();
});

test('registration ignores privileged role and membership fields', function () {
    $response = $this->post(route('register.start'), [
        'name' => 'Student Without Affiliation',
        'username' => 'student_no_affil',
        'phone' => '+6281234567891',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'campus_admin',
        'institution_id' => 999,
        'membership_status' => 'verified',
        'verification_method' => 'approved_domain',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false));

    $this->post(route('register.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ])->assertRedirect(route('onboarding.show', absolute: false));

    $user = User::query()->where('username', 'student_no_affil')->firstOrFail();

    expect($user->institutionMemberships)->toBeEmpty()
        ->and($user->getAttribute('role'))->toBeNull();
});

test('registration always redirects to internal onboarding', function () {
    $response = $this->withSession([
        'url.intended' => 'https://malicious.example/steal-session',
    ])->post(route('register.start'), [
        'name' => 'Safe Redirect User',
        'username' => 'safe_redirect',
        'phone' => '+6281234567892',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false));

    $this->post(route('register.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ])->assertRedirect(route('onboarding.show', absolute: false));
});

test('registration rejects duplicate usernames', function () {
    User::factory()->create(['username' => 'existing']);

    $response = $this->from(route('register'))->post(route('register.start'), [
        'name' => 'Duplicate User',
        'username' => 'existing',
        'phone' => '+6281234567893',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHasErrors('username');

    expect(User::query()->where('username', 'existing')->count())->toBe(1);
});

test('registration normalizes mixed-case and whitespace in username', function () {
    $response = $this->post(route('register.start'), [
        'name' => 'Normalized User',
        'username' => '  TestUSER  ',
        'phone' => '+6281234567894',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false));

    $response = $this->post(route('register.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('onboarding.show', absolute: false));

    $user = User::query()->where('username', 'testuser')->firstOrFail();

    expect($user->username)->toBe('testuser');
});

test('registration rejects duplicate username regardless of case', function () {
    User::factory()->create(['username' => 'existing']);

    $response = $this->from(route('register'))->post(route('register.start'), [
        'name' => 'Duplicate Cased',
        'username' => 'EXISTING',
        'phone' => '+6281234567895',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHasErrors('username');

    expect(User::query()->where('username', 'existing')->count())->toBe(1);
});

test('registration cannot bypass WhatsApp verification', function () {
    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Unverified User',
        'username' => 'unverified_user',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register', absolute: false))
        ->assertSessionHasErrors('phone');

    $this->assertGuest();
    expect(User::query()->where('username', 'unverified_user')->exists())->toBeFalse();
});
