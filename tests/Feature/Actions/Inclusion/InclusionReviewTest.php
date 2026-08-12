<?php

declare(strict_types=1);

use App\Actions\Inclusion\InclusionReviewQueue;
use App\Actions\Inclusion\InclusionSignalDetail;
use App\Actions\Inclusion\RecordInclusionReview;
use App\Enums\InclusionHumanConclusion;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\AuditLog;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Support\InclusionSignalSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Pennant\Feature;

uses(RefreshDatabase::class);

beforeEach(function () {
    Feature::activate('inclusion-signal-engine');
});

it('throws exception when inclusion signal engine is not active', function () {
    Feature::deactivate('inclusion-signal-engine');

    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    $queue = app(InclusionReviewQueue::class);

    expect(fn () => $queue->query($admin, $institution))
        ->toThrow(Exception::class, 'Inclusion signal engine is not active.');
});

it('denies access to non-admin, non-verified, or external institution users', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $student = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institutionA->id,
        'user_id' => $student->id,
        'role' => InstitutionMembershipRole::Student,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $suspendedAdmin = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institutionA->id,
        'user_id' => $suspendedAdmin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Suspended,
    ]);

    $externalAdmin = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institutionB->id,
        'user_id' => $externalAdmin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $queue = app(InclusionReviewQueue::class);

    expect(fn () => $queue->query($student, $institutionA))
        ->toThrow(AuthorizationException::class);

    expect(fn () => $queue->query($suspendedAdmin, $institutionA))
        ->toThrow(AuthorizationException::class);

    expect(fn () => $queue->query($externalAdmin, $institutionA))
        ->toThrow(AuthorizationException::class);
});

it('allows verified campus admin to query inclusion review queue', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $admin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $version = InclusionSignalVersion::factory()->create();

    $signalRestricted = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'version_id' => $version->id,
        'period' => '2026-S1',
        'restricted_feature_state' => true,
    ]);

    InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'version_id' => $version->id,
        'period' => '2026-S1',
        'restricted_feature_state' => false,
    ]);

    $queueAction = app(InclusionReviewQueue::class);
    $paginated = $queueAction->paginate($admin, $institution, '2026-S1', true);

    expect($paginated->total())->toBe(1)
        ->and($paginated->items()[0]->id)->toBe($signalRestricted->id);
});

it('fetches signal details and logs audit entry', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $admin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'period' => '2026-S1',
        'restricted_feature_state' => true,
    ]);

    $detailAction = app(InclusionSignalDetail::class);
    $fetched = $detailAction->execute($admin, $signal);

    expect($fetched->id)->toBe($signal->id);

    $auditLog = AuditLog::where('operation', 'inclusion_signal.accessed')->first();
    expect($auditLog)->not->toBeNull()
        ->and($auditLog->actor_id)->toBe($admin->id)
        ->and($auditLog->institution_id)->toBe($institution->id);
});

it('records an append-only inclusion review decision with required reason and audit log', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $admin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'restricted_feature_state' => true,
    ]);

    $recordAction = app(RecordInclusionReview::class);

    // Empty reason should fail
    expect(fn () => $recordAction->execute($admin, $signal, InclusionHumanConclusion::Acknowledged, null, '   '))
        ->toThrow(InvalidArgumentException::class, 'A clear reason is required for inclusion human review.');

    // Valid review
    $review = $recordAction->execute(
        reviewer: $admin,
        signal: $signal,
        conclusion: InclusionHumanConclusion::OutreachScheduled,
        supportAction: 'Peer Mentoring Assigned',
        reason: 'Subject responded positively to voluntary academic mentoring program invitation.',
    );

    expect($review->human_conclusion)->toBe('outreach_scheduled')
        ->and($review->support_action)->toBe('Peer Mentoring Assigned')
        ->and($review->reason)->toBe('Subject responded positively to voluntary academic mentoring program invitation.')
        ->and($review->reviewer_id)->toBe($admin->id);

    // Verify Audit log creation
    $audit = AuditLog::where('operation', 'inclusion_review.created')->first();
    expect($audit)->not->toBeNull()
        ->and($audit->actor_id)->toBe($admin->id)
        ->and($audit->reason)->toBe('Subject responded positively to voluntary academic mentoring program invitation.');

    // Verify Append-Only trigger behavior on inclusion_reviews table
    expect(function () use ($review) {
        $review->update(['human_conclusion' => 'dismissed']);
    })->toThrow(Exception::class);
});

it('inclusion review queue query budget stays bounded as signal volume grows', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $admin->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $version = InclusionSignalVersion::factory()->create();

    collect(range(1, 3))->each(function (int $number) use ($institution, $version): void {
        $signal = InclusionSignal::factory()->create([
            'institution_id' => $institution->id,
            'version_id' => $version->id,
            'period' => '2026-S1',
            'restricted_feature_state' => true,
        ]);

        InclusionReview::factory()->create([
            'inclusion_signal_id' => $signal->id,
            'human_conclusion' => 'acknowledged',
            'reason' => 'Baseline review '.$number,
        ]);
    });

    $baseline = measureDatabaseQueries(function () use ($admin, $institution): void {
        app(InclusionReviewQueue::class)->paginate($admin, $institution, '2026-S1', true);
    });

    collect(range(4, 27))->each(function (int $number) use ($institution, $version): void {
        $signal = InclusionSignal::factory()->create([
            'institution_id' => $institution->id,
            'version_id' => $version->id,
            'period' => '2026-S1',
            'restricted_feature_state' => true,
        ]);

        InclusionReview::factory()->create([
            'inclusion_signal_id' => $signal->id,
            'human_conclusion' => 'acknowledged',
            'reason' => 'Volume review '.$number,
        ]);
    });

    $expanded = measureDatabaseQueries(function () use ($admin, $institution): void {
        app(InclusionReviewQueue::class)->paginate($admin, $institution, '2026-S1', true);
    });

    expect($expanded['total'])->toBe($baseline['total']);
});

it('serializes inclusion signals safely without leaking private or unallowlisted data', function () {
    $institution = Institution::factory()->active()->create();
    $subject = User::factory()->create([
        'name' => 'Budi Pertiwi',
        'username' => 'budipertiwi',
    ]);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $subject->id,
        'period' => '2026-S1',
        'evidence_summary' => ['event_count' => 12, 'factor' => 'Sufficient data'],
    ]);

    InclusionReview::factory()->create([
        'inclusion_signal_id' => $signal->id,
        'human_conclusion' => 'acknowledged',
        'reason' => 'Reviewed by admin.',
    ]);

    $serializer = new InclusionSignalSerializer;
    $serialized = $serializer->toRestrictedArray($signal);

    expect($serialized)->toHaveKeys([
        'id',
        'institution_id',
        'subject_id',
        'subject_name',
        'version_id',
        'period',
        'restricted_feature_state',
        'data_sufficiency_met',
        'evidence_summary',
        'created_at',
        'reviews',
    ]);

    // Negative assertions: ensure sensitive/private fields are NOT present
    expect($serialized)->not->toHaveKey('email')
        ->and($serialized)->not->toHaveKey('phone')
        ->and($serialized)->not->toHaveKey('nim')
        ->and($serialized)->not->toHaveKey('otp')
        ->and($serialized)->not->toHaveKey('password')
        ->and($serialized)->not->toHaveKey('message')
        ->and($serialized)->not->toHaveKey('chat_message')
        ->and($serialized)->not->toHaveKey('mental_health_diagnosis');
});
