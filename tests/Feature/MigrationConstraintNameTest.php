<?php

use Illuminate\Support\Facades\Schema;

test('recruiter projection foreign key names fit MySQL identifier limits', function () {
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

    expect($foreignKeys)
        ->toContain('saved_candidates_projection_fk')
        ->toContain('contact_requests_projection_fk')
        ->each(fn (string $name) => expect(mb_strlen($name))->toBeLessThanOrEqual(64));
});
