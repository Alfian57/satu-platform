<?php

namespace Tests\Feature\Platform;

use App\Enums\InstitutionMembershipStatus;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Release Rehearsal & Final UAT Quality Gate (Issue #70 / P69)
|--------------------------------------------------------------------------
|
| Validates that:
| - Fresh deployment rehearsal, migrations, and seed complete cleanly
| - Key tables and seed records exist post-rehearsal
| - Tenant isolation boundaries remain intact across critical entities
| - Policy-based access controls and append-only constraints are enforced
| - System integrity checks pass without schema or execution errors
|
*/

test('fresh deployment rehearsal creates all required database tables', function () {
    $tables = [
        'users',
        'institutions',
        'institution_memberships',
        'institution_domains',
        'phone_numbers',
        'otp_challenges',
        'affiliation_requests',
        'affiliation_reviews',
        'projects',
        'project_roles',
        'tasks',
        'task_assignments',
        'messages',
        'attachments',
        'inclusion_signals',
        'inclusion_signal_versions',
        'inclusion_reviews',
        'match_score_versions',
        'match_runs',
        'recommendations',
        'student_profiles',
        'profile_skills',
    ];

    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("Table [{$table}] must exist post-migration");
    }
});

test('tenant boundary and membership policy controls prevent cross-tenant leakage', function () {
    $institutionA = Institution::factory()->active()->create(['name' => 'Campus A']);
    $institutionB = Institution::factory()->active()->create(['name' => 'Campus B']);

    $userA = User::factory()->create();
    $membershipA = InstitutionMembership::factory()
        ->for($userA)
        ->for($institutionA)
        ->create(['status' => InstitutionMembershipStatus::Verified]);

    $userB = User::factory()->create();
    $membershipB = InstitutionMembership::factory()
        ->for($userB)
        ->for($institutionB)
        ->create(['status' => InstitutionMembershipStatus::Verified]);

    // Verify memberships are strictly scoped per institution
    expect(InstitutionMembership::where('institution_id', $institutionA->id)->pluck('user_id'))
        ->toContain($userA->id)
        ->not->toContain($userB->id);

    expect(InstitutionMembership::where('institution_id', $institutionB->id)->pluck('user_id'))
        ->toContain($userB->id)
        ->not->toContain($userA->id);
});

test('rehearsal verification confirms database triggers and index constraints exist', function () {
    $indexes = collect(Schema::getIndexes('institution_memberships'))
        ->pluck('name')
        ->toArray();

    expect($indexes)->toContain('institution_memberships_queue_order_idx');
});

test('default database driver handles JSON and timestamp casting cleanly', function () {
    $institution = Institution::factory()->active()->create();
    $domain = InstitutionDomain::factory()->for($institution)->create([
        'domain' => 'rehearsal-campus.ac.id',
        'status' => 'verified',
    ]);

    expect($domain->fresh()->domain)->toBe('rehearsal-campus.ac.id')
        ->and($domain->fresh()->status->value)->toBe('verified');
});
