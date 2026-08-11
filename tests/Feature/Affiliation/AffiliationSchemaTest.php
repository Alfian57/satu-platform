<?php

use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\PhoneNumberStatus;
use App\Models\AffiliationRequest;
use App\Models\PhoneNumber;
use Illuminate\Support\Facades\Schema;

test('affiliation schema exposes encrypted identity and review lifecycle columns', function () {
    expect(Schema::hasColumns('phone_numbers', [
        'user_id',
        'number',
        'number_hash',
        'masked',
        'status',
        'verified_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('affiliation_requests', [
            'institution_id',
            'user_id',
            'institution_membership_id',
            'roster_id',
            'roster_row_id',
            'nim_hash',
            'nim',
            'match_result',
            'status',
            'version',
            'review_locked_by_id',
            'review_locked_at',
            'review_lock_expires_at',
            'submitted_at',
            'resolved_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('affiliation_reviews', [
            'affiliation_request_id',
            'institution_id',
            'reviewer_id',
            'decision',
            'reason_code',
            'note',
            'policy_version',
            'previous_status',
            'new_status',
            'request_version',
            'created_at',
        ]))->toBeTrue()
        ->and(Schema::hasColumn('affiliation_reviews', 'updated_at'))->toBeFalse();
});

test('affiliation and phone models cast bounded states', function () {
    $phone = PhoneNumber::factory()->create();
    $request = AffiliationRequest::factory()->create();

    expect($phone->status)->toBe(PhoneNumberStatus::Verified)
        ->and($phone->verified_at)->not->toBeNull()
        ->and($request->match_result)->toBe(AffiliationMatchResult::NoMatch)
        ->and($request->status)->toBe(AffiliationRequestStatus::PendingReview)
        ->and($request->submitted_at)->not->toBeNull();
});
