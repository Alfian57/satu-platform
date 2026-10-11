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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-t09-browser-'));
const mutations = [],
    exceptions = [];
let checks = 0,
    campus = false,
    failure = null,
    readFailure = null,
    delay = 0,
    confirmChoice = true,
    fixture;
function check(value, text) {
    assert.ok(value, text);
    checks++;
    console.log('PASS ' + text);
}
function reset(status = 'requested') {
    failure = readFailure = null;
    delay = 0;
    fixture = {
        institution: { id: 99002, name: 'Kampus A. Data synthetic' },
        reviewer: campus,
        enabled: true,
        can_create: !campus,
        notice: {
            purpose: 'Membantu menemukan peran yang dipilih.',
            version: 'support-v1',
            access_days: 7,
            dataset_kind: 'synthetic',
            dataset_manifest: 'browser-intercept-only',
        },
        opportunities: [
            {
                id: 99020,
                label: 'Desain bersama. Data synthetic / Perancang pemula',
                accepts_beginners: true,
            },
        ],
        requests: {
            page: 1,
            last_page: 1,
            total: 1,
            installed: true,
            data: [
                {
                    id: 99010,
                    need: 'beginner_path',
                    explanation:
                        'Kebutuhan privat pilihan mahasiswa. Data synthetic.',
                    owner_name: 'Mahasiswa. Data synthetic',
                    status,
                    revision: 1,
                    created_at: '2030-10-11T09:00:00Z',
                    expires_at: '2030-10-18T09:00:00Z',
                    permissions: {
                        review: campus,
                        respond: !campus,
                        withdraw: !campus,
                    },
                    events: [
                        {
                            id: 1,
                            action: 'requested',
                            reason: null,
                            created_at: '2030-10-11T09:00:00Z',
                            opportunity: null,
                        },
                        ...(status === 'offered' || status === 'accepted'
                            ? [
                                  {
                                      id: 2,
                                      action: 'offer',
                                      reason: 'Minat desain sesuai peran pemula.',
                                      created_at: '2030-10-11T10:00:00Z',
                                      opportunity: {
                                          project_id: 99001,
                                          project_title: 'Desain bersama',
                                          role_title: 'Perancang',
                                      },
                                  },
                              ]
                            : []),
                    ],
                },
            ],
        },
        journey: campus
            ? {
                  state: 'available',
                  snapshot_at: '2030-10-11T10:00:00Z',
                  denominator: 3,
                  metrics: [
                      {
                          label: 'Pernah mengajukan',
                          value: 1,
                          source: 'Pengguna unik dengan pengajuan tersimpan.',
                      },
                      {
                          label: 'Hubungan kerja baru',
                          value: null,
                          source: 'Riwayat belum lengkap. Bukan nol.',
                      },
                  ],
              }
            : null,
    };
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

    try {
        const context = await browser.newContext({
            reducedMotion: 'reduce',
            timezoneId: 'Asia/Bangkok',
        });
        await context.grantPermissions(['local-network-access'], {
            origin: qaOrigin,
        });
        await context.addInitScript(() => {
            for (const id of [
                'student-dashboard-journey-v1',
                'student-menu-tour-v1',
            ]) {
                localStorage.setItem(
                    'satu:feature-guide:' + id + ':user:99003',
                    'seen',
                );
            }
        });
        const payload = (url) => ({
            ...initial,
            component: 'opportunity-support/index',
            deferredProps: undefined,
            url: url.pathname + url.search,
            props: {
                ...initial.props,
                ...structuredClone(fixture),
                name: 'SATU',
                sidebarOpen: true,
                onboarding: null,
                errors: {},
                auth: {
                    user: {
                        id: 99003,
                        name: 'Mahasiswa. Data synthetic',
                        username: 'PRIVATE_USERNAME',
                        workspace: {
                            role: campus ? 'campus_admin' : 'student',
                            institution: fixture.institution,
                            recruiterOrganization: null,
                        },
                    },
                },
                shell: {
                    institutionMembership: {
                        institutionName: fixture.institution.name,
                        status: 'verified',
                    },
                },
            },
        });
        await context.route('**/*', async (route) => {
            const req = route.request(),
                url = new URL(req.url());

            if (url.hostname.includes('google')) {
                return route.abort();
            }

            if (url.origin !== qaOrigin) {
                return req.method() === 'GET'
                    ? route.fallback()
                    : route.abort();
            }

            if (url.pathname.includes('_boost/browser-logs')) {
                return route.fulfill({ status: 204 });
            }

            if (req.method() !== 'GET') {
                const body = req.postDataJSON();
                mutations.push({ path: url.pathname, body });

                if (delay) {
                    await new Promise((r) => setTimeout(r, delay));
                }

                if (failure === 'network') {
                    return route.abort('failed');
                }

                if (failure) {
                    return route.fulfill({
                        status: failure,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            message: 'Gangguan synthetic',
                            ...(failure === 422
                                ? {
                                      errors: {
                                          [campus ? 'reason' : 'explanation']: [
                                              'Isian perlu diperiksa.',
                                          ],
                                      },
                                  }
                                : {}),
                        }),
                    });
                }

                let item;

                if (url.pathname.endsWith('/transition')) {
                    item = fixture.requests.data[0];
                    item.revision++;
                    item.status =
                        {
                            offer: 'offered',
                            accept: 'accepted',
                            decline: 'declined',
                            withdraw: 'withdrawn',
                        }[body.action] || item.status;
                    item.events.push({
                        id: item.events.length + 1,
                        action: body.action,
                        reason: body.reason || null,
                        created_at: '2030-10-11T10:00:00Z',
                        opportunity:
                            body.action === 'offer'
                                ? {
                                      project_id: 99001,
                                      project_title: 'Desain bersama',
                                      role_title: 'Perancang',
                                  }
                                : null,
                    });

                    if (body.action === 'withdraw') {
                        item.permissions = {
                            review: false,
                            respond: false,
                            withdraw: false,
                        };
                    }
                } else {
                    item = {
                        ...structuredClone(fixture.requests.data[0]),
                        id: 99011,
                        need: body.need,
                        explanation: body.explanation,
                        status: 'requested',
                    };
                    fixture.requests.data.unshift(item);
                    fixture.requests.total++;
                }

                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: item }),
                });
            }

            if (
                !req.isNavigationRequest() &&
                !req.headers()['x-inertia'] &&
                req.headers()['accept']?.includes('application/json') &&
                url.pathname.includes('opportunity-support')
            ) {
                if (readFailure) {
                    return readFailure === 'network'
                        ? route.abort('failed')
                        : route.fulfill({
                              status: readFailure,
                              contentType: 'application/json',
                              body: '{}',
                          });
                }

                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(fixture),
                });
            }

            if (!req.isNavigationRequest() && !req.headers()['x-inertia']) {
                return route.fallback();
            }

            const data = payload(url);

            return req.headers()['x-inertia']
                ? route.fulfill({
                      status: 200,
                      contentType: 'application/json',
                      headers: { 'X-Inertia': 'true' },
                      body: JSON.stringify(data),
                  })
                : route.fulfill({
                      status: 200,
                      contentType: 'text/html',
                      body: template.replace(
                          tag,
                          (_, a, b, c) => a + JSON.stringify(data) + c,
                      ),
                  });
        });
        const page = await context.newPage();
        page.on('pageerror', (e) => exceptions.push(e.message));
        page.on('dialog', (d) => (confirmChoice ? d.accept() : d.dismiss()));
        page.setDefaultTimeout(15000);
        const button = (name) =>
            page.getByRole('button', { name, exact: true });
        async function load() {
            await page.goto(
                qaOrigin + '/institutions/99002/opportunity-support',
                { waitUntil: 'domcontentloaded' },
            );
            await page
                .getByRole('heading', {
                    name: campus
                        ? 'Tindak lanjut kesempatan'
                        : 'Bantuan kesempatan',
                    exact: true,
                })
                .waitFor();
        }
        async function choose() {
            await page
                .getByRole('button', { name: /Mencari peluang untuk pemula/ })
                .first()
                .click();
        }
        async function layout(name) {
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                name + ' tanpa overflow.',
            );
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.screenshot({
                path: path.join(artifacts, name + '.png'),
                fullPage: true,
            });
        }

        for (const roleName of ['student', 'campus']) {
            campus = roleName === 'campus';
            reset('offered');

            for (const width of [320, 768, 1280, 1920, 3440]) {
                await page.setViewportSize({ width, height: 900 });
                await load();
                await choose();
                await layout(roleName + '-' + width);
            }

            await page.setViewportSize({ width: 1280, height: 800 });
            await page.evaluate(() => {
                document.documentElement.style.zoom = '2';
            });
            await layout(roleName + '-zoom');
            await page.evaluate(() => {
                document.documentElement.style.zoom = '';
            });
        }

        campus = false;
        reset();
        fixture.enabled = fixture.can_create = false;
        fixture.notice = null;
        await load();
        check(
            (await page
                .getByRole('heading', { name: 'Bantuan belum diaktifkan' })
                .count()) === 1 &&
                (await button('Ajukan bantuan').count()) === 0,
            'Gate tertutup tidak menawarkan pengajuan.',
        );
        reset();
        fixture.requests.data = [];
        fixture.requests.total = 0;
        await load();
        check(
            (await page
                .getByText('Belum ada berkas pada halaman ini.', {
                    exact: false,
                })
                .count()) === 1,
            'Empty bukan loading.',
        );
        reset();
        await load();
        check(
            await button('Ajukan bantuan').isDisabled(),
            'Consent belum dipilih menonaktifkan pengajuan.',
        );
        await page
            .getByLabel('Penjelasan tambahan (opsional)')
            .fill('Draft pilihan saya.');
        await page.getByRole('checkbox').check();
        failure = 422;
        await button('Ajukan bantuan').click();
        await page.getByRole('alert').waitFor();
        check(
            (await page
                .getByLabel('Penjelasan tambahan (opsional)')
                .inputValue()) === 'Draft pilihan saya.' &&
                !(await page
                    .getByRole('status')
                    .innerText()
                    .then((x) => x.includes('tersimpan'))),
            '422 mempertahankan draft tanpa klaim sukses.',
        );
        await page.waitForFunction(
            () => document.activeElement?.getAttribute('role') === 'alert',
        );
        check(true, 'Ringkasan error menerima fokus.');
        failure = 'network';
        await button('Ajukan bantuan').click();
        await page
            .getByText('Hasil pengiriman belum dapat dipastikan.', {
                exact: false,
            })
            .waitFor();
        check(
            await button('Ajukan bantuan').isDisabled(),
            'Hasil belum pasti memblokir command.',
        );
        readFailure = 'network';
        await button('Periksa data terbaru').click();
        await page
            .getByText('Koneksi belum tersedia.', { exact: false })
            .waitFor();
        check(
            await button('Ajukan bantuan').isDisabled(),
            'GET gagal tidak membuka retry mutasi.',
        );
        readFailure = failure = null;
        await button('Periksa data terbaru').click();
        await page.waitForFunction(
            () => !document.querySelector('#support-explanation').disabled,
        );
        check(
            (await page
                .getByLabel('Penjelasan tambahan (opsional)')
                .inputValue()) === 'Draft pilihan saya.',
            'GET sukses mempertahankan draft.',
        );
        delay = 250;
        const before = mutations.length;
        await button('Ajukan bantuan').evaluate((el) => {
            el.click();
            el.click();
        });
        await page
            .getByText('Permintaan tersimpan.', { exact: false })
            .waitFor();
        check(
            mutations.length === before + 1 &&
                mutations.at(-1).body.command_key ===
                    mutations.at(-2).body.command_key,
            'Double click satu command, retry memakai command key yang sama.',
        );
        reset('offered');
        await load();
        await choose();
        await button('Terima tawaran').click();
        await page
            .getByRole('link', { name: 'Lihat peluang dan ajukan minat' })
            .waitFor();
        check(
            (
                await page
                    .getByRole('link', {
                        name: 'Lihat peluang dan ajukan minat',
                    })
                    .getAttribute('href')
            ).endsWith('/projects/99001'),
            'Penerimaan memberi tautan Wayfinder, bukan mutasi join.',
        );
        confirmChoice = false;
        const beforeWithdraw = mutations.length;
        await button('Cabut izin bantuan').click();
        check(
            mutations.length === beforeWithdraw,
            'Pembatalan pencabutan tidak mengirim command.',
        );
        confirmChoice = true;
        await button('Cabut izin bantuan').click();
        await page
            .getByText('Izin dicabut. Pembacaan kampus berikutnya', {
                exact: false,
            })
            .waitFor();
        check(
            (await button('Cabut izin bantuan').count()) === 0,
            'Pencabutan menghapus tindakan exposure.',
        );
        campus = true;
        reset();
        await load();
        await choose();
        await page.getByLabel('Peran yang ditawarkan').selectOption('99020');
        await page
            .getByLabel('Alasan atau catatan untuk mahasiswa')
            .fill('Minat sesuai peran pemula.');
        failure = 409;
        await button('Tawarkan peluang').click();
        await page.getByRole('alert').waitFor();
        check(
            (await page
                .getByLabel('Alasan atau catatan untuk mahasiswa')
                .inputValue()) === 'Minat sesuai peran pemula.',
            '409 tidak menimpa alasan peninjau.',
        );
        fixture.requests.data[0].revision = 2;
        failure = null;
        await button('Periksa data terbaru').click();
        await button('Gunakan data terbaru').waitFor();
        check(
            await button('Tawarkan peluang').isDisabled(),
            'Refresh tidak otomatis mengganti token keputusan.',
        );
        confirmChoice = false;
        await button('Gunakan data terbaru').click();
        check(
            (await page
                .getByLabel('Alasan atau catatan untuk mahasiswa')
                .inputValue()) === 'Minat sesuai peran pemula.',
            'Cancel penggunaan sumber terbaru menjaga draft.',
        );
        confirmChoice = true;
        await button('Gunakan data terbaru').click();
        await page.getByLabel('Peran yang ditawarkan').selectOption('99020');
        await page
            .getByLabel('Alasan atau catatan untuk mahasiswa')
            .fill('Alasan diperiksa ulang.');
        await button('Tawarkan peluang').click();
        await page
            .getByText('Keputusan tersimpan.', { exact: false })
            .waitFor();
        check(
            mutations.at(-1).body.expected_revision === 2,
            'Command setelah rekonsiliasi memakai revisi terbaru.',
        );
        await page
            .getByLabel('Alasan atau catatan untuk mahasiswa')
            .fill('Catatan belum disimpan.');
        fixture.requests.data = [];
        fixture.requests.total = 0;
        await button('Periksa data terbaru').click();
        await page
            .getByText('Berkas tidak tersedia pada hasil terbaru.', {
                exact: false,
            })
            .waitFor();
        check(
            (await page
                .getByText(
                    'Kebutuhan privat pilihan mahasiswa. Data synthetic.',
                    { exact: true },
                )
                .count()) === 0,
            'Pembacaan setelah revocation menyembunyikan snapshot lama.',
        );
        reset();
        fixture.journey.state = 'suppressed';
        fixture.journey.denominator = null;
        fixture.journey.metrics = [];
        await load();
        check(
            (await page
                .getByText('Angka disembunyikan', { exact: false })
                .count()) === 1,
            'Kelompok kecil tidak memperlihatkan angka agregat.',
        );
        await choose();
        readFailure = 403;
        await button('Periksa data terbaru').click();
        await page
            .getByRole('heading', { name: 'Akses tidak tersedia' })
            .waitFor();
        check(
            (await page
                .getByText(
                    'Kebutuhan privat pilihan mahasiswa. Data synthetic.',
                    { exact: true },
                )
                .count()) === 0,
            '403 menyembunyikan data privat sebelumnya.',
        );
        readFailure = null;
        await button('Periksa data terbaru').click();
        await page
            .getByRole('heading', { name: 'Permintaan yang diizinkan' })
            .waitFor();
        check(
            (await page
                .getByRole('heading', { name: 'Akses tidak tersedia' })
                .count()) === 0,
            'Pemulihan 403 hanya membuka data setelah GET sukses.',
        );
        reset();
        await load();
        await choose();
        check(
            await page
                .getByRole('heading', {
                    name: 'Mencari peluang untuk pemula',
                    exact: true,
                })
                .evaluate((el) => el === document.activeElement),
            'Memilih berkas memindahkan fokus ke detail.',
        );
        await page.setViewportSize({ width: 1280, height: 320 });
        await layout('campus-short');
        check(
            (await button('Tawarkan peluang').evaluate(
                (el) => getComputedStyle(el).cursor,
            )) === 'not-allowed',
            'Tindakan belum lengkap memakai cursor disabled.',
        );
        check(
            (await button('Periksa data terbaru').evaluate(
                (el) => getComputedStyle(el).transitionProperty,
            )) === 'none',
            'Reduced motion meniadakan transisi kontrol.',
        );
        fixture.journey.metrics[0].value = null;
        fixture.journey.metrics[0].state = 'suppressed';
        await load();
        check(
            (await page
                .getByText('Disembunyikan untuk privasi', { exact: true })
                .count()) === 1 &&
                (await page
                    .getByText('Belum dapat dihitung', { exact: true })
                    .count()) === 1,
            'Sel kecil berbeda dari metrik yang belum tersedia.',
        );
        campus = false;
        reset();
        await load();
        await page
            .getByLabel('Penjelasan tambahan (opsional)')
            .fill('Draft sebelum navigasi.');
        confirmChoice = false;
        await page
            .getByRole('link', { name: 'Jelajahi proyek', exact: true })
            .click();
        check(
            page.url().includes('opportunity-support') &&
                (await page
                    .getByLabel('Penjelasan tambahan (opsional)')
                    .inputValue()) === 'Draft sebelum navigasi.',
            'Pembatalan navigasi menjaga draft.',
        );
        confirmChoice = true;
        check(exceptions.length === 0, 'Tidak ada exception JavaScript.');
        console.log(
            'Selesai: ' +
                checks +
                ' pemeriksaan browser. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
