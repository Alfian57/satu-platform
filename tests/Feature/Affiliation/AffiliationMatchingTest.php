<?php

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionRosterStatus;
use App\Exceptions\VerifiedPhoneRequired;
use App\Models\AffiliationRequest;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Support\Facades\DB;

function affiliationVerifiedPhone(User $user, string $number): PhoneNumber
{
    return PhoneNumber::factory()
        ->for($user)
        ->forNumber($number)
        ->create();
}

function affiliationRoster(Institution $institution): InstitutionRoster
{
    return InstitutionRoster::factory()->for($institution)->create();
}

function affiliationRosterRow(
    InstitutionRoster $roster,
    string $nim,
    string $phone,
    bool $active = true,
): InstitutionRosterRow {
    return InstitutionRosterRow::factory()
        ->for($roster, 'roster')
        ->create([
            'nim' => strtolower(trim($nim)),
            'phone_hash' => PhoneIdentity::hash($phone),
            'phone_encrypted' => PhoneIdentity::normalize($phone),
            'is_active' => $active,
        ]);
}

test('exact NIM and verified phone atomically verifies affiliation', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567801';
    affiliationVerifiedPhone($user, $phone);
    $roster = affiliationRoster($institution);
    $row = affiliationRosterRow($roster, 'SATU-001', $phone);

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        '  SATU-001  ',
    );
    $membership = $request->membership;

    expect($request->match_result)->toBe(AffiliationMatchResult::Exact)
        ->and($request->status)->toBe(AffiliationRequestStatus::Verified)
        ->and($request->roster_id)->toBe($roster->getKey())
        ->and($request->roster_row_id)->toBe($row->getKey())
        ->and($membership->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($membership->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::RosterExactMatch)
        ->and($membership->institutional_identifier)->toBe('satu-001')
        ->and(AuditLog::query()->where('operation', 'affiliation.auto_verified')->count())
        ->toBe(1);
});

test('no match enters manual review without exposing roster data', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    affiliationVerifiedPhone($user, '+6281234567802');
    affiliationRoster($institution);

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'MISSING-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::NoMatch)
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview)
        ->and($request->membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($request->toArray())->not->toHaveKeys(['nim', 'nim_hash']);
});

test('duplicate NIM rows are treated as ambiguous', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567803';
    affiliationVerifiedPhone($user, $phone);
    $roster = affiliationRoster($institution);
    affiliationRosterRow($roster, 'DUP-001', $phone);
    affiliationRosterRow($roster, 'DUP-001', '+6281234567999');

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'dup-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::Ambiguous)
        ->and($request->roster_row_id)->toBeNull()
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview);
});

test('phone mismatch is treated as ambiguous', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    affiliationVerifiedPhone($user, '+6281234567804');
    $roster = affiliationRoster($institution);
    $row = affiliationRosterRow($roster, 'PHONE-001', '+6281234567998');

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'phone-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::Ambiguous)
        ->and($request->roster_row_id)->toBe($row->getKey())
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview);
});

test('inactive roster row enters manual review', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567805';
    affiliationVerifiedPhone($user, $phone);
    $roster = affiliationRoster($institution);
    affiliationRosterRow($roster, 'INACTIVE-001', $phone, active: false);

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'inactive-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::Inactive)
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview);
});

test('missing active roster remains recoverable through manual review', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    affiliationVerifiedPhone($user, '+6281234567806');

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'NO-ROSTER-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::RosterUnavailable)
        ->and($request->roster_id)->toBeNull()
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview);
});

test('identical pending request is idempotent', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    affiliationVerifiedPhone($user, '+6281234567807');
    affiliationRoster($institution);

    $first = app(SubmitAffiliationRequest::class)->handle($user, $institution, 'IDEMP-001');
    $second = app(SubmitAffiliationRequest::class)->handle($user, $institution, 'IDEMP-001');

    expect($second->is($first))->toBeTrue()
        ->and($second->version)->toBe(1)
        ->and(AffiliationRequest::query()->count())->toBe(1)
        ->and(InstitutionMembership::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'affiliation.submitted')->count())
        ->toBe(1);
});

