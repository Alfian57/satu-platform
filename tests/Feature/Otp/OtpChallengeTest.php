<?php

use App\Actions\Otp\GenerateOtp;
use App\Actions\Otp\InvalidateOtp;
use App\Actions\Otp\VerifyOtp;
use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Models\OtpChallenge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 6, 15, 12, 0, 0));
});

afterEach(function () {
    Carbon::setTestNow(null);
});

/*
|--------------------------------------------------------------------------
| OTP Generation
|--------------------------------------------------------------------------
*/

test('generates an OTP and stores its hash, not plaintext', function () {
    $action = new GenerateOtp;

    $plainOtp = $action->handle(
        OtpPurpose::Registration,
        '+6281234567890',
    );

    expect($plainOtp)->toBeString()->toHaveLength(6);

    $challenge = OtpChallenge::query()->first();

    expect($challenge)->not->toBeNull()
        ->and($challenge->purpose)->toBe(OtpPurpose::Registration)
        ->and($challenge->target)->toBe('+6281234567890')
        ->and($challenge->token)->not->toBe($plainOtp)
        ->and(Hash::check($plainOtp, $challenge->token))->toBeTrue()
        ->and($challenge->status)->toBe(OtpChallengeStatus::Pending)
        ->and($challenge->expires_at->isFuture())->toBeTrue();
});

test('invalidates previous pending OTP for same purpose and target', function () {
    $old = OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Registration,
        'target' => '+6281234567890',
        'status' => OtpChallengeStatus::Pending,
    ]);

    $action = new GenerateOtp;
    $action->handle(OtpPurpose::Registration, '+6281234567890');

    $old->refresh();

    expect($old->status)->toBe(OtpChallengeStatus::Invalidated)
        ->and($old->invalidated_at)->not->toBeNull();
});

test('enforces resend limit within one hour', function () {
    $action = new GenerateOtp;

    for ($i = 0; $i < 2; $i++) {
        $action->handle(OtpPurpose::Registration, '+6281234567890');
    }

    expect(fn () => $action->handle(OtpPurpose::Registration, '+6281234567890'))
        ->toThrow(RuntimeException::class, 'resend');
});

test('resend limit resets after one hour', function () {
    $action = new GenerateOtp;

    $action->handle(OtpPurpose::Registration, '+6281234567890');

    Carbon::setTestNow(Carbon::now()->addHour()->addMinute());

    $action->handle(OtpPurpose::Registration, '+6281234567890');

    $pendingCount = OtpChallenge::query()
        ->purpose(OtpPurpose::Registration)
        ->target('+6281234567890')
        ->pending()
        ->count();

    expect($pendingCount)->toBe(1);
});

/*
|--------------------------------------------------------------------------
| OTP Verification
|--------------------------------------------------------------------------
*/

test('verifies correct OTP and marks consumed', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;
    $result = $verify->handle(OtpPurpose::Registration, '+6281234567890', $plainOtp);

    expect($result)->toBeTrue();

    $challenge = OtpChallenge::query()->first();

    expect($challenge->status)->toBe(OtpChallengeStatus::Consumed)
        ->and($challenge->consumed_at)->not->toBeNull();
});

test('rejects wrong OTP', function () {
    $action = new GenerateOtp;
    $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;
    $result = $verify->handle(OtpPurpose::Registration, '+6281234567890', '000000');

    expect($result)->toBeFalse();

    $challenge = OtpChallenge::query()->first();

    expect($challenge->status)->toBe(OtpChallengeStatus::Pending)
        ->and($challenge->attempts)->toBe(1);
});

test('rejects expired OTP', function () {
    OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Registration,
        'target' => '+6281234567890',
        'token' => Hash::make('123456'),
        'status' => OtpChallengeStatus::Pending,
        'expires_at' => Carbon::now()->subMinute(),
    ]);

    $verify = new VerifyOtp;
    $result = $verify->handle(OtpPurpose::Registration, '+6281234567890', '123456');

    expect($result)->toBeFalse();
});

test('rejects already consumed OTP (replay protection)', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;
    $verify->handle(OtpPurpose::Registration, '+6281234567890', $plainOtp);

    $result = $verify->handle(OtpPurpose::Registration, '+6281234567890', $plainOtp);

    expect($result)->toBeFalse();
});

test('locks out after max attempts', function () {
    $action = new GenerateOtp;
    $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;

    for ($i = 0; $i < 3; $i++) {
        $verify->handle(OtpPurpose::Registration, '+6281234567890', '000000');
    }

    $challenge = OtpChallenge::query()->first();

    expect($challenge->attempts)->toBe(3)
        ->and($challenge->status)->toBe(OtpChallengeStatus::Failed);
});

