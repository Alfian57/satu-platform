<?php

function g04ProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 3).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('DECISIONS.md documents the pilot institution and roster contract section', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('## Pilot Institution and Roster Contract')
        ->toContain('### Institution Selection Criteria')
        ->toContain('### Roster Contract Requirements')
        ->toContain('### Roster Format and Normalization')
        ->toContain('### Active-Member Definition')
        ->toContain('### Manual-Review SLA')
        ->toContain('### Tenancy Boundaries')
        ->toContain('### Open');
});

test('pilot institution decisions are recorded in the accepted decisions table', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('DEC-021')
        ->toContain('DEC-022')
        ->toContain('DEC-023')
        ->toContain('DEC-024')
        ->toContain('DEC-025')
        ->toContain('DEC-026')
        ->toContain('DEC-027');
});

test('institution selection criteria defines pilot requirements', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('Institution bersedia menjadi pilot tunggal')
        ->toContain('menyediakan roster mahasiswa aktif')
        ->toContain('menunjuk minimal satu campus admin')
        ->toContain('data impor bersifat tenant-owned');
});

test('roster contract specifies data owner and usage purpose', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('Institution adalah data owner')
        ->toContain('SATU bertindak sebagai data processor')
        ->toContain('Tujuan penggunaan')
        ->toContain('CSV atau spreadsheet');
});

test('roster format defines required columns and normalization rules', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('| `nim`')
        ->toContain('| `nama`')
        ->toContain('| `program_studi`')
        ->toContain('| `angkatan`')
        ->toContain('| `semester`')
        ->toContain('| `nomor_whatsapp`')
        ->toContain('| `status_aktif`')
        ->toContain('Di-trim whitespace')
        ->toContain('E.164')
        ->toContain('duplicate_nim')
        ->toContain('record tidak aktif');
});

test('active-member definition is documented per semester', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('verified affiliation')
        ->toContain('roster semester')
        ->toContain('status_aktif = Aktif')
        ->toContain('approved contribution')
        ->toContain('cohort minimum')
        ->toContain('lima active member');
});

test('manual-review SLA defines first response and escalation timeline', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('3 hari kerja')
        ->toContain('5 hari kerja')
        ->toContain('append-only history')
        ->toContain('pending_info')
        ->toContain('correction flow');
});

test('tenancy boundaries cover all isolation layers', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('Institution-scoped queries')
        ->toContain('Institution-scoped Policies')
        ->toContain('Institution-scoped storage')
        ->toContain('Institution-scoped cache')
        ->toContain('Institution-scoped exports')
        ->toContain('Institution-scoped broadcasts')
        ->toContain('Cross-tenant platform operations')
        ->toContain('explicit audited scope');
});

test('open items list external confirmations needed from pilot institution', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('Nama institution pilot dikonfirmasi')
        ->toContain('menyetujui roster contract')
        ->toContain('menyetujui format roster')
        ->toContain('aturan normalisasi NIM')
        ->toContain('rule duplicate records')
        ->toContain('daftar `status_aktif`')
        ->toContain('active-member definition')
        ->toContain('manual-review SLA')
        ->toContain('correction flow')
        ->toContain('sample synthetic roster')
        ->toContain('menunjuk campus admin')
        ->toContain('tenancy boundaries');
});

test('GATE-001 references the pilot institution and roster contract section', function () {
    $decisions = g04ProjectFile('docs/governance/DECISIONS.md');

    expect($decisions)
        ->toContain('GATE-001')
        ->toContain('Pilot Institution and Roster Contract');
});
