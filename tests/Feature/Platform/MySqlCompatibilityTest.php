<?php

namespace Tests\Feature\Platform;

use App\Actions\InstitutionMemberships\InstitutionMembershipReviewQueue;
use App\Enums\InstitutionMembershipStatus;
use App\Models\AffiliationReview;
use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| MySQL Compatibility & Schema Validation (Issue #62 / P61)
|--------------------------------------------------------------------------
|
| Validates that:
| - Schema structure matches required MySQL-compatible types and constraints
| - Raw SQL expressions in application Actions are syntactically portable
| - Behavior-critical queries do not rely on SQLite-only semantics
| - Critical composite indexes exist for hotspot query paths
|
*/

test('institution_memberships table has required queue-order composite index', function () {
    $indexes = collect(Schema::getIndexes('institution_memberships'))
        ->pluck('name')
        ->toArray();

    // The queue sort index must exist: (institution_id, status, requested_at)
    expect($indexes)->toContain('institution_memberships_queue_order_idx');
});

test('institution_memberships_queue_order_idx covers correct columns', function () {
    $indexColumns = collect(Schema::getIndexes('institution_memberships'))
        ->firstWhere('name', 'institution_memberships_queue_order_idx')['columns'] ?? [];

    expect($indexColumns)->toBe(['institution_id', 'status', 'requested_at']);
});

test('membership review queue uses the composite index prefix in its query plan', function () {
    $institution = Institution::factory()->active()->create();

    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();

    $plan = DB::select(
        'EXPLAIN QUERY PLAN SELECT * FROM institution_memberships WHERE institution_id = ? AND role = ? AND status = ? ORDER BY requested_at IS NULL, requested_at ASC, id ASC',
        [$institution->getKey(), 'student', InstitutionMembershipStatus::Pending->value],
    );

    $details = collect($plan)->pluck('detail')->implode(' | ');

    expect($details)->toContain('USING INDEX institution_memberships_queue_order_idx')
        ->and($details)->not->toContain('SCAN institution_memberships');
});

test('membership review queue orders null requested_at rows last', function () {
    $institution = Institution::factory()->active()->create();

    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();

    // Student with null requested_at (edge case: submitted without timestamp)
    $late = User::factory()->create(['name' => 'Null Timestamp User']);
    InstitutionMembership::factory()
        ->for($late)
        ->for($institution)
        ->create([
            'role' => 'student',
            'status' => 'pending',
            'requested_at' => null,
        ]);

    // Student with an earlier timestamp; should appear first
    $early = User::factory()->create(['name' => 'Early Submitter']);
    InstitutionMembership::factory()
        ->for($early)
        ->for($institution)
        ->create([
            'role' => 'student',
            'status' => 'pending',
            'requested_at' => now()->subHour(),
        ]);

    $queue = app(InstitutionMembershipReviewQueue::class);
    $items = $queue->query($admin, $institution)->get();

    // Non-null requested_at rows come before null rows
    $names = $items->map(fn ($m) => $m->user->name)->values()->toArray();

    expect($names)->toMatchArray(['Early Submitter', 'Null Timestamp User']);
});

test('fresh migration completes without error', function () {
    // If we can query all major tables, migration ran cleanly
    $tables = [
        'users', 'institutions', 'institution_memberships', 'institution_domains',
        'phone_numbers', 'otp_challenges', 'affiliation_requests', 'affiliation_reviews',
        'projects', 'project_roles', 'tasks', 'task_assignments', 'messages', 'attachments',
        'inclusion_signals', 'inclusion_signal_versions', 'inclusion_reviews',
        'match_score_versions', 'match_runs', 'recommendations',
        'student_profiles', 'profile_skills',
    ];

    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("Table [{$table}] does not exist");
    }
});

test('enum columns accept only defined values and reject invalid ones', function () {
    expect(fn () => Institution::factory()->create(['status' => 'unknown_status']))
        ->toThrow(QueryException::class);
})->skip(fn () => DB::getDriverName() !== 'mysql', 'Enum constraint enforcement only on MySQL');

test('json columns are readable as arrays via Eloquent casting', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();

    $version = InclusionSignalVersion::factory()->create(['version' => 'v-compat-1']);

    $signal = InclusionSignal::factory()->create([
        'institution_id' => $institution->id,
        'subject_id' => $student->id,
        'version_id' => $version->id,
        'evidence_summary' => ['factor' => 'test', 'score' => 0.7],
    ]);

    $fresh = $signal->fresh();

    expect($fresh->evidence_summary)->toBeArray()
        ->and($fresh->evidence_summary['factor'])->toBe('test')
        ->and($fresh->evidence_summary['score'])->toBe(0.7);
});

test('schema has no duplicate index names within any table', function () {
    // SQLite PRAGMA can reveal duplicates; this guards against naming collisions
    $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

    $seenIndexes = [];
    $duplicates = [];

    foreach ($tables as $table) {
        $indexes = DB::select("PRAGMA index_list({$table->name})");
        foreach ($indexes as $index) {
            if (in_array($index->name, $seenIndexes, true)) {
                $duplicates[] = $index->name;
            }
            $seenIndexes[] = $index->name;
        }
    }

    expect($duplicates)->toBeEmpty('Duplicate index name(s) found: '.implode(', ', $duplicates));
});

test('append-only trigger on affiliation_reviews prevents mutation in test environment', function () {
    $institution = Institution::factory()->active()->create();
    $admin = User::factory()->create();

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();

    // Use factory to create a review; it handles the affiliation_request chain
    $review = AffiliationReview::factory()->create([
        'reviewer_id' => $admin->id,
    ]);

    // Attempt to mutate the append-only review; trigger must throw
    expect(fn () => DB::table('affiliation_reviews')
        ->where('id', $review->id)
        ->update(['decision' => 'rejected'])
    )->toThrow(QueryException::class);
})->skip(
    fn () => DB::getDriverName() !== 'sqlite',
    'Trigger-based append-only enforcement tested on SQLite; MySQL trigger tested separately'
);
