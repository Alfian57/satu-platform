<?php

use App\Enums\InstitutionDomainStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

test('institution schema exposes canonical defaults and casts', function () {
    $institution = Institution::factory()->create([
        'settings' => ['portfolio_visibility' => 'institution'],
    ]);

    expect(Schema::hasColumns('institutions', [
        'name',
        'slug',
        'status',
        'timezone',
        'locale',
        'settings',
    ]))->toBeTrue()
        ->and($institution->status)->toBe(InstitutionStatus::Pending)
        ->and($institution->timezone)->toBe('Asia/Jakarta')
        ->and($institution->locale)->toBe('id')
        ->and($institution->settings)->toBe([
            'portfolio_visibility' => 'institution',
        ]);
});

test('institution factory states use canonical statuses', function (
    string $state,
    InstitutionStatus $expectedStatus,
) {
    $institution = Institution::factory()->{$state}()->create();

    expect($institution->status)->toBe($expectedStatus);
})->with([
    'active' => ['active', InstitutionStatus::Active],
    'suspended' => ['suspended', InstitutionStatus::Suspended],
    'archived' => ['archived', InstitutionStatus::Archived],
]);

test('institution owns its approved domains through an explicit relation', function () {
    $institution = Institution::factory()->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();

    expect($institution->domains()->sole()->is($domain))->toBeTrue()
        ->and($domain->institution->is($institution))->toBeTrue();
});

test('approved domain is normalized before persistence', function () {
    $domain = InstitutionDomain::factory()->create([
        'domain' => '  STUDENTS.Example.AC.ID.  ',
    ]);

    expect($domain->domain)->toBe('students.example.ac.id')
        ->and($domain->fresh()->domain)->toBe('students.example.ac.id');
});

test('approved domains remain globally unique after normalization', function () {
    InstitutionDomain::factory()->create([
        'domain' => 'students.example.ac.id',
    ]);

    expect(fn () => InstitutionDomain::factory()->create([
        'domain' => ' STUDENTS.EXAMPLE.AC.ID. ',
    ]))->toThrow(QueryException::class);
});

test('approved domain accepts only a bare hostname', function (string $domain) {
    expect(fn () => InstitutionDomain::factory()->make([
        'domain' => $domain,
    ]))->toThrow(InvalidArgumentException::class);
})->with([
    'email address' => 'admin@example.ac.id',
    'web URL' => 'https://example.ac.id',
    'path' => 'example.ac.id/students',
    'multiple root dots' => 'example.ac.id..',
]);

test('institution slugs are globally unique', function () {
    Institution::factory()->create(['slug' => 'universitas-contoh']);

    expect(fn () => Institution::factory()->create([
        'slug' => 'universitas-contoh',
    ]))->toThrow(QueryException::class);
});

test('approved domains require an existing institution', function () {
    expect(fn () => InstitutionDomain::factory()->create([
        'institution_id' => 999_999,
    ]))->toThrow(QueryException::class);
});

test('institution ownership cannot be removed while domains still reference it', function () {
    $institution = Institution::factory()->create();

    InstitutionDomain::factory()->for($institution)->create();

    expect(fn () => $institution->delete())->toThrow(QueryException::class);

    $this->assertModelExists($institution);
});

test('verified domain factory state records verification provenance', function () {
    $domain = InstitutionDomain::factory()->verified()->create();

    expect($domain->status)->toBe(InstitutionDomainStatus::Verified)
        ->and($domain->verified_at)->toBeInstanceOf(DateTimeInterface::class);
});

test('domain factory states keep unverified timestamps empty', function (
    string $state,
    InstitutionDomainStatus $expectedStatus,
) {
    $domain = InstitutionDomain::factory()->{$state}()->create();

    expect($domain->status)->toBe($expectedStatus)
        ->and($domain->verified_at)->toBeNull();
})->with([
    'rejected' => ['rejected', InstitutionDomainStatus::Rejected],
    'suspended' => ['suspended', InstitutionDomainStatus::Suspended],
]);
