<?php

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Models\AuditLog;
use App\Models\ConsentRecord;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('audit schema stores nullable provenance with query indexes', function () {
    expect(Schema::hasColumns('audit_logs', [
        'institution_id',
        'actor_id',
        'operation',
        'auditable_type',
        'auditable_id',
        'before_summary',
        'after_summary',
        'reason',
        'request_context',
        'created_at',
    ]))->toBeTrue();

    $indexes = collect(Schema::getIndexes('audit_logs'))
        ->map(fn (array $index): array => $index['columns'])
        ->values();

    expect($indexes->contains(['auditable_type', 'auditable_id']))->toBeTrue()
        ->and($indexes->contains(['institution_id', 'created_at']))->toBeTrue()
        ->and($indexes->contains(['actor_id', 'created_at']))->toBeTrue()
        ->and($indexes->contains(['operation', 'created_at']))->toBeTrue();
});

test('audit recorder stores persisted tenant actor and auditable provenance', function () {
    $institution = Institution::factory()->active()->create();
    $actor = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->create();

    $audit = app(AuditRecorder::class)->record(
        operation: 'membership.requested',
        auditable: $membership,
        actor: $actor,
        institution: $institution,
        before: ['status' => 'unverified'],
        after: ['status' => 'pending'],
        reason: '  Permintaan afiliasi baru.  ',
    );

    expect($audit->institution->is($institution))->toBeTrue()
        ->and($audit->actor->is($actor))->toBeTrue()
        ->and($audit->auditable->is($membership))->toBeTrue()
        ->and($audit->before_summary)->toBe(['status' => 'unverified'])
        ->and($audit->after_summary)->toBe(['status' => 'pending'])
        ->and($audit->reason)->toBe('Permintaan afiliasi baru.')
        ->and($audit->created_at)->not->toBeNull();
});

test('audit recorder recursively drops sensitive keys before persistence and serialization', function () {
    $audit = app(AuditRecorder::class)->record(
        operation: 'security.summary_recorded',
        before: [
            'Password' => 'before-secret',
            'safe' => 'before-safe',
            'nested' => [
                'API-Token' => 'nested-secret',
                'message body' => 'private-message',
                'safe_status' => 'pending',
            ],
        ],
        after: [
            'Two Factor Recovery Codes' => ['recovery-secret'],
            'Consent.Payload' => ['raw' => 'private-consent'],
            'safe' => 'after-safe',
        ],
    );

    $rawBefore = DB::table('audit_logs')
        ->where('id', $audit->getKey())
        ->value('before_summary');
    $rawAfter = DB::table('audit_logs')
        ->where('id', $audit->getKey())
        ->value('after_summary');
    $serialized = json_encode($audit->fresh()?->toArray(), JSON_THROW_ON_ERROR);

    expect($audit->before_summary)->toBe([
        'safe' => 'before-safe',
        'nested' => ['safe_status' => 'pending'],
    ])->and($audit->after_summary)->toBe(['safe' => 'after-safe'])
        ->and($rawBefore)->not->toContain('before-secret')
        ->and($rawBefore)->not->toContain('nested-secret')
        ->and($rawBefore)->not->toContain('private-message')
        ->and($rawAfter)->not->toContain('recovery-secret')
        ->and($rawAfter)->not->toContain('private-consent')
        ->and($serialized)->not->toContain('secret')
        ->and($serialized)->not->toContain('private-message')
        ->and($serialized)->not->toContain('private-consent');
});

test('audit recorder drops sensitive aliases and non JSON safe values', function () {
    $resource = fopen('php://memory', 'r');
    $user = User::factory()->create();

    try {
        $audit = app(AuditRecorder::class)->record(
            operation: 'security.aliases_recorded',
            before: [
                'apiKey' => 'api-secret',
                'private-key' => 'private-key-secret',
                'credentials' => ['username' => 'hidden'],
                'raw consent' => 'raw-consent',
                'consent' => ['text' => 'legal-copy'],
                'messageText' => 'private-message',
                'chat-message' => 'private-chat',
                'comment body' => 'private-comment',
                'evidence.path' => '/private/evidence',
                'raw_payload' => ['hidden' => true],
                'inclusion_signal_score' => 0.1,
                'sensitive_factors' => ['hidden'],
                'model_value' => $user,
                'serializable_value' => new class implements JsonSerializable
                {
                    /**
                     * @return array<string, string>
                     */
                    public function jsonSerialize(): array
                    {
                        return ['password' => 'object-secret'];
                    }
                },
                'resource_value' => $resource,
                'non_finite' => NAN,
                'membership_id' => 123,
                'consent_policy_version' => 'v1',
                'safe_list' => ['one', 2, true, null],
            ],
        );
    } finally {
        if (is_resource($resource)) {
            fclose($resource);
        }
    }

    expect($audit->before_summary)->toBe([
        'membership_id' => 123,
        'consent_policy_version' => 'v1',
        'safe_list' => ['one', 2, true, null],
    ]);
});

