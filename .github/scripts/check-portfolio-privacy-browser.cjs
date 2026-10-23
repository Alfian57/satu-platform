const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://127.0.0.1:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
);
const artifacts = fs.mkdtempSync(
    path.join(os.tmpdir(), 'satu-portfolio-privacy-'),
);
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
    let profileVersion = 0,
        entryVersion = 0,
        failure = null,
        readFailure = false,
        delay = 0;
    let profileVisibility = 'private',
        entryVisibility = 'private',
        canManage = true;
    const commands = [],
        reads = [],
        errors = [];
    const token = (version) => String(version).padStart(64, 'a');
    const profile = () => ({
        id: 50,
        institution: { id: 99002, name: 'Universitas contoh. Data synthetic' },
        portfolio_visibility: profileVisibility,
        recruiter_discoverable: false,
        privacy_revision: token(profileVersion),
        updated_at: '2026-10-20T10:00:00Z',
    });
    const entry = () => ({
        id: 501,
        title: 'Karya individual. Data synthetic',
        summary:
            'Ringkasan karya untuk pengujian privasi, bukan bukti atau karya nyata.',
        verification_level: 'institution_verified',
        verification_label: 'Kontribusi tervalidasi',
        visibility: entryVisibility,
        status: entryVisibility === 'private' ? 'private' : 'published',
        privacy_revision: token(entryVersion),
        source: {
            type: 'approved_contribution',
            contribution_id: 200,
            version_id: 201,
            version_number: 1,
            status: 'approved',
        },
        published_at:
            entryVisibility === 'public' ? '2026-10-20T10:00:00Z' : null,
        withdrawn_at: null,
        updated_at: '2026-10-20T10:00:00Z',
    });
    function payload(url) {
        return {
            ...initial,
            component:
                url.pathname === '/portfolio/501'
                    ? 'portfolio/show'
                    : 'portfolio/index',
            url: url.pathname,
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
                            role: 'student',
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
                profile: profile(),
                entries: [entry()],
                entry: entry(),
                permissions: {
                    can_manage: canManage,
                    can_manage_profile: canManage,
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
            assert.equal(request.method(), 'PATCH');
            const isEntry =
                url.pathname ===
                '/student-profiles/50/portfolio/501/visibility';
            assert.ok(
                isEntry || url.pathname === '/student-profiles/50/visibility',
            );
            const body = request.postDataJSON();
            commands.push({ isEntry, body });

            if (delay) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            if (failure === 422) {
                return route.fulfill({
                    status: 422,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'Validasi gagal.',
                        errors: {
                            [isEntry ? 'visibility' : 'portfolio_visibility']: [
                                'Pilihan perlu diperiksa.',
                            ],
                        },
                    }),
                });
            }

            if (typeof failure === 'number') {
                return route.fulfill({ status: failure, body: '{}' });
            }

            assert.equal(
                body.expected_privacy_revision,
                token(isEntry ? entryVersion : profileVersion),
            );
            assert.ok(
                ['private', 'public'].includes(
                    body[isEntry ? 'visibility' : 'portfolio_visibility'],
                ),
            );

            if (isEntry) {
                entryVisibility = body.visibility;
                entryVersion++;
            } else {
                profileVisibility = body.portfolio_visibility;
                profileVersion++;
            }

            if (failure === 'network-committed') {
                return route.abort('failed');
            }

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: isEntry ? entry() : profile() }),
            });
        }

        if (url.pathname.startsWith('/student-profiles/')) {
            reads.push(url.pathname);

            if (readFailure) {
                return route.fulfill({ status: 500, body: '{}' });
            }

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: url.pathname.includes('/portfolio/')
                        ? entry()
                        : profile(),
                }),
            });
        }

        if (!['/portfolio', '/portfolio/501'].includes(url.pathname)) {
            return route.fallback();
        }

        const data = payload(url);

        return route.fulfill(
            request.headers()['x-inertia']
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
    const profileSelect = () =>
        page.locator('[data-test="portfolio-profile-visibility"]');
    const entrySelect = () =>
        page.locator('[data-test="portfolio-entry-501-visibility"]');
    const profileSave = () =>
        page.locator('[data-test="portfolio-profile-save"]');
    const entrySave = () =>
        page.locator('[data-test="portfolio-entry-501-visibility-save"]');
    async function openEntry() {
        await page
            .locator('[data-test="portfolio-entry-501-settings"] summary')
            .click();
    }

    try {
        await page.goto(qaOrigin + '/portfolio');
        await profileSelect().waitFor();
        await openEntry();
        check(
            JSON.stringify(
                await profileSelect().locator('option').allTextContents(),
            ) === JSON.stringify(['Hanya saya', 'Publik']),
            'Privasi profil hanya Hanya saya dan Publik.',
        );
        check(
            JSON.stringify(
                await entrySelect().locator('option').allTextContents(),
            ) === JSON.stringify(['Hanya saya', 'Publik']),
            'Privasi karya hanya Hanya saya dan Publik.',
        );
        check(
            (await page
                .locator('#portfolio-visibility-filter option')
                .count()) === 3,
            'Filter hanya memiliki Semua jangkauan dan dua pilihan privasi.',
        );

        for (const width of [320, 768, 1366, 1920, 3440]) {
            await page.setViewportSize({ width, height: 960 });
            check(
                (await page
                    .locator('[data-test="portfolio-action-bar"]')
                    .count()) === 1,
                'Portofolio: bilah tindakan mandiri tersedia pada ' + width + 'px.',
            );
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                'Formulir privasi reflow ' + width + '.',
            );
        }

        await page.setViewportSize({ width: 1280, height: 900 });
        await profileSelect().selectOption('public');
        check(
            profileVisibility === 'private' && commands.length === 0,
            'Mengubah pilihan tidak memublikasikan otomatis.',
        );
        delay = 400;
        await profileSave().click();
        check(
            (
                await page
                    .locator('[data-test="portfolio-profile-saved"]')
                    .innerText()
            ).includes('Hanya saya'),
            'Status tersimpan menunggu konfirmasi server.',
        );
        await page.locator('[data-test="portfolio-profile-success"]').waitFor();
        check(
            profileVisibility === 'public' &&
                commands[0].body.expected_privacy_revision === token(0),
            'Simpan profil membawa revisi aktual dan konfirmasi server.',
        );
        delay = 0;
        await entrySelect().selectOption('public');
        await entrySave().evaluate((button) => {
            button.click();
            button.click();
        });
        await page
            .locator('[data-test="portfolio-entry-501-success"]')
            .waitFor();
        check(
            commands.length === 2 && entryVisibility === 'public',
            'Klik ganda simpan karya hanya mengirim satu command.',
        );
        failure = 422;
        await entrySelect().selectOption('private');
        await entrySave().click();
        await page.locator('[data-test="portfolio-entry-501-error"]').waitFor();
        check(
            (await entrySelect().inputValue()) === 'private' &&
                entryVisibility === 'public' &&
                (await page
                    .locator('[data-test="portfolio-entry-501-error"]')
                    .evaluate((node) => node === document.activeElement)),
            'Validasi gagal mempertahankan pilihan dan memindahkan fokus ke error.',
        );
        failure = 'network-committed';
        await entrySave().click();
        await page
            .locator('[data-test="portfolio-entry-501-check-latest"]')
            .waitFor();
        check(
            entryVisibility === 'private' && (await entrySave().isDisabled()),
            'Respons jaringan hilang setelah commit menahan penyimpanan ulang.',
        );
        await page.setViewportSize({ width: 320, height: 900 });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Pesan pemulihan dan pilihan lokal reflow pada 320px.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'pemulihan-320.png'),
            fullPage: true,
        });
        await page.setViewportSize({ width: 1280, height: 900 });
        const beforeCheck = commands.length;
        readFailure = true;
        await page
            .locator('[data-test="portfolio-entry-501-check-latest"]')
            .click();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="portfolio-entry-501-check-latest"]',
                ).disabled,
        );
        check(
            (await entrySave().isDisabled()) && commands.length === beforeCheck,
            'GET gagal tidak membuka retry mutasi.',
        );
        readFailure = false;
        failure = null;
        await page
            .locator('[data-test="portfolio-entry-501-check-latest"]')
            .click();
        await page.locator('[data-test="portfolio-entry-501-stale"]').waitFor();
        check(
            commands.length === beforeCheck &&
                reads.length === 2 &&
                (await entrySelect().inputValue()) === 'private',
            'GET memulihkan status tanpa membuang pilihan lokal atau mengirim ulang command.',
        );
        await page
            .locator('[data-test="portfolio-entry-501-stale"]')
            .getByRole('button', { name: 'Gunakan pengaturan terbaru' })
            .click();
        check(
            !(await entrySave().isDisabled()),
            'Menggunakan sumber terbaru membuka konfirmasi eksplisit kembali.',
        );
        failure = 409;
        profileVersion++;
        await profileSelect().selectOption('private');
        await profileSave().click();
        await page
            .locator('[data-test="portfolio-profile-check-latest"]')
            .waitFor();
        check(
            await profileSave().isDisabled(),
            'Konflik dua tab profil menahan command berikutnya.',
        );
        failure = null;
        await page
            .locator('[data-test="portfolio-profile-check-latest"]')
            .click();
        await page.locator('[data-test="portfolio-profile-stale"]').waitFor();
        check(
            (await profileSelect().inputValue()) === 'private' &&
                profileVisibility === 'public',
            'Pemeriksaan profil mempertahankan pilihan lokal dan menampilkan state server berbeda.',
        );
        await page
            .locator('[data-test="portfolio-profile-stale"]')
            .getByRole('button', { name: 'Gunakan pengaturan terbaru' })
            .click();
        check(
            (await profileSelect().inputValue()) === 'public',
            'Gunakan pengaturan terbaru tidak menimpa status server dengan draft lama.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'privasi-portfolio.png'),
            fullPage: true,
        });
        failure = 403;
        await entrySave().click();
        await page.waitForFunction(
            () => !document.querySelector('[data-test="portfolio-row-501"]'),
        );
        check(
            (await profileSelect().count()) === 0,
            'Akses dicabut menyembunyikan karya dan pengaturan privat lama.',
        );
        failure = null;
        await page.goto(qaOrigin + '/portfolio/501');
        const detailSelect = page.locator(
            '[data-test="portfolio-detail-entry-501-visibility"]',
        );
        await detailSelect.waitFor();
        check(
            (await detailSelect.locator('option').count()) === 2 &&
                (await profileSelect().locator('option').count()) === 2,
            'Detail karya memakai dua pilihan yang sama dengan daftar.',
        );
        canManage = false;
        await page.goto(qaOrigin + '/portfolio/501');
        await page.locator('[data-test="portfolio-detail-root"]').waitFor();
        check(
            (await detailSelect.count()) === 0 &&
                (await profileSelect().count()) === 0,
            'Pembaca non-pemilik tidak mendapat kontrol privasi.',
        );
        await page.goto(qaOrigin + '/');
        const privacyPreview = page.getByRole('group', {
            name: 'Simulasi jangkauan karya',
        });
        check(
            (await privacyPreview.getByRole('button').count()) === 2,
            'Penjelasan landing selaras dengan dua pilihan privasi aktual.',
        );
        await privacyPreview
            .getByRole('button', { name: 'Publik', exact: true })
            .click();
        check(
            (await privacyPreview
                .getByRole('button', { name: 'Publik', exact: true })
                .getAttribute('aria-pressed')) === 'true',
            'Pratinjau publik tetap interaktif tanpa command akun.',
        );
        check(
            errors.length === 0,
            'Tidak ada exception JavaScript: ' + errors.join('; '),
        );
        console.log(
            checks +
                ' pemeriksaan browser privasi portofolio lulus. Semua command dicegat. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
