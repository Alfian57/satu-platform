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
const artifacts = fs.mkdtempSync(
    path.join(os.tmpdir(), 'satu-integration-ui-'),
);
const date = '2026-10-11T10:00:00Z';
let checks = 0;
let phoneVisible = true;
let createFailure = null;
const errors = [],
    mutations = [];
function check(condition, label) {
    assert.ok(condition, label);
    checks++;
    console.log('PASS ' + label);
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
    function payload(url) {
        const campus = url.pathname.includes('/campus/');
        const recruiter = url.pathname.includes('/recruiter/');
        let component = 'settings/data-rights';
        const props = {
            ...initial.props,
            onboarding: null,
            errors: {},
            sidebarOpen: true,
            auth: {
                user: {
                    id: 99003,
                    name: 'Pengguna. Data synthetic',
                    created_at: date,
                    updated_at: date,
                    workspace: {
                        role: campus
                            ? 'campus_admin'
                            : recruiter
                              ? 'recruiter'
                              : 'student',
                        institution: { id: 99002, name: 'Kampus synthetic' },
                        recruiterOrganization: recruiter
                            ? { id: 99004, name: 'Organisasi synthetic' }
                            : null,
                    },
                },
            },
            shell: {
                institutionMembership: {
                    institutionName: 'Kampus synthetic',
                    status: 'verified',
                },
            },
            account: {
                name: 'Pengguna. Data synthetic',
                username: 'private_synthetic',
            },
            summary: { consents: [] },
            status: null,
        };

        if (campus) {
            component = 'campus/integrations';
            Object.assign(props, {
                institution: { id: 99002, name: 'Kampus synthetic' },
                connections: [],
                forbidden: false,
                syncs: {
                    data: [],
                    links: [],
                    meta: {
                        current_page: 1,
                        last_page: 1,
                        per_page: 25,
                        total: 0,
                    },
                },
                filters: {
                    status: '',
                    connection: 0,
                    status_options: [],
                    connection_options: [],
                },
            });
        } else if (url.pathname.includes('contact-requests')) {
            component = 'talent/contact-requests';
            Object.assign(props, {
                entitlement: { has_entitlement: true },
                requests: [
                    {
                        id: 99010,
                        purpose: 'Kolaborasi synthetic',
                        message: null,
                        status: 'accepted',
                        created_at: date,
                        expires_at: date,
                        responded_at: date,
                        candidate_name: 'Kandidat synthetic',
                        candidate_headline: 'Karya synthetic',
                        candidate_phone: phoneVisible ? '+6281200000099' : null,
                    },
                ],
            });
        } else if (recruiter) {
            component = 'talent/candidate-detail';
            Object.assign(props, {
                candidate: {
                    id: 99010,
                    headline: 'Karya synthetic',
                    bio: null,
                    skills: [],
                    badges: [],
                    contributions: [],
                    availability_status: 'available',
                    verified_at: null,
                    institution_name: 'Kampus synthetic',
                    phone: phoneVisible ? '+6281200000099' : null,
                },
                isSaved: false,
                contactConsequenceNotice:
                    'Kontak hanya tersedia dengan persetujuan.',
            });
        }

        if (url.pathname.endsWith('/profile')) {
            component = 'settings/profile';
        }

        return {
            ...initial,
            component,
            props,
            url: url.pathname,
            deferredProps: undefined,
        };
    }
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );

    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
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
                return request.method() === 'GET'
                    ? route.fallback()
                    : route.abort();
            }

            if (request.method() !== 'GET') {
                mutations.push({
                    path: url.pathname,
                    body: request.postDataJSON(),
                });

                if (url.pathname.endsWith('/export')) {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            user: { name: 'Data synthetic' },
                        }),
                    });
                }

                if (createFailure === 'network') {
                    return route.abort('failed');
                }

                const validationUrl = new URL(
                    url.pathname.includes('/campus/')
                        ? '/campus/99002/integrations'
                        : '/settings/data-rights',
                    qaOrigin,
                );
                const validationPage = payload(validationUrl);
                validationPage.props.errors = url.pathname.includes('/campus/')
                    ? { provider_key: 'Kunci penyedia perlu diperiksa.' }
                    : { reason: 'Alasan perlu diperiksa.' };

                return route.fulfill({
                    status: 200,
                    headers: { 'X-Inertia': 'true' },
                    contentType: 'application/json',
                    body: JSON.stringify(validationPage),
                });
            }

            if (
                ['image', 'font', 'stylesheet', 'script'].includes(
                    request.resourceType(),
                )
            ) {
                return route.fallback();
            }

            const data = payload(url);

            if (request.headers()['x-inertia']) {
                return route.fulfill({
                    status: 200,
                    headers: { 'X-Inertia': 'true' },
                    contentType: 'application/json',
                    body: JSON.stringify(data),
                });
            }

            return route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: template.replace(
                    tag,
                    '$1' + JSON.stringify(data).replace(/</g, '\\u003c') + '$3',
                ),
            });
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        const paths = [
            '/settings/data-rights',
            '/campus/99002/integrations',
            '/recruiter/talent/candidates/99010',
            '/recruiter/talent/contact-requests',
            '/settings/profile',
        ];

        for (const url of paths) {
            await page.goto(qaOrigin + url);
            await page.locator('main').waitFor();
            check(
                (await page.locator('main').count()) === 1,
                url + ' mempunyai satu main',
            );

            if (url.includes('/settings/')) {
                check(
                    (await page
                        .locator('[data-test="settings-header"]')
                        .count()) === 1,
                    'Pengaturan tidak membungkus layout dua kali.',
                );
            }

            for (const width of [320, 768, 1280, 1920, 3440]) {
                await page.setViewportSize({ width, height: 900 });
                check(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            window.innerWidth + 1,
                    ),
                    url + ' reflow ' + width,
                );
            }

            await page.setViewportSize({ width: 640, height: 450 });
            await page.evaluate(
                () => (document.documentElement.style.zoom = '2'),
            );
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth + 1,
                ),
                url + ' zoom 200 persen',
            );
            await page.evaluate(
                () => (document.documentElement.style.zoom = '1'),
            );
            await page.screenshot({
                path: path.join(artifacts, url.replace(/\W/g, '-') + '.png'),
                fullPage: true,
            });
        }

        await page.goto(qaOrigin + paths[0]);
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Ekspor data akun' }).click();
        const download = await downloadEvent;
        check(
            download.suggestedFilename().endsWith('.json'),
            'Ekspor menghasilkan unduhan JSON, bukan error respons Inertia.',
        );
        await page.getByRole('button', { name: 'Ajukan koreksi data' }).click();
        await page
            .getByLabel('Keterangan dan alasan')
            .fill('Koreksi synthetic');
        await page.getByRole('button', { name: 'Kirim permintaan' }).click();
        await page.getByText('Alasan perlu diperiksa.').waitFor();
        check(
            (await page.getByLabel('Keterangan dan alasan').inputValue()) ===
                'Koreksi synthetic',
            'Validasi Hak Data mempertahankan draft.',
        );
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        await page.goto(qaOrigin + paths[1]);
        await page
            .getByRole('button', { name: /Buat Koneksi Sandbox/i })
            .click();
        await page.getByRole('textbox').fill('synthetic_provider');
        await page.getByRole('button', { name: 'Simpan koneksi' }).click();
        await page.getByText('Kunci penyedia perlu diperiksa.').waitFor();
        check(
            (await page.getByRole('textbox').inputValue()) ===
                'synthetic_provider',
            'Validasi koneksi mempertahankan kunci penyedia.',
        );
        createFailure = 'network';
        await page.getByRole('button', { name: 'Simpan koneksi' }).click();
        await page
            .getByText(/Hasil request belum dapat dikonfirmasi/)
            .first()
            .waitFor();
        check(
            (await page.getByRole('textbox').inputValue()) ===
                'synthetic_provider',
            'Jaringan gagal tidak mengklaim koneksi berhasil.',
        );

        for (const url of paths.slice(2, 4)) {
            await page.goto(qaOrigin + url);
            check(
                (await page
                    .getByRole('link', { name: 'Hubungi via WhatsApp' })
                    .getAttribute('href')) === 'https://wa.me/6281200000099',
                'Handoff memakai nomor synthetic yang dikirim server.',
            );
            phoneVisible = false;
            await page.reload();
            check(
                (await page
                    .getByRole('link', { name: 'Hubungi via WhatsApp' })
                    .count()) === 0,
                'Kontak tidak tampil setelah server menarik handoff.',
            );
            phoneVisible = true;
        }

        check(
            errors.length === 0,
            'Tidak ada exception JavaScript: ' + errors.join(', '),
        );
        check(
            mutations.length > 0 &&
                mutations.every((item) => !item.path.includes('/delete')),
            'Semua mutasi synthetic dicegat. Tidak ada penghapusan akun nyata.',
        );
        console.log(
            checks + ' pemeriksaan UI integrasi lulus. Artefak: ' + artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
