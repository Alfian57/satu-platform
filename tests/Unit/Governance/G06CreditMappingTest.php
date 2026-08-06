<?php

function governanceDecisions(): string
{
    $contents = file_get_contents(
        dirname(__DIR__, 3).DIRECTORY_SEPARATOR.'docs/governance/DECISIONS.md',
    );

    if ($contents === false) {
        throw new RuntimeException('Unable to read docs/governance/DECISIONS.md.');
    }

    return $contents;
}

test('DECISIONS.md documents academic credit mapping section', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('## Academic Credit Mapping and Pilot API');
});

test('DECISIONS.md records credit mapping schema versioning', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('credit_mappings')
        ->toContain('version integer')
        ->toContain('mapping_version');
});

test('DECISIONS.md records duplicate mapping handling', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('Duplicate')
        ->toContain('Unique constraint')
        ->toContain('active = true');
});

test('DECISIONS.md records sandbox scenarios', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('Sandbox Scenarios')
        ->toContain('Success path')
        ->toContain('Network timeout')
        ->toContain('Auth failure');
});

test('DECISIONS.md records sync idempotency', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('Idempotency-Key')
        ->toContain('idempotency key unik');
});

test('DECISIONS.md records retry backoff and timeout', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('exponential backoff')
        ->toContain('30 detik')
        ->toContain('dead-letter');
});

test('DECISIONS.md records external duplicate reconciliation', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('reconciliation_pending')
        ->toContain('rekonsiliasi');
});

test('DECISIONS.md records encrypted config for provider secrets', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('terenkripsi')
        ->toContain('API key')
        ->toContain('Tidak masuk log');
});

test('DECISIONS.md records pilot API boundaries', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('Pilot API Boundaries')
        ->toContain('Connection contract')
        ->toContain('AcademicGateway')
        ->toContain('Sandbox implementation');
});

test('DECISIONS.md records sandbox scope as release baseline', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('sandbox tetap release baseline')
        ->toContain('Koneksi API nyata adalah external gate');
});

test('DECISIONS.md records open gate items requiring external confirmation', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('### Open')
        ->toContain('GATE-006')
        ->toContain('GATE-007')
        ->toContain('GATE-008')
        ->toContain('GATE-009')
        ->toContain('GATE-010');
});

test('DECISIONS.md records external dependency for production provider', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('external gate')
        ->toContain('API key dan endpoint dari kampus');
});

test('DECISIONS.md maps credit to approved contributions only', function () {
    $doc = governanceDecisions();

    expect($doc)
        ->toContain('kontribusi approved')
        ->toContain('approved contribution');
});

test('DECISIONS.md does not use unicode em dash', function () {
    $doc = governanceDecisions();

    expect($doc)->not->toContain("\u{2014}");
});
