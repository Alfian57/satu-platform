const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
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
    path.join(os.tmpdir(), 'satu-confirm-password-'),
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
                'resources/images/mascot/confirm-access-mascot.provenance.json',
            ),
            'utf8',
        ),
    );
    check(
        provenance.transparent_sample_pixels > 0 &&
            provenance.prompt &&
            provenance.generation_id,
        'Maskot baru transparan dengan prompt dan provenance.',
    );

    for (const variant of provenance.variants) {
        const bytes = fs.readFileSync(path.join(root, variant.file));
        check(
            bytes.toString('ascii', 8, 12) === 'WEBP' &&
                nodeCrypto.createHash('sha256').update(bytes).digest('hex') ===
                    variant.sha256 &&
                bytes.length < 150000,
            'Varian WebP serta hash sesuai: ' + path.basename(variant.file),
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
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.grantPermissions(['local-network-access'], {
        origin: qaOrigin,
    });
    let role = 'student',
        failure = null,
        delay = 0,
        assetsFail = false;
    const commands = [],
        errors = [];
    function payload(url, formErrors = {}) {
        return {
            ...initial,
            component:
                url.pathname === '/user/confirm-password'
                    ? 'auth/confirm-password'
                    : 'settings/' + url.pathname.split('/').at(-1),
            url: url.pathname,
            deferredProps: undefined,
            props: {
                ...initial.props,
                errors: formErrors,
                onboarding: null,
                sidebarOpen: true,
                auth: {
                    user: {
                        id: 99003,
                        name: 'Pengguna. Data synthetic',
                        workspace: {
                            role,
                            institution: {
                                id: 99002,
                                name: 'Universitas contoh. Data synthetic',
                            },
                        },
                    },
                },
                shell: {
                    institutionMembership: {
                        institutionName: 'Universitas contoh. Data synthetic',
                        status: 'verified',
                    },
                },
                account: {
                    name: 'Pengguna. Data synthetic',
                    username: 'username_privat_synthetic',
                },
                passwordRules: 'minlength: 12;',
            },
        };
    }
    async function inertia(route, url, formErrors = {}) {
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'X-Inertia': 'true' },
            body: JSON.stringify(payload(url, formErrors)),
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
            /\/images\/(mascot-confirm-access|auth-entry-background)/.test(
                url.pathname,
            )
        ) {
            return route.fulfill({ status: 404 });
        }

        if (request.method() !== 'GET') {
            assert.ok(
                url.origin === qaOrigin &&
                    url.pathname === '/user/confirm-password' &&
                    request.method() === 'POST',
                'Unexpected command blocked.',
            );
            const body = request.postDataJSON();
            assert.deepEqual(Object.keys(body), ['password']);
            commands.push({ path: url.pathname, method: request.method() });

            if (delay) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            if (failure === 'network') {
                return route.abort('failed');
            }

            if (typeof failure === 'number') {
                return route.fulfill({ status: failure, body: '{}' });
            }

            if (failure === 'validation' || failure === 'long-validation') {
                return inertia(
                    route,
                    new URL(qaOrigin + '/user/confirm-password'),
                    {
                        password:
                            failure === 'long-validation'
                                ? 'Pesan validasi panjang. '.repeat(80)
                                : 'Password perlu diperiksa. Data synthetic.',
                    },
                );
            }

            return inertia(route, new URL(qaOrigin + '/settings/security'));
        }

        if (
            url.origin !== qaOrigin ||
            ![
                '/user/confirm-password',
                '/settings/security',
                '/settings/profile',
            ].includes(url.pathname)
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
    async function visit() {
        await page.goto(qaOrigin + '/user/confirm-password');
        await page.locator('[data-test="confirm-password-button"]').waitFor();
        await page.evaluate(() => scrollTo(0, 0));
    }
    const password = page.locator('#password'),
        submit = page.locator('[data-test="confirm-password-button"]');

    try {
        for (const workspace of ['student', 'campus_admin']) {
            role = workspace;

            for (const [width, height] of [
                [320, 640],
                [390, 844],
                [768, 900],
                [1280, 720],
                [1672, 941],
                [1920, 1080],
                [3440, 1440],
            ]) {
                await page.setViewportSize({ width, height });
                await visit();
                await page
                    .locator('[data-pose="confirm-access"] img')
                    .evaluate((img) => img.decode());
                const layout = await page.evaluate(() => {
                    const main = document
                        .querySelector('.auth-entry-main')
                        .getBoundingClientRect();
                    const header = document
                        .querySelector('.auth-entry-header')
                        .getBoundingClientRect();
                    const form = document
                        .querySelector('.auth-entry-form')
                        .getBoundingClientRect();
                    const intro = document
                        .querySelector('.auth-entry-intro')
                        .getBoundingClientRect();
                    const field = document.querySelector('#password');
                    const background = document.querySelector(
                        '.auth-entry-backdrop',
                    );

                    return {
                        fits:
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                        centered:
                            Math.abs(
                                (main.left + main.right) / 2 - innerWidth / 2,
                            ) < 2 &&
                            Math.min(form.top, intro.top) >= header.bottom - 1,
                        aligned:
                            innerWidth < 1024 ||
                            Math.abs(form.right - header.right) < 2,
                        field:
                            field.getBoundingClientRect().height >= 44 &&
                            parseFloat(getComputedStyle(field).fontSize) >= 16,
                        background:
                            background.getAttribute('src') ===
                                '/images/auth-entry-background.webp' &&
                            background.complete &&
                            background.naturalWidth === 1672 &&
                            background.alt === '',
                    };
                });
                check(
                    layout.fits && layout.centered && layout.aligned,
                    workspace +
                        ': terpusat tanpa overflow atau tabrakan header pada ' +
                        width +
                        'px.',
                );
                check(
                    layout.field && layout.background,
                    workspace +
                        ': background login/register dan field aksesibel pada ' +
                        width +
                        'px.',
                );

                if (
                    workspace === 'student' &&
                    [390, 1280, 1672].includes(width)
                ) {
                    await page.screenshot({
                        path: path.join(artifacts, 'confirm-' + width + '.png'),
                    });
                }
            }
        }

        check(
            commands.length === 0,
            'Membuka halaman tidak mengirim konfirmasi.',
        );
        role = 'student';
        await page.setViewportSize({ width: 1280, height: 800 });
        await visit();
        check(
            (await page
                .locator('[data-pose="confirm-access"] button')
                .count()) === 0,
            'Maskot dekoratif tanpa tombol sapaan.',
        );
        const image = page.locator('[data-pose="confirm-access"] img');
        const transform = await image.evaluate(
            (img) => getComputedStyle(img).transform,
        );
        await image.hover({ force: true });
        check(
            (await image.evaluate((img) => getComputedStyle(img).transform)) ===
                transform,
            'Maskot tidak berubah saat hover.',
        );
        const beforeStyle = await submit.evaluate((button) => {
            const style = getComputedStyle(button);

            return [
                style.backgroundImage,
                style.backgroundColor,
                style.transform,
                style.boxShadow,
            ];
        });
        await submit.hover();
        check(
            JSON.stringify(
                await submit.evaluate((button) => {
                    const style = getComputedStyle(button);

                    return [
                        style.backgroundImage,
                        style.backgroundColor,
                        style.transform,
                        style.boxShadow,
                    ];
                }),
            ) === JSON.stringify(beforeStyle),
            'Tombol konfirmasi tanpa perubahan hover.',
        );
        await password.fill('synthetic-current-password');
        await page
            .getByRole('button', { name: 'Tampilkan password', exact: true })
            .click();
        check(
            (await password.getAttribute('type')) === 'text',
            'Toggle password bekerja dan tetap bernama.',
        );
        await page
            .getByRole('button', { name: 'Sembunyikan password', exact: true })
            .click();
        failure = 'validation';
        await submit.click();
        await page.locator('#confirm-password-error-summary').waitFor();
        check(
            (await password.inputValue()) === '' &&
                (await password.getAttribute('aria-invalid')) === 'true',
            'Password gagal validasi dikosongkan dengan error terkait.',
        );
        check(
            (await page.evaluate(() => document.activeElement.id)) ===
                'confirm-password-error-summary',
            'Error summary menerima fokus.',
        );
        failure = 'network';
        await page.waitForFunction(
            () =>
                !document.querySelector('[data-test="confirm-password-button"]')
                    .disabled,
        );
        await password.fill('synthetic-current-password');
        await submit.click();
        await page
            .getByText('Konfirmasi belum dapat dipastikan.', {
                exact: true,
            })
            .waitFor({ timeout: 8000 })
            .catch(async (error) => {
                console.error('Network diagnostic', {
                    commandCount: commands.length,
                    buttonDisabled: await submit.isDisabled(),
                    passwordLength: (await password.inputValue()).length,
                    errors,
                    alerts: await page.getByRole('alert').allTextContents(),
                });

                throw error;
            });
        check(
            new URL(page.url()).pathname === '/user/confirm-password',
            'Gangguan jaringan tidak mengklaim konfirmasi berhasil.',
        );

        for (const status of [419, 429]) {
            failure = status;
            await password.fill('synthetic-current-password');
            await submit.click();
            await page
                .getByText(
                    status === 419
                        ? 'Sesi atau akses konfirmasi tidak tersedia. Muat ulang halaman, lalu masuk kembali jika diminta.'
                        : 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba kembali.',
                    { exact: true },
                )
                .waitFor();
            check(
                new URL(page.url()).pathname === '/user/confirm-password',
                'Pemulihan HTTP ' + status + ' tanpa redirect sukses palsu.',
            );
        }

        failure = 'long-validation';
        await page.setViewportSize({ width: 320, height: 568 });
        await password.fill('synthetic-current-password');
        await submit.click();
        await page.waitForFunction(
            () => document.querySelector('#password').value === '',
        );
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Pesan panjang tetap reflow pada mobile pendek.',
        );
        await submit.scrollIntoViewIfNeeded();
        check(
            await submit.isVisible(),
            'Tombol akhir dapat dicapai pada layar pendek.',
        );
        failure = null;
        delay = 500;
        await password.fill('synthetic-current-password');
        await submit.click();
        await page.waitForFunction(
            () =>
                document.querySelector('[data-test="confirm-password-button"]')
                    .disabled,
        );
        check(
            (await password.isDisabled()) &&
                (await page.locator('[aria-busy="true"]').count()) === 1,
            'Processing menonaktifkan input dan submit.',
        );
        await page.waitForURL('**/settings/security');
        check(
            await page
                .getByRole('heading', {
                    name: 'Perbarui password',
                    exact: true,
                })
                .isVisible(),
            'Respons sukses synthetic melanjutkan ke tujuan server.',
        );
        delay = 0;
        await visit();
        const beforeReturn = commands.length;
        await page
            .getByRole('link', {
                name: 'Kembali ke pengaturan akun',
                exact: true,
            })
            .click();
        await page.waitForURL('**/settings/profile');
        check(
            commands.length === beforeReturn,
            'Kembali ke Pengaturan akun tidak mengirim konfirmasi.',
        );
        await page.setViewportSize({ width: 1280, height: 900 });
        await visit();
        await page.evaluate(() => {
            document.documentElement.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Pembesaran 200 persen tanpa overflow horizontal.',
        );
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });
        assetsFail = true;
        await visit();
        check(
            (await password.isVisible()) && (await submit.isVisible()),
            'Gambar gagal tidak menghalangi form.',
        );
        check(
            (await page.locator('main').count()) === 1 && errors.length === 0,
            'Satu main dan tidak ada error JavaScript.',
        );
        check(
            commands.every(
                (command) => command.path === '/user/confirm-password',
            ),
            'Seluruh command dicegat. Tidak mengubah akun atau sesi nyata.',
        );
        console.log('PASS ' + checks + ' pemeriksaan. Artefak: ' + artifacts);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
