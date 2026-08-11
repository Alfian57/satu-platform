<?php

use Illuminate\Support\Facades\Schema;

test('schema migrations use bounded MySQL identifier names', function () {
    $migrationSources = [
        database_path('migrations/2026_08_08_000006_create_recruiter_saved_candidates_table.php') => [
            'saved_candidates_projection_fk',
            'saved_candidates_org_created_idx',
        ],
        database_path('migrations/2026_08_08_000007_create_recruiter_contact_requests_table.php') => [
            'contact_requests_projection_fk',
            'contact_requests_org_status_idx',
            'contact_requests_candidate_status_idx',
            'contact_requests_expiry_status_idx',
        ],
        database_path('migrations/2026_08_10_231233_create_integration_sync_metrics_table.php') => [
            'integration_metrics_institution_connection_idx',
        ],
    ];

    foreach ($migrationSources as $path => $constraintNames) {
        $source = file_get_contents($path);
        expect($source)->toBeString();

        foreach ($constraintNames as $constraintName) {
            expect($source)->toContain("'{$constraintName}'");
        }
    }

    if (Schema::getConnection()->getDriverName() !== 'mysql') {
        return;
    }

    $foreignKeys = collect([
        ...Schema::getForeignKeys('recruiter_saved_candidates'),
        ...Schema::getForeignKeys('recruiter_contact_requests'),
    ])->pluck('name');
    $indexes = collect([
        ...Schema::getIndexes('recruiter_saved_candidates'),
        ...Schema::getIndexes('recruiter_contact_requests'),
        ...Schema::getIndexes('integration_sync_metrics'),
    ])->pluck('name');

    expect($foreignKeys)
        ->toContain('saved_candidates_projection_fk')
        ->toContain('contact_requests_projection_fk')
        ->each(fn (string $name) => expect(mb_strlen($name))->toBeLessThanOrEqual(64));

    expect($indexes)
        ->toContain('saved_candidates_org_created_idx')
        ->toContain('contact_requests_org_status_idx')
        ->toContain('contact_requests_candidate_status_idx')
        ->toContain('contact_requests_expiry_status_idx')
        ->toContain('integration_metrics_institution_connection_idx')
        ->each(fn (string $name) => expect(mb_strlen($name))->toBeLessThanOrEqual(64));
});
