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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-t10-browser-'));
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
    initial.props.auth = { user: null };
    const documentHtml = html.replace(
        tag,
        '$1' + JSON.stringify(initial).replace(/</g, '\\u003c') + '$3',
    );
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const exceptions = [],
        mutations = [];
    let mapState = 'ready',
        releaseLoading;

    try {
        const context = await browser.newContext({
            reducedMotion: 'reduce',
            timezoneId: 'Asia/Bangkok',
        });
        await context.grantPermissions(['local-network-access'], {
            origin: qaOrigin,
        });
        await context.route('**/*', async (route) => {
            const req = route.request(),
                url = new URL(req.url());

            if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
                return route.abort();
            }

            if (url.pathname.includes('_boost/browser-logs')) {
                return route.fulfill({ status: 204 });
            }

            if (req.method() !== 'GET') {
                mutations.push(url.pathname);

                return route.fulfill({
                    status: 403,
                    body: 'Mutasi diblokir untuk QA synthetic.',
                });
            }

            if (
                url.pathname.includes(
                    '/resources/js/components/LandingDemoGraph.tsx',
                )
            ) {
                if (mapState === 'error') {
                    return route.abort();
                }

                if (mapState === 'loading') {
                    await new Promise((resolve) => {
                        releaseLoading = resolve;
                    });
                }
            }

            if (url.origin === qaOrigin && url.pathname === '/') {
                return route.fulfill({
                    contentType: 'text/html',
                    body: documentHtml,
                });
            }

            return route.fallback();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => exceptions.push(error.message));

        for (const width of [320, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(qaOrigin);
            await page.getByTestId('journey-demo').waitFor();
            await page.getByTestId('journey-demo').scrollIntoViewIfNeeded();
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                width + 'px: landing tanpa overflow horizontal.',
            );
            const sizes = await page
                .getByTestId('journey-demo')
                .getByRole('button')
                .evaluateAll((buttons) =>
                    buttons.map((button) => ({
                        height: button.getBoundingClientRect().height,
                        cursor: getComputedStyle(button).cursor,
                        disabled: button.disabled,
                    })),
                );
            check(
                sizes.every(
                    (size) =>
                        size.height >= 44 &&
                        size.cursor ===
                            (size.disabled ? 'not-allowed' : 'pointer'),
                ),
                width + 'px: target dan cursor sesuai keadaan.',
            );
            await page.screenshot({
                path: path.join(artifacts, 'journey-' + width + '.png'),
                animations: 'disabled',
                timeout: 45000,
            });
        }

        const demo = page.getByTestId('journey-demo');
        const heading = page.getByTestId('journey-step-heading');
        const next = demo.getByRole('button', {
            name: 'Berikutnya',
            exact: true,
        });
        await demo.getByRole('button', { name: 'Reset perjalanan' }).click();
        check(
            await heading.evaluate(
                (element) => element === document.activeElement,
            ),
            'Reset mengembalikan tahap awal dan fokus judul.',
        );
        check(
            await demo
                .getByRole('button', { name: 'Sebelumnya', exact: true })
                .isDisabled(),
            'Tahap awal tidak dapat mundur.',
        );

        for (let index = 1; index < 8; index++) {
            await next.click();
            check(
                await heading.evaluate(
                    (element) => element === document.activeElement,
                ),
                'Tahap ' + (index + 1) + ': fokus mengikuti penjelasan.',
            );
        }

        check(
            (await next.isDisabled()) &&
                (await demo.innerText()).includes(
                    'Tidak membuktikan manfaat pilot',
                ),
            'Tahap terakhir berhenti tanpa klaim dampak.',
        );
        await demo
            .getByRole('button', { name: 'Kapasitas penuh', exact: true })
            .click();
        check(
            (await demo.innerText()).includes(
                'pengajuan Budi tetap menunggu',
            ) && (await next.isDisabled()),
            'Skenario penuh berhenti sebelum workspace.',
        );
        check(
            await demo
                .getByRole('button', {
                    name: '5. Bekerja bersama',
                    exact: true,
                })
                .isDisabled(),
            'Keadaan penuh tidak membuka tahap kerja palsu.',
        );
        await demo
            .getByRole('button', { name: 'Perlu revisi', exact: true })
            .click();
        check(
            (await demo.innerText()).includes(
                'Belum dihasilkan oleh keputusan revisi',
            ),
            'Revisi tidak diklaim menghasilkan karya.',
        );
        await next.click();
        check(
            (await demo.innerText()).includes(
                'versi baru, bukan dari keputusan revisi',
            ),
            'Kelanjutan revisi memerlukan keputusan baru.',
        );
        await demo.getByRole('button', { name: 'Reset perjalanan' }).click();
        await heading.evaluate((element) => element.focus());
        await page.waitForFunction(
            () =>
                document.activeElement?.getAttribute('data-testid') ===
                'journey-step-heading',
        );
        await page.waitForTimeout(30);
        await demo
            .getByRole('button', { name: '2. Peluang pemula', exact: true })
            .focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() =>
            document
                .querySelector('[data-testid="journey-step-heading"]')
                ?.textContent.includes('bukan ditebak'),
        );
        check(
            (await heading.innerText()).includes('bukan ditebak'),
            'Tahap dapat dipilih dengan keyboard.',
        );
        check(
            await heading.evaluate(
                (element) => getComputedStyle(element).outlineStyle !== 'none',
            ),
            'Fokus programatik terlihat.',
        );
        check(
            await next.evaluate(
                (element) =>
                    getComputedStyle(element).transitionProperty === 'none',
            ),
            'Reduced motion meniadakan transisi.',
        );
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.evaluate(() => {
            document.body.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Zoom 200% tetap reflow.',
        );
        await page.evaluate(() => {
            document.body.style.zoom = '';
        });
        await page.setViewportSize({ width: 320, height: 320 });
        await demo.getByRole('button', { name: 'Reset perjalanan' }).click();
        await next.click();
        const focusBox = await heading.boundingBox();
        check(
            focusBox.y >= 80 && focusBox.y + focusBox.height <= 320,
            'Layar pendek: penjelasan yang menerima fokus tidak tertutup header.',
        );
        await page.setViewportSize({ width: 1280, height: 800 });
        const disclosure = page
            .locator('summary')
            .filter({ hasText: 'Pelengkap: peta' });
        await disclosure.click();
        await page
            .getByRole('tab', { name: 'Daftar hubungan', exact: true })
            .click();
        check(
            await page.locator('#demo').getByRole('table').isVisible(),
            'Peta pelengkap memiliki tabel hubungan setara.',
        );
        await page.setViewportSize({ width: 320, height: 640 });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Tabel pelengkap tidak meluapkan halaman mobile.',
        );
        await context.setOffline(true);
        await demo.getByRole('button', { name: 'Reset perjalanan' }).click();
        check(
            (await heading.innerText()).includes('Tetap bisa mulai'),
            'Demo lokal dapat direset ketika offline.',
        );
        await context.setOffline(false);
        check(
            mutations.length === 0,
            'Interaksi demo tidak mengirim mutasi backend.',
        );
        check(
            exceptions.length === 0,
            'Perjalanan dan peta tanpa exception JavaScript.',
        );

        const errorPage = await context.newPage();
        mapState = 'error';
        await errorPage.goto(qaOrigin);
        await errorPage
            .locator('summary')
            .filter({ hasText: 'Pelengkap: peta' })
            .click();
        await errorPage
            .getByRole('heading', { name: 'Demo belum dapat dimuat.' })
            .waitFor();
        check(
            await errorPage.getByTestId('journey-demo').isVisible(),
            'Modul peta gagal tidak menghilangkan perjalanan utama.',
        );
        check(
            await errorPage
                .getByRole('button', {
                    name: 'Muat ulang halaman',
                    exact: true,
                })
                .isVisible(),
            'Kegagalan peta menyediakan pemulihan.',
        );
        await errorPage.close();

        mapState = 'loading';
        const loadingPage = await context.newPage();
        await loadingPage.goto(qaOrigin);
        await loadingPage
            .locator('summary')
            .filter({ hasText: 'Pelengkap: peta' })
            .click();
        await loadingPage.locator('[aria-busy="true"]').waitFor();
        check(
            await loadingPage.getByTestId('journey-demo').isVisible(),
            'Loading peta mempertahankan perjalanan dan CTA utama.',
        );
        mapState = 'ready';
        releaseLoading?.();
        await loadingPage
            .getByRole('tab', { name: 'Peta kolaborasi', exact: true })
            .waitFor();
        check(
            (await loadingPage.locator('[aria-busy="true"]').count()) === 0,
            'Loading berganti menjadi peta aktual.',
        );
        await loadingPage.close();
        console.log(
            checks + ' pemeriksaan browser lulus. Artefak: ' + artifacts,
        );
    } finally {
        releaseLoading?.();
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
