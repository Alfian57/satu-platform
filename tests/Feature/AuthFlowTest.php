<?php

use App\Enums\MessageStatus;
use App\Models\MessageOutbox;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;
use App\Support\PhoneIdentity;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->fakeWhatsApp = new FakeWhatsAppGateway;
    $this->app->instance(WhatsAppGateway::class, $this->fakeWhatsApp);
});

test('registration creates an account only after WhatsApp OTP verification', function () {
    $phone = '+6281234567890';

    $response = $this->post(route('register.start'), [
        'name' => 'Verified Student',
        'username' => 'verified_student',
        'phone' => $phone,
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false));

    $outbox = MessageOutbox::query()->firstOrFail();
    $flow = $this->app['session']->get('auth.registration');

    expect($outbox->status)->toBe(MessageStatus::Sent)
        ->and($outbox->payload)->not->toContain('Kode verifikasi SATU:')
        ->and($flow['phone'])->not->toContain($phone)
        ->and($this->fakeWhatsApp->sentMessages())->toHaveCount(1)
        ->and(User::query()->where('username', 'verified_student')->exists())->toBeFalse();

    $response = $this->post(route('register.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ]);

    $user = User::query()->where('username', 'verified_student')->firstOrFail();

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('onboarding.show', absolute: false));

    expect(PhoneNumber::query()->whereBelongsTo($user, 'user')->firstOrFail()->status->value)
        ->toBe('verified');
});

test('registration exposes a lockout state after repeated invalid OTP attempts', function () {
    $this->post(route('register.start'), [
        'name' => 'Locked Student',
        'username' => 'locked_student',
        'phone' => '+6281234567891',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('register.otp', absolute: false));

    $otp = latestWhatsappOtp($this->fakeWhatsApp);
    $invalidOtp = $otp === '000000' ? '111111' : '000000';

    for ($attempt = 0; $attempt < 3; $attempt++) {
        $response = $this->post(route('register.otp.verify'), [
            'otp' => $invalidOtp,
        ]);
    }

    $response->assertSessionHasErrors('otp', 'Batas percobaan kode tercapai. Tunggu jeda kirim ulang, lalu minta kode baru.');

    $this->get(route('register.otp'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('registration.deliveryStatus', 'locked'));

    $this->assertGuest();
});

test('registration records delivery failure without exposing the OTP', function () {
    $this->fakeWhatsApp->shouldFail = true;

    $response = $this->post(route('register.start'), [
        'name' => 'Delivery Failure',
        'username' => 'delivery_failure',
        'phone' => '+6281234567892',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('register.otp', absolute: false))
        ->assertSessionHas('auth.registration.delivery_status', 'failed');

    $outbox = MessageOutbox::query()->firstOrFail();

    expect($outbox->deliveries()->latest('id')->firstOrFail()->status)
        ->toBe(MessageStatus::Failed)
        ->and($this->fakeWhatsApp->sentMessages())->toBeEmpty();
});

test('recovery keeps unknown phone responses enumeration safe', function () {
    $response = $this->post(route('recover.start'), [
        'phone' => '+6281234567893',
    ]);

    $response->assertRedirect(route('recover.otp', absolute: false));

    expect(MessageOutbox::query()->count())->toBe(0);

    $this->get(route('recover.otp'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/recover')
            ->where('recovery.step', 'otp')
            ->where('recovery.deliveryStatus', 'unknown'));
});

test('verified users can recover their password through WhatsApp OTP', function () {
    $phone = '+6281234567894';
    $user = User::factory()->create();
    PhoneNumber::factory()->for($user)->forNumber($phone)->create();

    $response = $this->post(route('recover.start'), [
        'phone' => $phone,
    ]);

    $response->assertRedirect(route('recover.otp', absolute: false));

    $response = $this->post(route('recover.otp.verify'), [
        'otp' => latestWhatsappOtp($this->fakeWhatsApp),
    ]);

    $response->assertRedirect(route('recover.reset', absolute: false));

    $response = $this->post(route('recover.password.update'), [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertRedirect(route('login', absolute: false))
        ->assertSessionHas('status');

    $this->assertGuest();
    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('valid invitation exposes only safe invitation details', function () {
    $token = 'valid-invitation-token';
    $invitation = PrivilegedInvitation::factory()->create([
        'phone' => '+6281234567895',
        'token_hash' => Hash::make($token),
    ]);

    $this->get(route('invitation.show', ['token' => $token]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/invitation')
            ->where('invitation.status', 'valid')
            ->where('invitation.institutionName', $invitation->institution->name)
            ->where('invitation.maskedPhone', PhoneIdentity::mask($invitation->phone))
            ->missing('invitation.token'));
});

test('expired invitation does not expose its recipient or role', function () {
    $token = 'expired-invitation-token';
    PrivilegedInvitation::factory()->expired()->create([
        'token_hash' => Hash::make($token),
    ]);

    $this->get(route('invitation.show', ['token' => $token]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/invitation')
            ->where('invitation.status', 'expired')
            ->missing('invitation.maskedPhone')
            ->missing('invitation.intendedRole'));
});
