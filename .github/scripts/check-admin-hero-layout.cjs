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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-admin-heroes-'));
const themes = [
    'overview',
    'students',
    'affiliations',
    'roster',
    'validation',
    'rankings',
    'support',
    'settings',
    'admins',
    'skills',
    'inclusion',
    'credits',
    'integrations',
    'account',
];
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}
(async () => {
    const root = path.resolve(__dirname, '../..');

    for (const [file, theme] of [
        ['campus/overview', 'overview'],
        ['university/students', 'students'],
        ['campus/affiliations', 'affiliations'],
        ['campus/roster-import', 'roster'],
        ['campus/contributions', 'validation'],
        ['campus/inclusion', 'inclusion'],
        ['campus/credit-mappings', 'credits'],
        ['campus/integrations', 'integrations'],
        ['university/settings', 'settings'],
        ['university/admins', 'admins'],
        ['platform/skills', 'skills'],
    ]) {
        const source = fs.readFileSync(
            path.join(root, 'resources/js/pages', file + '.tsx'),
            'utf8',
        );
        check(
            source.includes('theme="' + theme + '"') &&
                !source.includes('import Mascot from'),
            file + ': tema header eksplisit tanpa import maskot.',
        );
    }

    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const html = await (await fetch(qaOrigin + '/login')).text();
    const head = html
        .match(/<head>([\s\S]*?)<\/head>/)[1]
        .replace(
            /<script[^>]*src="[^"]*\/resources\/js\/(?:app|pages\/auth\/login)\.tsx[^"]*"[^>]*><\/script>/g,
            '',
        );
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.grantPermissions(['local-network-access'], {
        origin: qaOrigin,
    });
    const errors = [],
        commands = [];
    await context.route('**/*', async (route) => {
        const request = route.request(),
            url = new URL(request.url());

        if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
            return route.abort();
        }

        if (url.pathname.includes('_boost/browser-logs')) {
            return route.fulfill({ status: 204 });
        }

        if (url.pathname === '/__qa-admin-hero-preview') {
            return route.fulfill({
                contentType: 'text/html',
                body:
                    '<!doctype html><html lang="id"><head>' +
                    head +
                    '</head><body><div id="app"></div></body></html>',
            });
        }

        if (request.method() !== 'GET') {
            commands.push(url.pathname);

            return route.abort();
        }

        return route.fallback();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));

    try {
        await page.goto(qaOrigin + '/__qa-admin-hero-preview');
        const browserHash = JSON.parse(
            fs.readFileSync(
                path.join(root, 'node_modules/.vite/deps/_metadata.json'),
                'utf8',
            ),
        ).browserHash;
        await page.evaluate(async (browserHash) => {
            const viteScript = [...document.scripts].find((script) =>
                script.src.includes('/@vite/client'),
            );

            if (!viteScript) {
                throw new Error(
                    'Pemeriksaan komponen membutuhkan Vite dev yang sedang berjalan. Tidak menjalankan build.',
                );
            }

            const vite = new URL(viteScript.src).origin;
            const { default: React } = await import(
                vite + '/node_modules/.vite/deps/react.js?v=' + browserHash
            );
            const { createInertiaApp } = await import(
                vite +
                    '/node_modules/.vite/deps/@inertiajs_react.js?v=' +
                    browserHash
            );
            const { CampusOperationHeader } = await import(
                vite + '/resources/js/components/campus-operation-layout.tsx'
            );
            const { Settings2 } = await import(
                vite +
                    '/node_modules/.vite/deps/lucide-react.js?v=' +
                    browserHash
            );
            const { Button } = await import(
                vite + '/resources/js/components/ui/button.tsx'
            );
            document.getElementById('app').style.display = 'none';
            const target = document.createElement('main');
            target.id = 'admin-hero-preview';
            document.body.appendChild(target);
            function AdminHeroPreview() {
                const [state, setState] = React.useState({
                    theme: 'overview',
                    long: false,
                });
                window.renderAdminHero = (theme, long = false) =>
                    setState({ theme, long });
                const { theme, long } = state;
                target.style.padding = innerWidth < 640 ? '16px' : '32px';
                target.style.maxWidth = '1800px';
                target.style.margin = '0 auto';

                return React.createElement(
                    CampusOperationHeader,
                    {
                        theme,
                        icon: Settings2,
                        title: long
                            ? 'Judul operasional panjang. '.repeat(9)
                            : 'Judul operasional. Data synthetic',
                        description: long
                            ? 'Penjelasan operasional panjang untuk pengujian reflow. '.repeat(
                                  10,
                              )
                            : 'Ringkasan pekerjaan administratif dengan batas akses dan langkah berikutnya yang jelas. Data synthetic.',
                        institution: long
                            ? 'Nama universitas panjang. '.repeat(8)
                            : 'Universitas contoh. Data synthetic',
                        note: 'Catatan pengujian, bukan status keputusan.',
                    },
                    React.createElement(
                        Button,
                        { type: 'button', className: 'min-h-11' },
                        'Tindakan contoh',
                    ),
                );
            }
            await createInertiaApp({
                id: target.id,
                resolve: () => AdminHeroPreview,
                layout: () => null,
                progress: false,
                page: {
                    component: 'AdminHeroPreview',
                    props: { errors: {} },
                    url: '/__qa-admin-hero-preview',
                    version: null,
                    clearHistory: false,
                    encryptHistory: false,
                },
            });
        }, browserHash);
        await page
            .waitForFunction(
                () => typeof window.renderAdminHero === 'function',
                null,
                { timeout: 5000 },
            )
            .catch((error) => {
                console.error('Preview errors:', errors);

                throw error;
            });

        for (const width of [320, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 960 });

            for (const theme of themes) {
                await page.evaluate(
                    (theme) => window.renderAdminHero(theme),
                    theme,
                );
                await page
                    .locator('[data-campus-theme="' + theme + '"]')
                    .waitFor();
                check(
                    await page
                        .locator('.campus-operation-header')
                        .evaluate((header) => {
                            const motif = header.querySelector(
                                '.campus-header-backdrop',
                            );

                            return (
                                !header.querySelector('img, .satu-mascot') &&
                                header.querySelectorAll('h1').length === 1 &&
                                document.documentElement.scrollWidth <=
                                    innerWidth + 1 &&
                                motif.getAttribute('aria-hidden') === 'true' &&
                                getComputedStyle(motif).pointerEvents ===
                                    'none' &&
                                getComputedStyle(motif).animationName ===
                                    'none' &&
                                parseFloat(
                                    getComputedStyle(header.querySelector('h1'))
                                        .fontSize,
                                ) <= 30
                            );
                        }),
                    theme +
                        ': hero formal tanpa maskot atau overflow pada ' +
                        width +
                        'px.',
                );

                if (width === 1280) {
                    await page.screenshot({
                        path: path.join(artifacts, theme + '-1280.png'),
                    });
                }
            }
        }

        await page.setViewportSize({ width: 320, height: 568 });
        await page.evaluate(() => window.renderAdminHero('overview', true));
        await page
            .getByText('Catatan pengujian, bukan status keputusan.', {
                exact: true,
            })
            .waitFor();
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Nama, judul serta deskripsi panjang tetap reflow.',
        );
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(() => {
            window.renderAdminHero('settings');
            document.documentElement.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Zoom 200 persen tanpa overflow horizontal.',
        );
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });
        const button = page.getByRole('button', {
            name: 'Tindakan contoh',
            exact: true,
        });
        await button.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        check(
            await button.evaluate(
                (element) =>
                    element.matches(':focus-visible') &&
                    element.getBoundingClientRect().height >= 44 &&
                    getComputedStyle(element).cursor === 'pointer',
            ),
            'Aksi tetap 44px, fokus keyboard dan pointer.',
        );
        check(
            errors.length === 0 && commands.length === 0,
            'Tidak ada exception atau command backend selama pemeriksaan visual.',
        );
        console.log(
            checks + ' pemeriksaan komponen admin lulus. Artefak: ' + artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
