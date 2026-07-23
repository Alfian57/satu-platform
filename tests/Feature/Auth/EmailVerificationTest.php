<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

test('unverified users are redirected to the verification notice for collaboration routes', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertRedirect(route('verification.notice', absolute: false));
});

test('verification notice is rendered with a safe auth projection', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('verification.notice'))
        ->assertSuccessful()
        ->assertInertia(
            fn ($page) => $page
                ->component('auth/verify-email')
                ->where('auth.user.id', $user->id)
                ->where('auth.user.email', $user->email)
                ->missing('auth.user.password')
                ->missing('auth.user.institution_id'),
        );
});

test('users can request a verification link again', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect(route('verification.notice', absolute: false))
        ->assertSessionHas('status', 'verification-link-sent');

    Notification::assertSentTo($user, VerifyEmail::class);
});

test('a signed verification link verifies the user and uses the internal onboarding redirect', function () {
    Event::fake([Verified::class]);
    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(10),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $response = $this->withSession([
        'url.intended' => 'https://malicious.example/redirect',
    ])->actingAs($user)->get($verificationUrl);

    $response->assertRedirect(route('onboarding.show', absolute: false));
    expect($user->refresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatched(Verified::class);
});

test('invalid verification links are rejected', function () {
    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->subMinute(),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $this->actingAs($user)->get($verificationUrl)->assertForbidden();
    expect($user->refresh()->hasVerifiedEmail())->toBeFalse();
});

test('verification links for a different email hash are rejected', function () {
    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(10),
        ['id' => $user->id, 'hash' => sha1('different@example.com')],
    );

    $this->actingAs($user)->get($verificationUrl)->assertForbidden();
    expect($user->refresh()->hasVerifiedEmail())->toBeFalse();
});

test('verification resend endpoint is throttled', function () {
    $user = User::factory()->unverified()->create();
    $this->actingAs($user);

    foreach (range(1, 6) as $attempt) {
        $this->post(route('verification.send'))->assertRedirect();
    }

    $this->post(route('verification.send'))->assertTooManyRequests();
});
