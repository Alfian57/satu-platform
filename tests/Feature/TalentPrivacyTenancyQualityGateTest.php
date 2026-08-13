<?php

declare(strict_types=1);

use App\Actions\Consent\ConsentRecorder;
use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Talent\RespondContactRequest;
use App\Actions\Talent\SaveCandidate;
use App\Actions\Talent\SearchTalentCandidates;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\ConsentRecord;
use App\Models\Institution;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

/**
 * Setup an entitled recruiter organization with a visible candidate projection.
 *
 * @return array{org: RecruiterOrganization, recruiter: User, candidate: TalentCandidateProjection, institution: Institution}
 */
function talentGateRecruiterContext(array $overrides = []): array
{
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create([
        'status' => RecruiterOrganizationStatus::Verified,
        ...$overrides,
    ]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $institution = Institution::factory()->active()->create();

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    return compact('org', 'recruiter', 'candidate', 'institution');
}

it('denies talent search and candidate save across a different recruiter organization', function () {
    $contextA = talentGateRecruiterContext();
    $contextB = talentGateRecruiterContext();

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: User::factory()->create(['is_platform_admin' => true]),
        organization: $contextA['org'],
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: User::factory()->create(['is_platform_admin' => true]),
        organization: $contextB['org'],
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $search = app(SearchTalentCandidates::class);
    $save = app(SaveCandidate::class);

    // Search reads the platform-wide allowlisted pool regardless of org; entitlement gates access.
    expect(fn () => $search->execute($contextA['recruiter'], $contextA['org']))
        ->not->toThrow(AuthorizationException::class);

    // Recruiter A must not be able to save org B's candidate into org B (cross-org tenancy boundary).
    expect(fn () => $save->execute($contextA['recruiter'], $contextB['org'], $contextB['candidate']->id))
        ->toThrow(AuthorizationException::class, 'not an active member');
});

it('denies candidate save when recruiter is not an active member of the organization', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    expect(fn () => app(SaveCandidate::class)->execute($recruiter, $org, $candidate->id))
        ->toThrow(AuthorizationException::class, 'not an active member');
});

it('denies candidate save when the recruiter organization holds no active entitlement', function () {
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    expect(fn () => app(SaveCandidate::class)->execute($recruiter, $org, $candidate->id))
        ->toThrow(AuthorizationException::class, 'does not hold an active candidate search entitlement');
});

it('denies candidate save for a withdrawn candidate projection', function () {
    $context = talentGateRecruiterContext();
    app(GrantRecruiterEntitlement::class)->execute(
        issuer: User::factory()->create(['is_platform_admin' => true]),
        organization: $context['org'],
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $context['candidate']->update(['is_visible' => false]);

    expect(fn () => app(SaveCandidate::class)->execute(
        $context['recruiter'],
        $context['org'],
        $context['candidate']->id,
    ))->toThrow(InvalidArgumentException::class, 'not found or has been withdrawn');
});

it('strictly forbids sensitive fields from recruiter candidate serialization', function () {
    $context = talentGateRecruiterContext();
    $projection = $context['candidate'];
    $projection->update([
        'headline' => 'Secure Engineer Candidate',
        'skills' => ['Rust', 'Laravel'],
        'availability_status' => 'available',
    ]);

    $serializer = new RecruiterSafeCandidateSerializer;
    $serialized = $serializer->toArray($projection);

    $forbidden = [
        'user_id',
        'username',
        'nim',
        'phone',
        'email',
        'password',
        'institution_id',
        'inclusion',
        'inclusion_signals',
        'inclusion_reviews',
        'private_evidence',
        'message',
        'messages',
        'raw_audit',
        'raw_audit_logs',
        'hidden_matching_input',
        'hidden_matching_inputs',
        'consent',
        'consent_records',
        'audit',
        'audit_records',
    ];

    foreach ($forbidden as $key) {
        expect($serialized)->not->toHaveKey($key);
    }

    expect($serialized)->toHaveKeys([
        'id',
        'headline',
        'bio',
        'skills',
        'badges',
        'contributions',
        'availability_status',
        'verified_at',
        'institution_name',
    ])->and($serialized)->not->toHaveKey('phone');
});

it('does not expose phone until the student grants contact consent', function () {
    $context = talentGateRecruiterContext();
    $projection = $context['candidate'];

    $serializer = new RecruiterSafeCandidateSerializer;

    $withoutConsent = $serializer->toArray($projection);
    expect($withoutConsent)->not->toHaveKey('phone');

    $revealed = $serializer->toArray($projection, '+6281234567890');
    expect($revealed)->toHaveKey('phone')
        ->and($revealed['phone'])->toBe('+6281234567890');
});

it('records consent grant on accept and no consent on decline', function () {
    $context = talentGateRecruiterContext();
    $student = User::factory()->create();

    $request = RecruiterContactRequest::factory()->create([
        'recruiter_organization_id' => $context['org']->id,
        'recruiter_user_id' => $context['recruiter']->id,
        'talent_candidate_projection_id' => $context['candidate']->id,
        'candidate_user_id' => $student->id,
        'status' => ContactRequestStatus::Pending,
    ]);

    app(RespondContactRequest::class)->execute(
        $student,
        $request->getKey(),
        true,
    );

    expect($request->refresh()->status)->toBe(ContactRequestStatus::Accepted);

    $consent = app(ConsentRecorder::class)->current(
        $student,
        RespondContactRequest::CONSENT_PURPOSE,
    );

    expect($consent)->not->toBeNull()
        ->and($consent->isGrant())->toBeTrue();

    // A second request declined must not record consent.
    $second = RecruiterContactRequest::factory()->create([
        'recruiter_organization_id' => $context['org']->id,
        'recruiter_user_id' => $context['recruiter']->id,
        'talent_candidate_projection_id' => $context['candidate']->id,
        'candidate_user_id' => $student->id,
        'status' => ContactRequestStatus::Pending,
    ]);

    app(RespondContactRequest::class)->execute(
        $student,
        $second->getKey(),
        false,
    );

    expect($second->refresh()->status)->toBe(ContactRequestStatus::Declined);

    $latestDeclineConsent = ConsentRecord::query()
        ->forUser($student)
        ->forPurpose(RespondContactRequest::CONSENT_PURPOSE)
        ->latestEvent()
        ->first();

    expect($latestDeclineConsent->isGrant())->toBeTrue('Decline must not revoke or duplicate the earlier grant.');
});

it('withdrawal stops new candidate projection from search results', function () {
    $context = talentGateRecruiterContext();
    app(GrantRecruiterEntitlement::class)->execute(
        issuer: User::factory()->create(['is_platform_admin' => true]),
        organization: $context['org'],
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $search = app(SearchTalentCandidates::class);

    expect($search->execute($context['recruiter'], $context['org'])->total())->toBe(1);

    $context['candidate']->update(['is_visible' => false]);

    expect($search->execute($context['recruiter'], $context['org'])->total())->toBe(0);
});

it('keeps audit history after candidate withdrawal', function () {
    $context = talentGateRecruiterContext();
    app(GrantRecruiterEntitlement::class)->execute(
        issuer: User::factory()->create(['is_platform_admin' => true]),
        organization: $context['org'],
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    app(SaveCandidate::class)->execute(
        $context['recruiter'],
        $context['org'],
        $context['candidate']->id,
    );

    $savedCount = RecruiterSavedCandidate::query()->count();
    expect($savedCount)->toBe(1);

    $context['candidate']->update(['is_visible' => false]);

    expect(RecruiterSavedCandidate::query()->count())->toBe(1, 'Withdrawal must not delete saved-candidate audit rows.');
});