test('audit request context uses a fixed allowlist and excludes request payload', function () {
    $requestId = '019c8813-fb86-74df-91a6-908158409e25';
    $request = Request::create(
        '/institution-memberships',
        'POST',
        [
            'password' => 'request-password',
            'institution_id' => 999,
            'message_body' => 'private-message',
        ],
        server: [
            'HTTP_X_REQUEST_ID' => $requestId,
            'HTTP_AUTHORIZATION' => 'Bearer request-token',
            'HTTP_USER_AGENT' => 'private-user-agent',
        ],
    );

    $audit = app(AuditRecorder::class)->record(
        operation: 'request.context_recorded',
        request: $request,
    );

    expect($audit->request_context)->toBe([
        'method' => 'POST',
        'request_id' => $requestId,
    ]);

    $rawContext = DB::table('audit_logs')
        ->where('id', $audit->getKey())
        ->value('request_context');

    expect($rawContext)->not->toContain('request-password')
        ->and($rawContext)->not->toContain('request-token')
        ->and($rawContext)->not->toContain('private-user-agent')
        ->and($rawContext)->not->toContain('private-message')
        ->and($rawContext)->not->toContain('institution_id');
});

test('audit request context omits arbitrary untrusted request identifiers', function () {
    $request = Request::create(
        '/audit',
        'POST',
        server: ['HTTP_X_REQUEST_ID' => str_repeat('a', 64)],
    );

    $audit = app(AuditRecorder::class)->record(
        operation: 'request.context_recorded',
        request: $request,
    );

    expect($audit->request_context)->toBe(['method' => 'POST']);
});

test('audit recorder rejects missing mismatched and dirty tenant ownership', function () {
    $firstInstitution = Institution::factory()->active()->create();
    $secondInstitution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->for($firstInstitution)
        ->create();

    expect(fn () => app(AuditRecorder::class)->record(
        operation: 'membership.reviewed',
        auditable: $membership,
    ))->toThrow(InvalidArgumentException::class)
        ->and(fn () => app(AuditRecorder::class)->record(
            operation: 'membership.reviewed',
            auditable: $membership,
            institution: $secondInstitution,
        ))->toThrow(InvalidArgumentException::class);

    $membership->forceFill(['institution_id' => $secondInstitution->getKey()]);

    expect(fn () => app(AuditRecorder::class)->record(
        operation: 'membership.reviewed',
        auditable: $membership,
        institution: $secondInstitution,
    ))->toThrow(InvalidArgumentException::class)
        ->and(AuditLog::query()->count())->toBe(0);
});

test('auditing an institution requires the same explicit institution boundary', function () {
    $institution = Institution::factory()->active()->create();
    $otherInstitution = Institution::factory()->active()->create();

    expect(fn () => app(AuditRecorder::class)->record(
        operation: 'institution.reviewed',
        auditable: $institution,
    ))->toThrow(InvalidArgumentException::class)
        ->and(fn () => app(AuditRecorder::class)->record(
            operation: 'institution.reviewed',
            auditable: $institution,
            institution: $otherInstitution,
        ))->toThrow(InvalidArgumentException::class);

    $audit = app(AuditRecorder::class)->record(
        operation: 'institution.reviewed',
        auditable: $institution,
        institution: $institution,
    );

    expect($audit->institution->is($institution))->toBeTrue()
        ->and($audit->auditable->is($institution))->toBeTrue();
});

test('platform and system audit boundaries may omit institution and actor', function () {
    $audit = app(AuditRecorder::class)->record(
        operation: 'platform.maintenance_recorded',
        after: ['result' => 'completed'],
    );

    expect($audit->institution_id)->toBeNull()
        ->and($audit->actor_id)->toBeNull()
        ->and($audit->auditable_type)->toBeNull()
        ->and($audit->auditable_id)->toBeNull();
});

