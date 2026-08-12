<?php

declare(strict_types=1);

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Auth\DispatchAuthOtp;
use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Enums\OtpPurpose;
use App\Exceptions\VerifiedPhoneRequired;
use App\Jobs\SendWhatsAppMessage;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\MessageDelivery;
use App\Models\MessageOutbox;
use App\Models\OtpChallenge;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;
use App\Support\PhoneIdentity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('enforces private username authentication without email exposure', function () {
    $user = User::factory()->create([
        'username' => 'quality_student',
        'password' => Hash::make('Secret123!'),
    ]);

    PhoneNumber::factory()
        ->for($user)
        ->forNumber('+6281234567890')
        ->create();

    $response = $this->post(route('login.store'), [
        'username' => 'quality_student',
        'password' => 'Secret123!',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);

    $serialized = $user->toArray();

    expect($serialized)->not->toHaveKeys(['email', 'password'])
        ->and($user->email)->toBeNull();
});

it('auto-links campus affiliation on roster exact match and flags mismatch for manual review', function () {
    $institution = Institution::factory()->active()->create();
    $exactPhone = '+6281987654321';

    $roster = InstitutionRoster::factory()->for($institution)->create();
    InstitutionRosterRow::factory()->for($roster, 'roster')->create([
        'nim' => '2201001',
        'phone_hash' => PhoneIdentity::hash($exactPhone),
        'is_active' => true,
    ]);

    $exactUser = User::factory()->create();
    PhoneNumber::factory()->for($exactUser)->forNumber($exactPhone)->create();

    $verifiedRequest = app(SubmitAffiliationRequest::class)->handle(
        $exactUser,
        $institution,
        '2201001',
    );

    expect($verifiedRequest->match_result)->toBe(AffiliationMatchResult::Exact)
        ->and($verifiedRequest->status)->toBe(AffiliationRequestStatus::Verified)
        ->and($institution->memberships()->whereBelongsTo($exactUser)->first()->status)
        ->toBe(InstitutionMembershipStatus::Verified)
        ->and($institution->memberships()->whereBelongsTo($exactUser)->first()->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::RosterExactMatch);

    $mismatchUser = User::factory()->create();
    PhoneNumber::factory()->for($mismatchUser)->forNumber('+6281987654000')->create();

    $pendingRequest = app(SubmitAffiliationRequest::class)->handle(
        $mismatchUser,
        $institution,
        '9999999',
    );

    expect($pendingRequest->match_result)->toBe(AffiliationMatchResult::NoMatch)
        ->and($pendingRequest->status)->toBe(AffiliationRequestStatus::PendingReview)
        ->and($institution->memberships()->whereBelongsTo($mismatchUser)->first()->status)
        ->toBe(InstitutionMembershipStatus::Pending);
});

it('strictly denies cross-tenant review via policy', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $adminA = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($adminA)
        ->for($institutionA)
        ->create();

    $foreignStudent = User::factory()->create();
    $foreignMembership = InstitutionMembership::factory()
        ->student()
        ->pending()
        ->for($foreignStudent)
        ->for($institutionB)
        ->create();

    expect(Gate::forUser($adminA)->denies('approve', $foreignMembership))
        ->toBeTrue()
        ->and(Gate::forUser($adminA)->denies('reject', $foreignMembership))
        ->toBeTrue();
});

it('needs a verified phone before any roster matching transition', function () {
    $institution = Institution::factory()->active()->create();
    $roster = InstitutionRoster::factory()->for($institution)->create();
    InstitutionRosterRow::factory()->for($roster, 'roster')->create([
        'nim' => '2201002',
        'phone_hash' => PhoneIdentity::hash('+6281987654322'),
        'is_active' => true,
    ]);

    $user = User::factory()->create();

    expect(fn () => app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        '2201002',
    ))->toThrow(VerifiedPhoneRequired::class)
        ->and(InstitutionMembership::query()->count())->toBe(0);
});

it('keeps roster rows private and never exposes plain codes in serialization', function () {
    $institution = Institution::factory()->active()->create();
    $exactPhone = '+6281987654323';

    $roster = InstitutionRoster::factory()->for($institution)->create();
    $row = InstitutionRosterRow::factory()->for($roster, 'roster')->create([
        'nim' => '2201003',
        'phone_hash' => PhoneIdentity::hash($exactPhone),
        'is_active' => true,
    ]);

    $rowSerialized = $row->toArray();

    expect($rowSerialized)->not->toHaveKeys(['phone', 'phone_hash', 'phone_encrypted']);

    $rawRow = DB::table('institution_roster_rows')->where('id', $row->getKey())->first();

    expect($rawRow->phone_encrypted)->not->toBe($exactPhone)
        ->and($rawRow->phone_hash)->toBe(PhoneIdentity::hash($exactPhone))
        ->and($rawRow->nim)->toBe('2201003');
});

it('stores hashed OTP challenges and encrypted outbox payloads without plain codes', function () {
    $gateway = new FakeWhatsAppGateway;
    $this->app->instance(WhatsAppGateway::class, $gateway);

    $outbox = app(DispatchAuthOtp::class)->handle(
        OtpPurpose::Registration,
        '+6285555444333',
    );

    $challenge = OtpChallenge::query()->firstOrFail();

    $plainOtp = $gateway->sentMessages() === []
        ? null
        : latestWhatsappOtp($gateway);

    expect($challenge->token)->toBeString()
        ->and($challenge->token)->not->toBe($plainOtp)
        ->and($challenge->toArray())->not->toHaveKey('raw_code')
        ->and($outbox->recipient)->toBe('+6285555444333');

    $decryptedPayload = Crypt::decryptString($outbox->payload);
    $decoded = json_decode($decryptedPayload, true);

    expect($decoded)->toBeArray()
        ->and($decoded['message'] ?? '')->toContain('Kode verifikasi SATU')
        ->and($outbox->payload)->not->toContain($decoded['message'] ?? str_repeat('0', 6));
});

it('records outbox delivery failure gracefully without leaking secrets', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldFail = true;
    $this->app->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::query()->create([
        'purpose' => MessagePurpose::Otp,
        'recipient' => PhoneIdentity::hash('+6287777666555'),
        'payload' => 'Outbox message payload',
        'status' => MessageStatus::Pending,
    ]);

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();
    $delivery = MessageDelivery::query()->where('message_outbox_id', $outbox->id)->first();

    expect($delivery)->not->toBeNull()
        ->and($delivery->status)->toBe(MessageStatus::Failed)
        ->and($delivery->error_message)->toContain('500');

    $rawDelivery = DB::table('message_deliveries')->where('id', $delivery->getKey())->first();

    expect($rawDelivery->error_message)->not->toContain('+6287777666555');
});