test('verified affiliation cannot be replaced by a different self submitted identifier', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567814';
    affiliationVerifiedPhone($user, $phone);
    $roster = affiliationRoster($institution);
    affiliationRosterRow($roster, 'LOCKED-001', $phone);

    $first = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'LOCKED-001',
    );
    $second = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'DIFFERENT-001',
    );

    expect($second->is($first))->toBeTrue()
        ->and($second->version)->toBe(1)
        ->and($second->nim)->toBe('locked-001')
        ->and($second->status)->toBe(AffiliationRequestStatus::Verified)
        ->and($second->membership->institutional_identifier)->toBe('locked-001')
        ->and(AuditLog::query()->where('operation', 'affiliation.auto_verified')->count())
        ->toBe(1);
});

test('matching never crosses institution boundaries', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $otherInstitution = Institution::factory()->active()->create();
    $phone = '+6281234567808';
    affiliationVerifiedPhone($user, $phone);
    affiliationRoster($institution);
    $otherRoster = affiliationRoster($otherInstitution);
    affiliationRosterRow($otherRoster, 'TENANT-001', $phone);

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'tenant-001',
    );

    expect($request->match_result)->toBe(AffiliationMatchResult::NoMatch)
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview)
        ->and($request->institution_id)->toBe($institution->getKey());
});

test('resubmission re-evaluates a stale request against the active roster', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567813';
    affiliationVerifiedPhone($user, $phone);
    $oldRoster = affiliationRoster($institution);

    $first = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'REFRESH-001',
    );

    $oldRoster->forceFill([
        'status' => InstitutionRosterStatus::Superseded,
        'superseded_at' => now(),
    ])->save();
    $activeRoster = affiliationRoster($institution);
    affiliationRosterRow($activeRoster, 'REFRESH-001', $phone);

    $second = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'REFRESH-001',
    );

    expect($second->is($first))->toBeTrue()
        ->and($second->version)->toBe(2)
        ->and($second->roster_id)->toBe($activeRoster->getKey())
        ->and($second->match_result)->toBe(AffiliationMatchResult::Exact)
        ->and($second->status)->toBe(AffiliationRequestStatus::Verified)
        ->and($second->membership->status)->toBe(InstitutionMembershipStatus::Verified);
});

test('verified phone is required before any membership transition', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    expect(fn () => app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'PHONE-REQUIRED',
    ))->toThrow(VerifiedPhoneRequired::class)
        ->and(InstitutionMembership::query()->count())->toBe(0)
        ->and(AffiliationRequest::query()->count())->toBe(0);
});

test('phone and roster identifiers are encrypted or keyed at rest', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $phone = '+6281234567809';
    $phoneNumber = affiliationVerifiedPhone($user, $phone);
    $roster = affiliationRoster($institution);
    $row = affiliationRosterRow($roster, 'PRIVATE-001', $phone);

    $request = app(SubmitAffiliationRequest::class)->handle(
        $user,
        $institution,
        'private-001',
    );

    $rawPhone = DB::table('phone_numbers')->where('id', $phoneNumber->getKey())->first();
    $rawRow = DB::table('institution_roster_rows')->where('id', $row->getKey())->first();
    $rawRequest = DB::table('affiliation_requests')->where('id', $request->getKey())->first();

    expect($rawPhone->number)->not->toBe($phone)
        ->and($rawPhone->number_hash)->toBe(PhoneIdentity::hash($phone))
        ->and($rawRow->phone_encrypted)->not->toBe($phone)
        ->and($rawRow->phone_hash)->toBe(PhoneIdentity::hash($phone))
        ->and($rawRequest->nim)->not->toBe('private-001')
        ->and($request->nim)->toBe('private-001');
});
