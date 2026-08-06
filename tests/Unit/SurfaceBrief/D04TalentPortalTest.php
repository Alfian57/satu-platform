<?php

function talentBriefContent(): string
{
    $path = dirname(__DIR__, 3).'/.impeccable/surfaces/route-talent.md';
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('YAML frontmatter has required fields', function () {
    $brief = talentBriefContent();

    expect($brief)->toContain('version: 3');
    expect($brief)->toContain('slug: "route-talent"');
    expect($brief)->toContain('primary_target: "route:/talent"');
    expect($brief)->toContain('related_targets:');
    expect($brief)->toContain('"route:/talent/candidates/{candidate}"');
    expect($brief)->toContain('"route:/talent/saved"');
    expect($brief)->toContain('"route:/talent/contacts"');
    expect($brief)->toContain('"route:/talent/contacts/{contact}"');
});

test('documents organization states', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Organization')
        ->toContain('**Pending:**')
        ->toContain('**Rejected:**')
        ->toContain('**Verified:**')
        ->toContain('**Suspended:**');
});

test('documents entitlement states', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Entitlement')
        ->toContain('**Inactive:**')
        ->toContain('**Scheduled:**')
        ->toContain('**Active:**')
        ->toContain('**Expired:**')
        ->toContain('**Revoked:**');
});

test('documents candidate search states including empty, no filter, unavailable', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Candidate Search')
        ->toContain('**Empty index:**')
        ->toContain('**No filter result:**')
        ->toContain('**Filtered result')
        ->toContain('**Large paginated result:**')
        ->toContain('**Unavailable candidate:**');
});

test('documents contact request states', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Contact Request')
        ->toContain('**Pending:**')
        ->toContain('**Accepted:**')
        ->toContain('**Declined:**')
        ->toContain('**Expired:**')
        ->toContain('**Canceled:**');
});

test('documents student visibility states', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Student Visibility')
        ->toContain('**Opted in:**')
        ->toContain('**Opted out:**')
        ->toContain('**Withdrawn:**');
});

test('explicitly lists forbidden fields recruiter never sees', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Forbidden Fields (Recruiter Never Sees)')
        ->toContain('Inclusion signal')
        ->toContain('raw evidence privat')
        ->toContain('Audit trail')
        ->toContain('Nomor WhatsApp')
        ->toContain('Hidden score')
        ->toContain('connectivity_opportunity')
        ->toContain('Student yang telah withdraw visibility');
});

test('defines visibility withdrawal consequence explicitly', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Visibility Withdrawal Consequence')
        ->toContain('tidak muncul pada search baru')
        ->toContain('Tidak tersedia')
        ->toContain('telah menarik')
        ->toContain('tidak dapat mengirim permintaan baru')
        ->toContain('tetap aktif sampai student mencabut consent');
});

test('documents URL filter, mobile result, and keyboard interaction', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### URL Filter')
        ->toContain('### Result List')
        ->toContain('### Keyboard')
        ->toContain('Filter dapat dioperasikan dengan keyboard')
        ->toContain('Active filter chip dapat dihapus dengan keyboard')
        ->toContain('Contact confirmation dialog tidak memerangkap focus')
        ->toContain('Saved toggle dapat dioperasikan dengan Enter/Space');
});

test('defines responsive behavior from mobile to desktop', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Responsive Behavior')
        ->toContain('Desktop: split workspace')
        ->toContain('Tablet: filter sebagai panel togglable')
        ->toContain('Mobile (320px): stacked labeled rows tanpa horizontal overflow');
});

test('documents screen reader, reduced motion, and mobile consequence', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Screen Reader')
        ->toContain('### Reduced Motion')
        ->toContain('### Mobile Consequence');
});

test('references LOADING_STATES.md with region-level loading contract', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('Memuat daftar kandidat')
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Pagination dan refresh')
        ->toContain('Candidate detail loading')
        ->toContain('Saved list loading')
        ->toContain('Contact tracker loading')
        ->toContain('Processing command')
        ->toContain('Empty state')
        ->toContain('Error dan forbidden')
        ->toContain('Expired dan unavailable')
        ->toContain('Stale')
        ->toContain('Reduced motion');
});

test('documents non-color status semantics', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('### Non-Color Status')
        ->toContain('persepsi warna')
        ->toContain('Verified Mark')
        ->toContain('Pending Review')
        ->toContain('Correction Required')
        ->toContain('Menunggu respons')
        ->toContain('Diterima')
        ->toContain('Ditolak')
        ->toContain('Kedaluwarsa')
        ->toContain('Dibatalkan');
});

test('does not use stigmatizing language or unicode em dash', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->not->toContain("\u{2014}")
        ->not->toContain('terisolasi')
        ->not->toContain('rentan')
        ->not->toContain('mental');
});

test('documents tenant-scoped and institution-scoped constraints', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('institution-scoped')
        ->toContain('tenant-scoped')
        ->toContain('append-only log');
});

test('documents recruiter and student perspectives in outcome', function () {
    $brief = talentBriefContent();

    expect($brief)
        ->toContain('verified folio index')
        ->toContain('provenance')
        ->toContain('docket structured');
});