test('audit history is append only through model and query mutation paths', function () {
    $audit = AuditLog::factory()->create();

    $audit->forceFill(['operation' => 'tampered']);

    expect(fn () => $audit->saveQuietly())->toThrow(LogicException::class)
        ->and(fn () => $audit->deleteQuietly())->toThrow(LogicException::class)
        ->and(fn () => AuditLog::query()
            ->whereKey($audit->getKey())
            ->update(['operation' => 'tampered']))
        ->toThrow(QueryException::class)
        ->and(fn () => AuditLog::query()
            ->whereKey($audit->getKey())
            ->delete())
        ->toThrow(QueryException::class)
        ->and($audit->fresh()?->operation)->toBe('factory.audit_recorded');
});

test('audit database rejects partial polymorphic references', function (
    ?string $auditableType,
    ?int $auditableId,
) {
    expect(fn () => DB::table('audit_logs')->insert([
        'operation' => 'audit.invalid_reference',
        'auditable_type' => $auditableType,
        'auditable_id' => $auditableId,
        'created_at' => now(),
    ]))->toThrow(QueryException::class);
})->with([
    'type without id' => [Institution::class, null],
    'id without type' => [null, 1],
]);

test('audit queries scope explicitly to one institution', function () {
    $firstInstitution = Institution::factory()->active()->create();
    $secondInstitution = Institution::factory()->active()->create();
    $firstAudit = AuditLog::factory()->for($firstInstitution)->create();
    AuditLog::factory()->for($secondInstitution)->create();
    AuditLog::factory()->platform()->create();

    expect(AuditLog::query()->forInstitution($firstInstitution)->sole()->is($firstAudit))
        ->toBeTrue()
        ->and(AuditLog::query()->count())->toBe(3);
});

test('audit provenance foreign keys prevent silent actor or institution deletion', function () {
    $audit = AuditLog::factory()->create();

    expect(fn () => $audit->actor->delete())->toThrow(QueryException::class)
        ->and(fn () => $audit->institution->delete())->toThrow(QueryException::class);
});

