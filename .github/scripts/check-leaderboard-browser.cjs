const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://localhost:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
);
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-leaderboard-'));
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}
(async () => {
    const html = await (await fetch(qaOrigin + '/')).text();
    const tag = /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/;
    const initial = JSON.parse(html.match(tag)[2]);
    const head = html
        .match(/<head>([\s\S]*?)<\/head>/)[1]
        .replace(
            /<script[^>]*src="[^"]*\/resources\/js\/pages\/welcome\.tsx"[^>]*><\/script>/,
            '',
        );
    const template =
        '<!doctype html><html lang="id"><head>' +
        head +
        '</head><body>' +
        html.match(tag)[0] +
        '<div id="app"></div></body></html>';
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const errors = [],
        commands = [];
    let optedIn = false,
        preferenceVersion = 0,
        pendingXpCount = 1,
        failure = null,
        readFailure = null,
        admin = false,
        deferred = false,
        rescued = false,
        rowDelay = false;
    await context.grantPermissions(['local-network-access'], {
        origin: qaOrigin,
    });
    await context.addInitScript(() => {
        for (const guide of [
            'student-dashboard-journey-v1',
            'student-menu-tour-v1',
        ]) {
            localStorage.setItem(
                'satu:feature-guide:' + guide + ':user:99003',
                'seen',
            );
        }
    });
    function payload(url) {
        const scope = url.searchParams.get('scope') || 'program';
        const labels = {
            program: 'Program studi',
            team: 'Tim',
            individual: 'Individual',
        };
        const visible = scope !== 'individual' || optedIn;

        return {
            ...initial,
            component: 'leaderboards/index',
            url: url.pathname + url.search,
            deferredProps: undefined,
            props: {
                ...initial.props,
                errors: {},
                onboarding: null,
                sidebarOpen: true,
                auth: {
                    user: {
                        id: 99003,
                        name: 'Mahasiswa. Data synthetic',
                        workspace: {
                            role: admin ? 'campus_admin' : 'student',
                            institution: {
                                id: 99002,
                                name: 'Universitas contoh. Data synthetic',
                            },
                            recruiterOrganization: null,
                        },
                    },
                },
                shell: {
                    institutionMembership: {
                        institutionName: 'Universitas contoh. Data synthetic',
                        status: 'verified',
                    },
                },
                leaderboard: {
                    state: 'ready',
                    institution: {
                        id: 99002,
                        name: 'Universitas contoh. Data synthetic',
                    },
                    semester: 'Semester uji. Data synthetic',
                    semesters: [
                        {
                            value: 'Semester uji. Data synthetic',
                            label: 'Semester uji. Data synthetic',
                        },
                    ],
                    scope,
                    scopes: Object.entries(labels)
                        .filter(([key]) => !admin || key !== 'individual')
                        .map(([value, label]) => ({
                            value,
                            label,
                            description: 'Data synthetic',
                        })),
                    period: {
                        computedAt: '2026-10-16T10:00:00Z',
                        isStale: false,
                        ruleVersion: '1.0.0',
                    },
                    preference: {
                        isOptedIn: optedIn,
                        version: preferenceVersion,
                    },
                    badges: [],
                    isCampusOperator: admin,
                    personalXp: admin ? null : 3,
                    pendingXpCount: admin ? null : pendingXpCount,
                },
                leaderboardRows: {
                    state: visible ? 'ready' : 'empty',
                    rows: visible
                        ? [
                              {
                                  scopeType: scope,
                                  scopeKey: scope + ':synthetic',
                                  scopeLabel:
                                      scope === 'individual'
                                          ? 'Mahasiswa. Data synthetic'
                                          : 'Kelompok. Data synthetic',
                                  rank: 1,
                                  sharedRankGroup: 1,
                                  score: '3.0000',
                                  verifiedXpTotal:
                                      scope === 'individual' ? 3 : 15,
                                  activeMemberDenominator:
                                      scope === 'individual' ? 1 : 5,
                                  cohortSize: scope === 'individual' ? 1 : 5,
                                  suppressed: false,
                                  suppressionReason: null,
                              },
                          ]
                        : [],
                    pagination: {
                        currentPage: 1,
                        lastPage: 1,
                        perPage: 10,
                        total: visible ? 1 : 0,
                    },
                    emptyReason: visible ? null : 'opt_in_required',
                },
            },
        };
    }
    await context.route('**/*', async (route) => {
        const request = route.request(),
            url = new URL(request.url());

        if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
            return route.abort();
        }

        if (url.pathname.includes('_boost/browser-logs')) {
            return route.fulfill({ status: 204 });
        }

        if (url.origin !== qaOrigin) {
            return route.fallback();
        }

        if (request.method() !== 'GET') {
            assert.equal(url.pathname, '/leaderboards/preferences/individual');
            commands.push(request.postDataJSON());

            if (failure === 'network') {
                return route.abort('failed');
            }

            if (failure === 'version') {
                const conflict = payload(
                    new URL('/leaderboards?scope=individual', qaOrigin),
                );
                conflict.props.errors = {
                    expected_version:
                        'Pengaturan peringkat telah berubah di sesi lain. Periksa status terbaru sebelum mengirim perubahan lagi.',
                };

                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'X-Inertia': 'true' },
                    body: JSON.stringify(conflict),
                });
            }

            if (failure) {
                return route.fulfill({ status: failure, body: '{}' });
            }

            assert.equal(
                request.postDataJSON().expected_version,
                preferenceVersion,
            );
            optedIn = request.postDataJSON().is_opted_in;
            preferenceVersion++;

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'X-Inertia': 'true' },
                body: JSON.stringify(
                    payload(
                        new URL('/leaderboards?scope=individual', qaOrigin),
                    ),
                ),
            });
        }

        if (url.pathname !== '/leaderboards') {
            return route.fallback();
        }

        const isInertia = request.headers()['x-inertia'];

        if (readFailure && isInertia) {
            if (readFailure === 'network') {
                return route.abort('failed');
            }

            return route.fulfill({ status: readFailure, body: '{}' });
        }

        if (rowDelay && isInertia) {
            await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const data = payload(url);

        if (deferred && !isInertia) {
            delete data.props.leaderboardRows;
            data.deferredProps = { default: ['leaderboardRows'] };
        }

        if (rescued && isInertia) {
            delete data.props.leaderboardRows;
            data.rescuedProps = ['leaderboardRows'];
        }

        return route.fulfill(
            isInertia
                ? {
                      status: 200,
                      contentType: 'application/json',
                      headers: { 'X-Inertia': 'true' },
                      body: JSON.stringify(data),
                  }
                : {
                      status: 200,
                      contentType: 'text/html',
                      body: template.replace(
                          tag,
                          (_, start, raw, end) =>
                              start +
                              JSON.stringify(data).replace(/</g, '\\u003c') +
                              end,
                      ),
                  },
        );
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));

    try {
        await page.goto(qaOrigin + '/leaderboards');
        await page.locator('[data-test="leaderboard-personal-xp"]').waitFor();
        check(
            (
                await page
                    .locator('[data-test="leaderboard-personal-xp"]')
                    .innerText()
            ).includes('3 XP'),
            'XP pribadi tersedia tanpa persetujuan individual.',
        );
        check(
            (
                await page
                    .locator('[data-test="leaderboard-xp-pending"]')
                    .innerText()
            ).includes('seluruh semester'),
            'XP tertunda dijelaskan kepada pemilik tanpa mengarang nilai atau semester.',
        );

        for (const width of [320, 375, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 960 });
            await page.waitForFunction(() => {
                const actions = document.querySelector(
                    '.student-menu-hero__actions',
                );

                return (
                    actions &&
                    parseFloat(getComputedStyle(actions).marginTop) ===
                        (innerWidth >= 640 ? 48 : 36)
                );
            });
            check(
                await page
                    .locator('.student-menu-hero__actions')
                    .evaluate(
                        (actions) =>
                            parseFloat(getComputedStyle(actions).marginTop) ===
                            (innerWidth >= 640 ? 48 : 36),
                    ),
                'Peringkat: jarak tombol hero selaras pada ' + width + 'px.',
            );
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                'Peringkat reflow ' + width,
            );
            await page.screenshot({
                path: path.join(artifacts, 'peringkat-' + width + '.png'),
                fullPage: true,
            });
        }

        await page.setViewportSize({ width: 1280, height: 960 });
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page.getByRole('dialog').waitFor();
        check(
            (await page.getByRole('dialog').innerText()).includes(
                'Nama, peringkat, total XP',
            ),
            'Dialog persetujuan menjelaskan data yang dibagikan.',
        );
        await page.keyboard.press('Escape');
        check(
            await page
                .locator('[data-test="leaderboard-preference-action"]')
                .evaluate((node) => node === document.activeElement),
            'Menutup dialog mengembalikan fokus.',
        );
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page.locator('[data-test="leaderboard-opt-in-confirm"]').click();
        await page
            .locator('[data-test="leaderboard-preference-success"]')
            .waitFor();
        check(
            optedIn &&
                commands.length === 1 &&
                commands[0].is_opted_in === true &&
                commands[0].expected_version === 0,
            'Opt-in hanya dikirim setelah konfirmasi eksplisit.',
        );
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page
            .locator('[data-test="leaderboard-withdraw-confirm"]')
            .click();
        await page
            .locator('[data-test="leaderboard-preference-success"]')
            .waitFor();
        check(
            !optedIn &&
                commands.length === 2 &&
                commands[1].expected_version === 1,
            'Penarikan tersambung ke status server tanpa menghapus XP.',
        );
        failure = 'network';
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page.locator('[data-test="leaderboard-opt-in-confirm"]').click();
        await page
            .locator('[data-test="leaderboard-preference-error"]')
            .waitFor();
        check(
            await page
                .locator('[data-test="leaderboard-opt-in-confirm"]')
                .isDisabled(),
            'Hasil jaringan belum pasti menahan pengiriman ulang.',
        );
        await page.keyboard.press('Escape');
        check(
            await page
                .locator('[data-test="leaderboard-preference-action"]')
                .isDisabled(),
            'Dialog ditutup tidak membuka ulang command yang belum pasti.',
        );
        failure = null;
        await page
            .locator('[data-test="leaderboard-preference-check"]')
            .click();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="leaderboard-preference-action"]',
                ).disabled,
        );
        check(
            commands.length === 3,
            'Pemeriksaan status hanya GET, bukan retry mutasi.',
        );
        failure = 'version';
        preferenceVersion++;
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page.locator('[data-test="leaderboard-opt-in-confirm"]').click();
        await page
            .locator('[data-test="leaderboard-preference-error"]')
            .waitFor();
        check(
            !optedIn &&
                commands.length === 4 &&
                commands[3].expected_version === 2 &&
                (await page
                    .locator('[data-test="leaderboard-opt-in-confirm"]')
                    .isDisabled()),
            'Konflik dua tab menjaga penarikan izin dan menahan pengiriman ulang.',
        );
        await page.keyboard.press('Escape');
        failure = null;
        await page
            .locator('[data-test="leaderboard-preference-check"]')
            .click();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="leaderboard-preference-action"]',
                ).disabled,
        );
        check(
            commands.length === 4,
            'Pemeriksaan konflik hanya membaca versi terbaru.',
        );
        await page
            .locator('[data-test="leaderboard-preference-action"]')
            .click();
        await page.locator('[data-test="leaderboard-opt-in-confirm"]').click();
        await page
            .locator('[data-test="leaderboard-preference-success"]')
            .waitFor();
        check(
            optedIn && commands[4].expected_version === 3,
            'Konfirmasi baru menggunakan versi hasil pemeriksaan, bukan versi tab lama.',
        );
        pendingXpCount = 0;
        await page.goto(qaOrigin + '/leaderboards');
        await page.locator('[data-test="leaderboard-personal-xp"]').waitFor();
        check(
            (await page
                .locator('[data-test="leaderboard-xp-pending"]')
                .count()) === 0,
            'Pemberitahuan tertunda hilang setelah seluruh XP tercatat.',
        );
        readFailure = 403;
        await page.locator('[data-test="leaderboard-refresh"]').click();
        await page
            .getByRole('heading', { name: 'Peringkat belum tersedia.' })
            .waitFor();
        check(
            (await page
                .locator('[data-test="leaderboard-personal-xp"]')
                .count()) === 0,
            '403 menyembunyikan snapshot serta XP pribadi lama.',
        );
        readFailure = null;
        admin = true;
        await page.goto(qaOrigin + '/leaderboards');
        await page.locator('[data-test="leaderboard-header"]').waitFor();

        for (const width of [320, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 960 });
            const hero = page.locator('[data-test="leaderboard-header"]');
            check(
                (await hero.getAttribute('data-campus-theme')) === 'rankings' &&
                    (await hero.locator('.satu-mascot, img').count()) === 0 &&
                    (await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    )),
                'Peringkat admin: hero formal tanpa maskot pada ' +
                    width +
                    'px.',
            );

            if (width === 1280) {
                await page.screenshot({
                    path: path.join(artifacts, 'peringkat-admin.png'),
                });
            }
        }

        check(
            (await page
                .locator('[data-test="leaderboard-consent"]')
                .count()) === 0 &&
                (await page
                    .locator('[data-test="leaderboard-personal-xp"]')
                    .count()) === 0 &&
                (await page
                    .locator('[data-test="leaderboard-xp-pending"]')
                    .count()) === 0,
            'Admin membaca kelompok tanpa kontrol atau XP pribadi mahasiswa.',
        );
        deferred = rowDelay = true;
        admin = false;
        await page.goto(qaOrigin + '/leaderboards');
        await page.locator('[data-test="leaderboard-loading"]').waitFor();
        check(
            true,
            'Deferred menampilkan skeleton terpisah dari kondisi kosong.',
        );
        await page.waitForFunction(
            () => !document.querySelector('[data-test="leaderboard-loading"]'),
        );
        const beforeRecoveryCommands = commands.length;
        rescued = true;
        await page.goto(qaOrigin + '/leaderboards?scope=team');
        await page
            .locator('[data-test="leaderboard-deferred-retry"]')
            .waitFor();
        check(
            (await page
                .locator('[data-test="leaderboard-loading"]')
                .count()) === 0 &&
                (await page
                    .locator('[data-test="leaderboard-header"]')
                    .count()) === 1,
            'Resolver awal gagal mengganti skeleton dengan pemulihan tanpa menghilangkan shell.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'deferred-gagal.png'),
            fullPage: true,
        });
        rescued = false;
        await page.locator('[data-test="leaderboard-deferred-retry"]').click();
        await page
            .getByRole('heading', { name: 'Peringkat tim', exact: true })
            .waitFor();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="leaderboard-deferred-retry"]',
                ),
        );
        check(
            commands.length === beforeRecoveryCommands &&
                new URL(page.url()).searchParams.get('scope') === 'team',
            'Pemulihan resolver hanya GET dan mempertahankan kategori.',
        );

        for (const readError of [500, 'network', 403]) {
            readFailure = readError;
            rowDelay = false;
            await page.goto(qaOrigin + '/leaderboards');

            if (readError === 403) {
                await page
                    .getByRole('heading', { name: 'Peringkat belum tersedia.' })
                    .waitFor({ timeout: 8000 });
                check(
                    (await page
                        .locator('[data-test="leaderboard-personal-xp"]')
                        .count()) === 0,
                    '403 pada deferred awal menyembunyikan data privat.',
                );
            } else {
                await page
                    .locator('[data-test="leaderboard-retry"]')
                    .waitFor({ timeout: 8000 });
                check(
                    (await page
                        .locator('[data-test="leaderboard-loading"]')
                        .count()) === 0,
                    String(readError) +
                        ' pada deferred awal tidak tertahan pada loading.',
                );
                readFailure = null;
                await page.locator('[data-test="leaderboard-retry"]').click();
                await page.waitForFunction(
                    () =>
                        !document.querySelector(
                            '[data-test="leaderboard-retry"]',
                        ),
                );
                check(
                    commands.length === beforeRecoveryCommands,
                    'Retry ' + readError + ' tidak mengirim command bisnis.',
                );
            }

            readFailure = null;
        }

        check(
            errors.length === 0,
            'Tidak ada exception JavaScript: ' + errors.join('; '),
        );
        console.log(
            checks +
                ' pemeriksaan browser Peringkat lulus. Semua command dicegat. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