test('returns generic false for non-existent challenge', function () {
    $verify = new VerifyOtp;

    $result = $verify->handle(OtpPurpose::Registration, '+6289999999999', '123456');

    expect($result)->toBeFalse();
});

test('returns generic false for wrong purpose', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;
    $result = $verify->handle(OtpPurpose::Recovery, '+6281234567890', $plainOtp);

    expect($result)->toBeFalse();
});

test('returns generic false for wrong target', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;
    $result = $verify->handle(OtpPurpose::Registration, '+6289999999999', $plainOtp);

    expect($result)->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Concurrent Consumption (Atomic Replay Protection)
|--------------------------------------------------------------------------
*/

test('rejects concurrent consumption atomically', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $verify = new VerifyOtp;

    $results = [];
    $errors = [];

    DB::transaction(function () use ($plainOtp, $verify, &$results) {
        $results[] = $verify->handle(OtpPurpose::Registration, '+6281234567890', $plainOtp);
        $results[] = $verify->handle(OtpPurpose::Registration, '+6281234567890', $plainOtp);
    });

    expect($results)->toHaveCount(2)
        ->and(array_filter($results))->toHaveCount(1);
});

/*
|--------------------------------------------------------------------------
| Invalidation
|--------------------------------------------------------------------------
*/

test('invalidates pending OTP for a specific purpose', function () {
    OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Registration,
        'target' => '+6281234567890',
        'status' => OtpChallengeStatus::Pending,
    ]);

    $action = new InvalidateOtp;
    $action->handle(OtpPurpose::Registration, '+6281234567890');

    $challenge = OtpChallenge::query()->first();

    expect($challenge->status)->toBe(OtpChallengeStatus::Invalidated)
        ->and($challenge->invalidated_at)->not->toBeNull();
});

test('invalidates all pending OTPs for a target', function () {
    OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Registration,
        'target' => '+6281234567890',
        'status' => OtpChallengeStatus::Pending,
    ]);
    OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Recovery,
        'target' => '+6281234567890',
        'status' => OtpChallengeStatus::Pending,
    ]);

    $action = new InvalidateOtp;
    $action->handleAll('+6281234567890');

    $pending = OtpChallenge::query()
        ->target('+6281234567890')
        ->pending()
        ->count();

    expect($pending)->toBe(0);
});

/*
|--------------------------------------------------------------------------
| OTP Plaintext Never Stored or Logged
|--------------------------------------------------------------------------
*/

test('OTP hash in database is not reversible', function () {
    $action = new GenerateOtp;
    $plainOtp = $action->handle(OtpPurpose::Registration, '+6281234567890');

    $challenge = OtpChallenge::query()->first();

    expect($challenge->token)
        ->toStartWith('$2y$')
        ->not->toBe($plainOtp)
        ->not->toContain($plainOtp);
});

test('does not leak OTP in serialized model', function () {
    OtpChallenge::factory()->create([
        'purpose' => OtpPurpose::Registration,
        'target' => '+6281234567890',
        'token' => Hash::make('123456'),
    ]);

    $challenge = OtpChallenge::query()->first();
    $serialized = $challenge->toArray();

    expect($serialized)
        ->toHaveKey('token')
        ->and($serialized['token'])->not->toBe('123456');
});

/*
|--------------------------------------------------------------------------
| Edge Cases
|--------------------------------------------------------------------------
*/

test('generates unique OTPs for different requests', function () {
    $action = new GenerateOtp;

    $otp1 = $action->handle(OtpPurpose::Registration, '+6281234567890');
    $otp2 = $action->handle(OtpPurpose::Registration, '+6281234567890');

    expect($otp1)->not->toBe($otp2);
});

test('same target can have OTPs for different purposes', function () {
    $action = new GenerateOtp;

    $otpReg = $action->handle(OtpPurpose::Registration, '+6281234567890');
    $otpRec = $action->handle(OtpPurpose::Recovery, '+6281234567890');

    $registrationChallenges = OtpChallenge::query()
        ->purpose(OtpPurpose::Registration)
        ->target('+6281234567890')
        ->pending()
        ->count();

    $recoveryChallenges = OtpChallenge::query()
        ->purpose(OtpPurpose::Recovery)
        ->target('+6281234567890')
        ->pending()
        ->count();

    expect($registrationChallenges)->toBe(1)
        ->and($recoveryChallenges)->toBe(1);
});
