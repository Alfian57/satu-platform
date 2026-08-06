<?php

function governanceProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 3).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

beforeEach(function () {
    $this->decisions = governanceProjectFile('docs/governance/DECISIONS.md');
});

test('documents Talent Entitlement and Recruiter Verification section', function () {
    expect($this->decisions)
        ->toContain('## Talent Entitlement and Recruiter Verification');
});

test('defines entitlement tiers', function () {
    expect($this->decisions)
        ->toContain('active entitlement')
        ->toContain('memiliki tier');
});

test('describes verification process', function () {
    expect($this->decisions)
        ->toContain('Recruiter organization diverifikasi')
        ->toContain('platform admin');
});

test('covers membership lifecycle states (active, suspended, revoked)', function () {
    expect($this->decisions)
        ->toContain('lifecycle audit')
        ->toContain('suspended')
        ->toContain('revoked');
});

test('mandates cross-organization denial', function () {
    expect($this->decisions)
        ->toContain('Cross-organization membership dilarang')
        ->toContain('Satu user tidak boleh memiliki membership');
});

test('enforces privacy boundary between recruiter and student', function () {
    expect($this->decisions)
        ->toContain('Recruiter-safe projection')
        ->toContain('hard boundary')
        ->toContain('Username, NIM, phone, private evidence, discussion, raw audit, matching input, inclusion signal')
        ->toContain('dilarang');
});

test('references PRD FR-08 Talent Portal requirements', function () {
    expect($this->decisions)
        ->toContain('contact request')
        ->toContain('student consent')
        ->toContain('visibility');
});

test('documents entitlement expiration impact', function () {
    expect($this->decisions)
        ->toContain('Entitlement expiration menolak aksi baru tanpa menghapus data historis')
        ->toContain('retention matrix');
});

test('maintains Open gate items for human decision', function () {
    expect($this->decisions)
        ->toContain('GATE-004-A')
        ->toContain('GATE-004-B')
        ->toContain('GATE-004-C')
        ->toContain('GATE-004-D')
        ->toContain('GATE-004-E')
        ->toContain('GATE-004-F');
});
