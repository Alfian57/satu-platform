const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {}, URL };
vm.runInNewContext(
    ts.transpileModule(
        fs.readFileSync(
            path.join(
                __dirname,
                '../../resources/js/lib/student-capabilities.ts',
            ),
            'utf8',
        ),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
        },
    ).outputText,
    context,
);
const {
    capabilityDraft,
    editableEvidence,
    matchingReadiness,
    safeEvidenceUrl,
} = context.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const proof = { title: 'Karya sintetis', url: 'https://example.com/work' };
const profile = {
    id: 1,
    revision: 'a'.repeat(64),
    updated_at: '2026-10-10T00:00:00Z',
    bio: null,
    study_program: null,
    faculty: null,
    admission_year: null,
    skills: [
        {
            taxonomy_id: 5,
            proficiency: 'beginner',
            name: 'Desain',
            evidence_metadata: [proof],
        },
    ],
    interests: [{ taxonomy_id: 8, name: 'Lingkungan' }],
    availability_windows: [
        {
            id: 99,
            day_of_week: 1,
            starts_at: '09:01:03',
            ends_at: '10:10:11',
            timezone: 'Asia/Jakarta',
        },
    ],
    portfolio_visibility: 'public',
    recruiter_discoverable: true,
};

test('Profil kosong tidak membuat keahlian, jadwal, atau bukti fiktif', () => {
    const draft = plain(capabilityDraft(null, 7));
    assert.deepEqual(draft.skills, []);
    assert.deepEqual(draft.interests, []);
    assert.deepEqual(draft.availability_windows, []);
    assert.equal(draft.institution_id, 7);
    assert.deepEqual(plain(matchingReadiness(null)), ['keahlian', 'jadwal']);
});

test('Kesiapan memakai keahlian dan jadwal tersimpan, bukan bukti atau pengalaman', () => {
    assert.deepEqual(
        plain(
            matchingReadiness({
                ...profile,
                skills: [{ ...profile.skills[0], evidence_metadata: [] }],
            }),
        ),
        [],
    );
    assert.deepEqual(
        plain(matchingReadiness({ ...profile, availability_windows: [] })),
        ['jadwal'],
    );
    assert.deepEqual(plain(matchingReadiness({ ...profile, skills: [] })), [
        'keahlian',
    ]);
});

test('Draft membawa revisi, minat, detik dan zona per baris tanpa mengubah izin publikasi', () => {
    const draft = plain(capabilityDraft(profile, 7));
    assert.equal(draft.expected_profile_revision, profile.revision);
    assert.equal(draft.expected_updated_at, profile.updated_at);
    assert.deepEqual(draft.interests, [8]);
    assert.deepEqual(draft.availability_windows, [
        {
            day_of_week: 1,
            starts_at: '09:01:03',
            ends_at: '10:10:11',
            timezone: 'Asia/Jakarta',
        },
    ]);
    assert.equal('portfolio_visibility' in draft, false);
    assert.equal('recruiter_discoverable' in draft, false);
    assert.equal('name' in draft.skills[0], false);
});

test('Metadata lama tidak ditimpa diam-diam dan metadata baru terbatas pada tautan', () => {
    for (const legacy of [
        { storage_path: 'private/evidence.pdf' },
        [{ ...proof, approved: true }],
        [{ title: '', url: proof.url }],
        Array(11).fill(proof),
    ]) {
        assert.equal(editableEvidence(legacy), undefined);
        const draft = capabilityDraft(
            {
                ...profile,
                skills: [{ ...profile.skills[0], evidence_metadata: legacy }],
            },
            7,
        );
        assert.equal('evidence_metadata' in draft.skills[0], false);
    }

    assert.deepEqual(plain(editableEvidence(null)), []);
    assert.deepEqual(plain(editableEvidence([proof])), [proof]);
});

test('Tautan privat hanya HTTPS tanpa kredensial, alias IP dan parameter rahasia', () => {
    assert.equal(safeEvidenceUrl(proof.url), true);
    assert.equal(safeEvidenceUrl('https://example.com/work?version=2'), true);

    for (const url of [
        null,
        'javascript:alert(1)',
        'http://example.com',
        'data:text/html,test',
        'https://user:secret@example.com',
        'https://127.0.0.1',
        'https://[::1]',
        'https://0x7f000001',
        'https://2130706433',
        'https://project.local',
        'https://campus.internal',
        'https://example.com?token=secret',
        'https://example.com?X-Amz-Signature=test',
        ' https://example.com',
        'https://exam\nple.com',
        'https://example.com.',
    ]) {
        assert.equal(safeEvidenceUrl(url), false, String(url));
    }
});
