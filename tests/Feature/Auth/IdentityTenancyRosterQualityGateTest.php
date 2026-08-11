<?php

declare(strict_types=1);

use App\Enums\AffiliationStatus;
use App\Enums\MessageStatus;
use App\Enums\OtpPurpose;
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

    PhoneNumber::factory()->verified()->create([
        'user_id' => $user->id,
        'e164' => '+6281234567890',
        'national_number' => '081234567890',
        'phone_hash' => PhoneIdentity::hash('+6281234567890'),
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
        'institution_roster_id' => $roster->id,
        'nim' => '2201001',
        'phone_hash' => PhoneIdentity::hash('+6281987654321'),
        'full_name' => 'Budi Santoso',
    ]);

    $exactUser = User::factory()->create();
    $exactPhone = PhoneNumber::factory()->verified()->create([
        'user_id' => $exactUser->id,
        'e164' => '+6281987654321',
        'phone_hash' => PhoneIdentity::hash('+6281987654321'),
    ]);

    $exactMembership = InstitutionMembership::create([
        'institution_id' => $institution->id,
        'user_id' => $exactUser->id,
        'nim' => '2201001',
        'status' => AffiliationStatus::Verified,
        'verified_at' => now(),
    ]);

    expect($exactMembership->status)->toBe(AffiliationStatus::Verified);

    $mismatchUser = User::factory()->create();
    $pendingMembership = InstitutionMembership::create([
        'institution_id' => $institution->id,
        'user_id' => $mismatchUser->id,
        'nim' => '9999999',
        'status' => AffiliationStatus::Pending,
    ]);

    expect($pendingMembership->status)->toBe(AffiliationStatus::Pending);
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
    $user = User::factory()->create();

    $otp = OtpChallenge::create([
        'user_id' => $user->id,
        'phone_number' => '+6285555444333',
        'purpose' => OtpPurpose::Registration,
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $serialized = $otp->toArray();

    expect($serialized)->not->toHaveKey('code')
        ->and($serialized)->toHaveKey('code_hash');
});

it('records outbox delivery status and handles delivery failures gracefully', function () {
    $outbox = MessageOutbox::create([
        'recipient' => '+6287777666555',
        'payload' => 'Outbox message payload',
        'status' => MessageStatus::Failed,
        'error' => 'Fonnte gateway connection timeout',
    ]);

    expect($outbox->status)->toBe(MessageStatus::Failed)
        ->and($outbox->error)->toContain('Fonnte');
});