test('consent schema exposes event shape and current-query index', function () {
    expect(Schema::hasColumns('consent_records', [
        'user_id',
        'purpose',
        'policy_version',
        'source',
        'granted_at',
        'withdrawn_at',
        'occurred_at',
        'created_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumn('consent_records', 'payload'))->toBeFalse()
        ->and(Schema::hasColumn('consent_records', 'institution_id'))->toBeFalse();

    $indexes = collect(Schema::getIndexes('consent_records'))
        ->map(fn (array $index): array => $index['columns'])
        ->values();

    expect($indexes->contains(['user_id', 'purpose', 'occurred_at', 'id']))->toBeTrue();
});

test('consent recorder appends grant and withdrawal events with a current projection', function () {
    $user = User::factory()->create();
    $recorder = app(ConsentRecorder::class);
    $grantedAt = CarbonImmutable::parse('2026-07-24 08:00:00');
    $withdrawnAt = CarbonImmutable::parse('2026-07-24 09:00:00');

    $this->travelTo($grantedAt);
    $grant = $recorder->grant(
        $user,
        'portfolio.visibility',
        'v1',
        'onboarding',
    );

    $this->travelTo($withdrawnAt);
    $withdrawal = $recorder->withdraw(
        $user,
        'portfolio.visibility',
        'v1',
        'privacy_settings',
    );

    expect($grant->user->is($user))->toBeTrue()
        ->and($grant->granted_at?->equalTo($grantedAt))->toBeTrue()
        ->and($grant->withdrawn_at)->toBeNull()
        ->and($grant->isGrant())->toBeTrue()
        ->and($grant->occurredAt()->equalTo($grantedAt))->toBeTrue()
        ->and($withdrawal->granted_at)->toBeNull()
        ->and($withdrawal->withdrawn_at?->equalTo($withdrawnAt))->toBeTrue()
        ->and($withdrawal->isGrant())->toBeFalse()
        ->and($recorder->current($user, 'portfolio.visibility')?->is($withdrawal))->toBeTrue()
        ->and($user->consentRecords()->count())->toBe(2);
});

test('consent command chronology uses server time and remains deterministic', function () {
    $user = User::factory()->create();
    $recorder = app(ConsentRecorder::class);

    $this->travelTo(CarbonImmutable::parse('2026-07-24 08:00:00'));
    $firstGrant = $recorder->grant($user, 'portfolio.visibility', 'v1', 'onboarding');

    $this->travelTo(CarbonImmutable::parse('2026-07-24 09:00:00'));
    $withdrawal = $recorder->withdraw(
        $user,
        'portfolio.visibility',
        'v1',
        'privacy_settings',
    );

    $this->travelTo(CarbonImmutable::parse('2026-07-24 10:00:00'));
    $secondGrant = $recorder->grant($user, 'portfolio.visibility', 'v2', 'onboarding');

    expect($firstGrant->occurredAt()->toDateTimeString())->toBe('2026-07-24 08:00:00')
        ->and($withdrawal->occurredAt()->toDateTimeString())->toBe('2026-07-24 09:00:00')
        ->and($secondGrant->occurredAt()->toDateTimeString())->toBe('2026-07-24 10:00:00')
        ->and($recorder->current($user, 'portfolio.visibility')?->is($secondGrant))->toBeTrue()
        ->and($user->consentRecords()->count())->toBe(3);
});

test('identical consecutive consent commands are idempotent', function () {
    $user = User::factory()->create();
    $recorder = app(ConsentRecorder::class);

    $firstGrant = $recorder->grant($user, 'portfolio.visibility', 'v1', 'onboarding');
    $secondGrant = $recorder->grant($user, 'portfolio.visibility', 'v1', 'onboarding');
    $firstWithdrawal = $recorder->withdraw(
        $user,
        'portfolio.visibility',
        'v1',
        'privacy_settings',
    );
    $secondWithdrawal = $recorder->withdraw(
        $user,
        'portfolio.visibility',
        'v1',
        'privacy_settings',
    );

    expect($secondGrant->is($firstGrant))->toBeTrue()
        ->and($secondWithdrawal->is($firstWithdrawal))->toBeTrue()
        ->and($user->consentRecords()->count())->toBe(2);
});

test('consent withdrawal requires a current grant', function () {
    $user = User::factory()->create();

    expect(fn () => app(ConsentRecorder::class)->withdraw(
        $user,
        'portfolio.visibility',
        'v1',
        'privacy_settings',
    ))->toThrow(LogicException::class)
        ->and(ConsentRecord::query()->count())->toBe(0);
});

test('consent projection isolates users and purposes', function () {
    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();
    $recorder = app(ConsentRecorder::class);

    $firstPurpose = $recorder->grant(
        $firstUser,
        'portfolio.visibility',
        'v1',
        'onboarding',
    );
    $secondPurpose = $recorder->grant(
        $firstUser,
        'matching.participation',
        'v1',
        'onboarding',
    );
    $otherUser = $recorder->grant(
        $secondUser,
        'portfolio.visibility',
        'v1',
        'onboarding',
    );

    expect($recorder->current($firstUser, 'portfolio.visibility')?->is($firstPurpose))
        ->toBeTrue()
        ->and($recorder->current($firstUser, 'matching.participation')?->is($secondPurpose))
        ->toBeTrue()
        ->and($recorder->current($secondUser, 'portfolio.visibility')?->is($otherUser))
        ->toBeTrue();
});

test('consent projection uses id as a deterministic timestamp tie break', function () {
    $user = User::factory()->create();
    $occurredAt = CarbonImmutable::parse('2026-07-24 08:00:00');
    $grant = ConsentRecord::factory()
        ->for($user)
        ->granted()
        ->create([
            'purpose' => 'portfolio.visibility',
            'granted_at' => $occurredAt,
            'occurred_at' => $occurredAt,
        ]);
    $withdrawal = ConsentRecord::factory()
        ->for($user)
        ->withdrawn()
        ->create([
            'purpose' => 'portfolio.visibility',
            'withdrawn_at' => $occurredAt,
            'occurred_at' => $occurredAt,
        ]);

    expect($withdrawal->getKey())->toBeGreaterThan($grant->getKey())
        ->and(app(ConsentRecorder::class)
            ->current($user, 'portfolio.visibility')?->is($withdrawal))
        ->toBeTrue();
});

test('consent event timestamps enforce exactly one grant or withdrawal at database level', function (
    ?CarbonImmutable $grantedAt,
    ?CarbonImmutable $withdrawnAt,
) {
    $user = User::factory()->create();

    expect(fn () => DB::table('consent_records')->insert([
        'user_id' => $user->getKey(),
        'purpose' => 'portfolio.visibility',
        'policy_version' => 'v1',
        'source' => 'test',
        'granted_at' => $grantedAt,
        'withdrawn_at' => $withdrawnAt,
        'occurred_at' => $grantedAt ?? $withdrawnAt ?? now(),
        'created_at' => now(),
    ]))->toThrow(QueryException::class);
})->with([
    'neither event timestamp' => [null, null],
    'both event timestamps' => [
        CarbonImmutable::parse('2026-07-24 08:00:00'),
        CarbonImmutable::parse('2026-07-24 09:00:00'),
    ],
]);

test('consent event timestamp must match its canonical occurred time', function () {
    $user = User::factory()->create();

    expect(fn () => DB::table('consent_records')->insert([
        'user_id' => $user->getKey(),
        'purpose' => 'portfolio.visibility',
        'policy_version' => 'v1',
        'source' => 'test',
        'granted_at' => CarbonImmutable::parse('2026-07-24 08:00:00'),
        'withdrawn_at' => null,
        'occurred_at' => CarbonImmutable::parse('2026-07-24 09:00:00'),
        'created_at' => now(),
    ]))->toThrow(QueryException::class);
});

test('consent history is append only through model and query mutation paths', function () {
    $consent = ConsentRecord::factory()->create();

    $consent->forceFill(['source' => 'tampered']);

    expect(fn () => $consent->saveQuietly())->toThrow(LogicException::class)
        ->and(fn () => $consent->deleteQuietly())->toThrow(LogicException::class)
        ->and(fn () => ConsentRecord::query()
            ->whereKey($consent->getKey())
            ->update(['source' => 'tampered']))
        ->toThrow(QueryException::class)
        ->and(fn () => ConsentRecord::query()
            ->whereKey($consent->getKey())
            ->delete())
        ->toThrow(QueryException::class)
        ->and($consent->fresh()?->source)->toBe('factory');
});

test('consent withdrawal preserves its own bounded policy version', function () {
    $user = User::factory()->create();
    $recorder = app(ConsentRecorder::class);
    $recorder->grant($user, 'portfolio.visibility', 'v1', 'onboarding');

    $withdrawal = $recorder->withdraw(
        $user,
        'portfolio.visibility',
        'v2',
        'privacy_settings',
    );

    expect($withdrawal->policy_version)->toBe('v2')
        ->and($withdrawal->isGrant())->toBeFalse()
        ->and($user->consentRecords()->count())->toBe(2);
});

test('consent ownership and provenance are not freely mass assignable', function () {
    $consent = ConsentRecord::factory()->create();
    $otherUser = User::factory()->create();

    expect(fn () => $consent->fill([
        'user_id' => $otherUser->getKey(),
        'purpose' => 'tampered',
        'policy_version' => 'tampered',
        'source' => 'tampered',
        'granted_at' => null,
        'withdrawn_at' => now(),
    ]))->toThrow(MassAssignmentException::class);

    $consent->refresh();

    expect($consent->user_id)->not->toBe($otherUser->getKey())
        ->and($consent->purpose)->toBe('factory.testing')
        ->and($consent->policy_version)->toBe('v1')
        ->and($consent->source)->toBe('factory')
        ->and($consent->granted_at)->not->toBeNull()
        ->and($consent->withdrawn_at)->toBeNull();
});

test('consent identifiers reject empty malformed and oversized values', function (
    string $field,
    string $value,
) {
    $user = User::factory()->create();
    $arguments = [
        'purpose' => 'portfolio.visibility',
        'policyVersion' => 'v1',
        'source' => 'onboarding',
    ];
    $arguments[$field] = $value;

    expect(fn () => app(ConsentRecorder::class)->grant(
        $user,
        $arguments['purpose'],
        $arguments['policyVersion'],
        $arguments['source'],
    ))->toThrow(InvalidArgumentException::class);
})->with([
    'empty purpose' => ['purpose', '  '],
    'malformed purpose' => ['purpose', 'portfolio visibility'],
    'oversized policy version' => ['policyVersion', str_repeat('v', 101)],
    'malformed source' => ['source', 'Onboarding UI'],
]);

test('consent provenance prevents subject deletion', function () {
    $consent = ConsentRecord::factory()->create();

    expect(fn () => $consent->user->delete())->toThrow(QueryException::class);
});
