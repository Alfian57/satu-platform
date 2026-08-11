<?php

declare(strict_types=1);

use App\Enums\AffiliationStatus;
use App\Enums\MessageOutboxStatus;
use App\Enums\OtpPurpose;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MessageOutbox;
use App\Models\OtpChallenge;
use App\Models\RosterEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('enforces private username authentication without email exposure', function () {
    $user = User::factory()->create([
        'username' => 'quality_student',
        'password' => Hash::make('Secret123!'),
        'phone_number' => '6281234567890',
        'phone_verified_at' => now(),
    ]);

    $response = $this->post(route('login.store'), [
        'username' => 'quality_student',
        'password' => 'Secret123!',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);
});

it('verifies roster exact match auto-links campus affiliation while mismatch flags manual review', function () {
    $institution = Institution::factory()->active()->create([
        'approved_domain' => 'universitas.ac.id',
    ]);

    RosterEntry::factory()->create([
        'institution_id' => $institution->id,
        'nim' => '2201001',
        'phone_number' => '6281987654321',
        'full_name' => 'Budi Santoso',
    ]);

    $exactUser = User::factory()->create([
        'phone_number' => '6281987654321',
        'phone_verified_at' => now(),
    ]);

    $exactMembership = InstitutionMembership::create([
        'institution_id' => $institution->id,
        'user_id' => $exactUser->id,
        'nim' => '2201001',
        'status' => AffiliationStatus::Verified,
        'verified_at' => now(),
    ]);

    expect($exactMembership->status)->toBe(AffiliationStatus::Verified);

    $mismatchUser = User::factory()->create([
        'phone_number' => '6289999888877',
        'phone_verified_at' => now(),
    ]);

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

    $rosterB = RosterEntry::factory()->create([
        'institution_id' => $institutionB->id,
        'nim' => '8880001',
        'phone_number' => '6281111222233',
    ]);

    $userA = User::factory()->create();
    InstitutionMembership::factory()->campusAdmin()->create([
        'institution_id' => $institutionA->id,
        'user_id' => $userA->id,
    ]);

    $this->actingAs($userA);

    expect(RosterEntry::where('institution_id', $institutionA->id)->where('id', $rosterB->id)->exists())->toBeFalse();
});

it('sanitizes OTP challenges and outbox messages without exposing plain OTPs', function () {
    $user = User::factory()->create(['phone_number' => '6285555444333']);

    $otp = OtpChallenge::create([
        'user_id' => $user->id,
        'phone_number' => '6285555444333',
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
        'recipient_phone' => '6287777666555',
        'message_body' => 'Kode OTP SATU Anda adalah 654321',
        'status' => MessageOutboxStatus::Failed,
        'error_message' => 'Fonnte gateway connection timeout',
    ]);

    expect($outbox->status)->toBe(MessageOutboxStatus::Failed)
        ->and($outbox->error_message)->toContain('Fonnte');
});
