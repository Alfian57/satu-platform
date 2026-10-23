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
    path.join(os.tmpdir(), 'satu-account-settings-'),
);
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}

(async () => {
    const root = path.resolve(__dirname, '../..');
    const provenance = JSON.parse(
        fs.readFileSync(
            path.join(
                root,
                'resources/images/mascot/settings-hero.provenance.json',
            ),
            'utf8',
        ),
    );
    check(
        provenance.assets[0].transparent_sample_pixels > 0,
        'Master maskot mempunyai alpha transparan.',
    );

    for (const asset of provenance.assets) {
        check(
            asset.variants.every((variant) => {
                const bytes = fs.readFileSync(path.join(root, variant.file));

                return (
                    bytes.toString('ascii', 8, 12) === 'WEBP' &&
                    bytes.length < 150000
                );
            }),
            'Varian WebP responsif teroptimasi: ' +
                path.basename(asset.source.file),
        );
    }

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
    const context = await browser.newContext({
        reducedMotion: 'reduce',
        viewport: { width: 1280, height: 900 },
    });
    await context.grantPermissions(['local-network-access'], {
        origin: qaOrigin,
    });
    let role = 'student',
        failure = null,
        delay = 0,
        assetsFail = false;
    let account = {
        name: 'Mahasiswa contoh. Data synthetic',
        username: 'contoh_pribadi',
    };
    const commands = [],
        errors = [];
    function payload(url, formErrors = {}, flashToast = null) {
        return {
            ...initial,
            component: 'settings/' + url.pathname.split('/').at(-1),
            url: url.pathname,
            deferredProps: undefined,
            props: {
                ...initial.props,
                errors: formErrors,
                onboarding: null,
                sidebarOpen: true,
                flash: flashToast ? { toast: flashToast } : {},
                auth: {
                    user: {
                        id: 99003,
                        name: 'Pengguna contoh. Data synthetic',
                        workspace: {
                            role,
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
                account,
                passwordRules: 'minlength: 12;',
                summary: { consents: [] },
                status: null,
            },
        };
    }
    async function inertia(route, url, formErrors = {}, flashToast = null) {
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'X-Inertia': 'true' },
            body: JSON.stringify(payload(url, formErrors, flashToast)),
        });
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

        if (
            assetsFail &&
            /\/images\/(mascot-account-care|student-hero-settings)/.test(
                url.pathname,
            )
        ) {
            return route.fulfill({ status: 404 });
        }

        if (request.method() !== 'GET') {
            assert.ok(url.origin === qaOrigin, 'No external mutation.');
            const expected = {
                '/settings/profile': ['PATCH', 'DELETE'],
                '/settings/password': ['PUT'],
                '/account/data-rights/export': ['POST'],
                '/account/data-rights/correction': ['POST'],
                '/account/data-rights/restriction': ['POST'],
                '/account/data-rights/withdrawal': ['POST'],
            };
            assert.ok(
                expected[url.pathname]?.includes(request.method()),
                'Unexpected mutation blocked: ' + url.pathname,
            );
            commands.push({
                method: request.method(),
                path: url.pathname,
                body: request.postDataJSON(),
            });

            if (delay) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            if (failure === 'network') {
                return route.abort('failed');
            }

            if (typeof failure === 'number') {
                return route.fulfill({ status: failure, body: '{}' });
            }

            const current = new URL(page.url());

            if (failure === 'validation') {
                return inertia(
                    route,
                    current,
                    url.pathname === '/settings/password'
                        ? {
                              password:
                                  'Gunakan password yang memenuhi aturan. Data synthetic.',
                          }
                        : {
                              username:
                                  'Nama pengguna perlu diperiksa. Data synthetic.',
                          },
                );
            }

            if (url.pathname === '/account/data-rights/export') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ account: 'Data synthetic' }),
                });
            }

            assert.notEqual(
                request.method(),
                'DELETE',
                'Penghapusan hanya diuji sampai batal atau gagal.',
            );

            if (url.pathname === '/settings/profile') {
                account = request.postDataJSON();

                return inertia(route, current, {}, {
                    type: 'success',
                    message: 'Profil berhasil diperbarui.',
                });
            }

            if (url.pathname === '/settings/password') {
                return inertia(route, current, {}, {
                    type: 'success',
                    message: 'Password berhasil diperbarui.',
                });
            }

            return inertia(route, current);
        }

        if (
            url.origin !== qaOrigin ||
            !/^\/settings\/(profile|security|data-rights)$/.test(
                url.pathname,
            )
        ) {
            return route.fallback();
        }

        if (request.headers()['x-inertia']) {
            return inertia(route, url);
        }

        return route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: template.replace(
                tag,
                (_, start, raw, end) =>
                    start +
                    JSON.stringify(payload(url)).replace(/</g, '\\u003c') +
                    end,
            ),
        });
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const nav = page.locator('[data-test="settings-navigation"]');
    async function visit(section) {
        await page.goto(qaOrigin + '/settings/' + section);
        await page.locator('[data-test="settings-header"]').waitFor();
    }
    async function noOverflow() {
        return page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        );
    }

    try {
        for (const workspace of ['student', 'campus_admin']) {
            role = workspace;

            for (const width of [320, 390, 768, 1280, 1920, 3440]) {
                await page.setViewportSize({ width, height: 900 });
                await visit('profile');
                const hero = page.locator('[data-test="settings-header"]');

                if (workspace === 'student') {
                    const mascot = page.locator(
                        '[data-pose="account-care"] img',
                    );
                    await mascot.evaluate((img) => img.decode());
                    const box = await mascot.boundingBox(),
                        navBox = await nav.boundingBox();
                    check(
                        (await noOverflow()) &&
                            box.x >= 0 &&
                            box.x + box.width <= width + 1 &&
                            box.y + box.height <= navBox.y,
                        'student: maskot existing tetap tanpa overflow pada ' +
                            width +
                            'px.',
                    );
                } else {
                    check(
                        (await noOverflow()) &&
                            (await hero.getAttribute('data-campus-theme')) ===
                                'account' &&
                            (await hero
                                .locator('.satu-mascot, img')
                                .count()) === 0,
                        'campus_admin: hero akun formal tanpa maskot pada ' +
                            width +
                            'px.',
                    );
                }

                const heroBox = await hero.boundingBox();
                check(
                    (await nav.locator('a').count()) === 4 &&
                        (await nav.locator('[aria-current="page"]').count()) ===
                            1 &&
                        (await page.locator('main').count()) === 1 &&
                        heroBox.width > 0,
                    workspace +
                        ': empat kategori, satu pilihan aktif dan satu main pada ' +
                        width +
                        'px.',
                );

                if (
                    workspace === 'student' &&
                    [390, 1280, 1920].includes(width)
                ) {
                    await page.screenshot({
                        path: path.join(artifacts, 'profile-' + width + '.png'),
                    });
                }

                check(
                    await nav
                        .locator('a')
                        .evaluateAll((links) =>
                            links.every(
                                (link) =>
                                    link.getBoundingClientRect().height >= 44 &&
                                    getComputedStyle(link).cursor === 'pointer',
                            ),
                        ),
                    workspace +
                        ': target kategori cukup besar dan cursor pointer pada ' +
                        width +
                        'px.',
                );
            }
        }

        role = 'student';
        await page.setViewportSize({ width: 1440, height: 1000 });
        await visit('profile');
        check(
            !(
                await page.locator('[data-test="settings-header"]').innerText()
            ).includes('contoh_pribadi'),
            'Username privat tidak muncul dalam hero.',
        );

        for (const section of [
            'security',
            'data-rights',
            'profile',
        ]) {
            const link = nav.locator(
                '[data-test="settings-nav-' + section + '"]',
            );
            await link.focus();
            await page.keyboard.press('Enter');
            await page.waitForURL('**/settings/' + section);
            check(
                (await link.getAttribute('aria-current')) === 'page' &&
                    (await link.innerText()).includes('Aktif'),
                'Navigasi keyboard dan indikator aktif: ' + section,
            );
        }

        check(
            await page
                .locator('[data-pose="account-care"] img')
                .evaluate(
                    (img) => getComputedStyle(img).animationName === 'none',
                ),
            'Reduced motion menampilkan maskot statis.',
        );
        await nav.locator('a').first().focus();
        await page.keyboard.press('Tab');
        check(
            await page.evaluate(() => {
                const active = document.activeElement;

                return (
                    active?.matches('[data-test="settings-navigation"] a') &&
                    parseFloat(getComputedStyle(active).outlineWidth) >= 2
                );
            }),
            'Navigasi keyboard memiliki fokus yang terlihat.',
        );
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await visit('profile');
        const mascotImage = page.locator('[data-pose="account-care"] img');
        await mascotImage.evaluate((img) =>
            Promise.all(
                img.getAnimations().map((animation) => animation.finished),
            ),
        );
        const restingTransform = await mascotImage.evaluate(
            (img) => getComputedStyle(img).transform,
        );
        await mascotImage.hover({ force: true });
        check(
            (await mascotImage.evaluate(
                (img) => getComputedStyle(img).transform,
            )) === restingTransform,
            'Maskot tidak bergerak atau mengecil saat disentuh cursor.',
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const name = page.locator('#name'),
            username = page.locator('#username'),
            save = page.locator('[data-test="update-profile-button"]');
        await name.fill('Nama baru. Data synthetic');
        check(
            await page
                .getByText('Ada perubahan yang belum disimpan.', {
                    exact: true,
                })
                .isVisible(),
            'Perubahan identitas belum disimpan dijelaskan.',
        );
        failure = 'validation';
        await save.click();
        await page
            .locator('#username[aria-invalid="true"]')
            .waitFor();
        check(
            (await name.inputValue()) === 'Nama baru. Data synthetic' &&
                (await username.getAttribute('aria-invalid')) === 'true',
            'Validasi menjaga draft dan menghubungkan error field.',
        );
        check(
            (await page.evaluate(() => document.activeElement.id)) ===
                'username',
            'Kolom input yang bermasalah menerima fokus.',
        );
        failure = null;
        delay = 500;
        await save.click();
        await page.waitForFunction(
            () =>
                document.querySelector('[data-test="update-profile-button"]')
                    .disabled,
        );
        check(
            (await name.isDisabled()) &&
                (await page.locator('form[aria-busy="true"]').count()) === 1,
            'Processing mencegah pengiriman ganda dan memiliki aria-busy.',
        );
        await page.locator('[data-sonner-toast][data-type="success"]').waitFor();
        check(
            await page
                .getByText('Profil berhasil diperbarui.', {
                    exact: true,
                })
                .isVisible(),
            'Sukses profil hanya sesudah respons server synthetic.',
        );
        delay = 0;
        failure = 'network';
        await name.fill('Draft tetap ada. Data synthetic');
        await save.click();
        await page
            .locator('[data-test="profile-settings-error-summary"]')
            .waitFor();
        check(
            (await name.inputValue()) === 'Draft tetap ada. Data synthetic',
            'Gangguan jaringan tidak menghapus draft profil.',
        );
        failure = 403;
        await save.click();
        await page
            .getByText(
                'Sesi atau akses perubahan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.',
                { exact: true },
            )
            .waitFor();
        check(
            (await page
                .locator('[data-sonner-toast][data-type="success"]')
                .count()) === 0,
            'Akses ditolak tidak menampilkan sukses.',
        );

        failure = null;
        await visit('security');
        async function fillPasswords() {
            await page
                .locator('#current_password')
                .fill('current-synthetic-password');
            await page.locator('#password').fill('new-synthetic-password');
            await page
                .locator('#password_confirmation')
                .fill('new-synthetic-password');
        }
        await fillPasswords();
        await page.locator('button[aria-controls="password"]').click();
        check(
            (await page.locator('#password').getAttribute('type')) === 'text' &&
                (await page
                    .locator('button[aria-controls="password"]')
                    .getAttribute('aria-pressed')) === 'true',
            'Tampil/sembunyi password tetap bekerja.',
        );
        failure = 'validation';
        await page.locator('[data-test="update-password-button"]').click();
        await page
            .locator('#password[aria-invalid="true"]')
            .waitFor();
        check(
            (await page.locator('#password').inputValue()) === '' &&
                (await page.locator('#current_password').inputValue()) === '',
            'Password dikosongkan setelah validasi gagal.',
        );
        failure = 429;
        await fillPasswords();
        await page.locator('[data-test="update-password-button"]').click();
        await page
            .getByText(
                'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.',
                { exact: true },
            )
            .waitFor();
        check(
            (await page
                .locator('[data-sonner-toast][data-type="success"]')
                .count()) === 0,
            'Batas percobaan tampil tanpa sukses palsu.',
        );
        failure = null;
        await page.locator('[data-test="update-password-button"]').click();
        await page.locator('[data-sonner-toast][data-type="success"]').waitFor();
        check(
            (await page.locator('#password').inputValue()) === '' &&
                (await page.locator('#password_confirmation').inputValue()) ===
                    '',
            'Password dikosongkan sesudah respons sukses synthetic.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'security-desktop.png'),
            fullPage: true,
        });

        await visit('profile');
        const before = commands.length;
        await page.locator('[data-test="delete-user-button"]').click();
        await page
            .locator('#delete-account-password')
            .fill('synthetic-password');
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        check(
            commands.length === before,
            'Membuka dan membatalkan dialog tidak menghapus akun.',
        );
        await page.locator('[data-test="delete-user-button"]').click();
        check(
            (await page.locator('#delete-account-password').inputValue()) ===
                '',
            'Batal membersihkan password dialog hapus.',
        );
        await page.keyboard.press('Escape');
        const download = page.waitForEvent('download');
        await page.locator('[data-test="export-user-data-button"]').click();
        check(
            (await download).suggestedFilename().endsWith('.json'),
            'Ekspor arsip tetap menghasilkan unduhan JSON synthetic.',
        );

        await visit('data-rights');
        const withdrawal = page.getByRole('button', {
            name: 'Tarik persetujuan ketentuan layanan',
            exact: true,
        });
        await withdrawal.click();
        check(
            commands.length === before &&
                (await page
                    .getByRole('button', {
                        name: 'Konfirmasi penarikan',
                        exact: true,
                    })
                    .isVisible()),
            'Penarikan persetujuan membutuhkan konfirmasi eksplisit.',
        );
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        const correction = page.getByRole('button', {
            name: 'Ajukan koreksi data',
            exact: true,
        });
        await correction.click();
        await page
            .locator('#data-rights-reason')
            .fill('Koreksi contoh. Data synthetic');
        failure = 'network';
        await page
            .getByRole('button', { name: 'Kirim permintaan', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Periksa status', exact: true })
            .waitFor();
        check(
            (await page.locator('#data-rights-reason').inputValue()) ===
                'Koreksi contoh. Data synthetic',
            'Hak Data menahan retry command dan menjaga alasan saat respons belum pasti.',
        );
        failure = null;
        await page
            .getByRole('button', { name: 'Periksa status', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Kirim permintaan', exact: true })
            .waitFor();
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        await page.screenshot({
            path: path.join(artifacts, 'data-rights-desktop.png'),
            fullPage: true,
        });

        for (const section of ['security', 'data-rights']) {
            await page.setViewportSize({ width: 320, height: 700 });
            await visit(section);
            check(
                await noOverflow(),
                section + ': isi tetap reflow pada 320px.',
            );
        }

        await page.setViewportSize({ width: 1280, height: 900 });
        await visit('profile');
        await page.evaluate(() => {
            document.documentElement.style.zoom = '2';
        });
        check(
            await noOverflow(),
            'Reflow Pengaturan akun pada pembesaran 200 persen.',
        );
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });
        assetsFail = true;
        await visit('security');
        check(
            (await page
                .locator('[data-test="update-password-button"]')
                .isVisible()) && (await nav.isVisible()),
            'Gambar gagal tidak menghalangi navigasi atau form.',
        );
        check(
            errors.length === 0,
            'Tidak ada error JavaScript di seluruh skenario.',
        );
        check(
            commands.every((command) => command.method !== 'DELETE'),
            'Seluruh command dicegat, tidak ada penghapusan atau perubahan akun nyata.',
        );
        console.log('PASS ' + checks + ' pemeriksaan. Artefak: ' + artifacts);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
