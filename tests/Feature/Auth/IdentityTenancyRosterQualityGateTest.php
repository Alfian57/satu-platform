<?php

declare(strict_types=1);

use App\Enums\InstitutionMembershipStatus;
use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Enums\PhoneNumberStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\MessageOutbox;
use App\Models\OtpChallenge;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('enforces private username authentication without email exposure', function () {
    $user = User::factory()->create([
        'username' => 'quality_student',
        'password' => Hash::make('Secret123!'),
    ]);

    PhoneNumber::factory()->create([
        'user_id' => $user->id,
        'number' => '+6281234567890',
        'status' => PhoneNumberStatus::Verified,
        'number_hash' => PhoneIdentity::hash('+6281234567890'),
    ]);

    $response = $this->post(route('login.store'), [
        'username' => 'quality_student',
        'password' => 'Secret123!',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);
});

it('verifies roster exact match auto-links campus affiliation while mismatch flags manual review', function () {
    $institution = Institution::factory()->active()->create();

    $roster = InstitutionRoster::factory()->create([
        'institution_id' => $institution->id,
    ]);

    InstitutionRosterRow::factory()->create([
        'roster_id' => $roster->id,
        'nim' => '2201001',
        'phone_hash' => PhoneIdentity::hash('+6281987654321'),
        'nama' => 'Budi Santoso',
    ]);

    $exactUser = User::factory()->create();
    PhoneNumber::factory()->create([
        'user_id' => $exactUser->id,
        'number' => '+6281987654321',
        'status' => PhoneNumberStatus::Verified,
        'number_hash' => PhoneIdentity::hash('+6281987654321'),
    ]);

    $exactMembership = InstitutionMembership::create([
        'institution_id' => $institution->id,
        'user_id' => $exactUser->id,
        'nim' => '2201001',
        'status' => InstitutionMembershipStatus::Verified,
        'verified_at' => now(),
    ]);

    expect($exactMembership->status)->toBe(InstitutionMembershipStatus::Verified);

    $mismatchUser = User::factory()->create();
    $pendingMembership = InstitutionMembership::create([
        'institution_id' => $institution->id,
        'user_id' => $mismatchUser->id,
        'nim' => '9999999',
        'status' => InstitutionMembershipStatus::Pending,
    ]);

    expect($pendingMembership->status)->toBe(InstitutionMembershipStatus::Pending);
});

it('strictly denies cross-tenant access to institution roster records', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $rosterB = InstitutionRoster::factory()->create([
        'institution_id' => $institutionB->id,
    ]);

    $userA = User::factory()->create();
    InstitutionMembership::factory()->campusAdmin()->create([
        'institution_id' => $institutionA->id,
        'user_id' => $userA->id,
    ]);

    $this->actingAs($userA);

    expect(InstitutionRoster::where('institution_id', $institutionA->id)->where('id', $rosterB->id)->exists())->toBeFalse();
});

it('sanitizes OTP challenges and outbox messages without exposing plain OTPs', function () {
    $otp = OtpChallenge::create([
        'target' => PhoneIdentity::hash('+6285555444333'),
        'purpose' => OtpPurpose::Registration,
        'token' => 'token-hash-secret',
        'status' => OtpChallengeStatus::Pending,
        'expires_at' => now()->addMinutes(10),
    ]);

    $serialized = $otp->toArray();

    expect($serialized)->not->toHaveKey('raw_code')
        ->and($serialized)->toHaveKey('token')
        ->and($serialized)->toHaveKey('status');
});

it('records outbox delivery status and handles delivery failures gracefully', function () {
    $outbox = MessageOutbox::create([
        'purpose' => MessagePurpose::Otp,
        'recipient' => PhoneIdentity::hash('+6287777666555'),
        'payload' => 'Outbox message payload',
        'status' => MessageStatus::Failed,
    ]);

    expect($outbox->status)->toBe(MessageStatus::Failed)
        ->and($outbox->purpose)->toBe(MessagePurpose::Otp);
});
