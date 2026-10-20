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
        mutations = [],
        graphRequests = [];

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
                /\/components\/(landing-demo|LandingDemoGraph|landing-collaboration-map)\./.test(
                    url.pathname,
                )
            ) {
                graphRequests.push(url.pathname);

                return route.abort();
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
                (await page
                    .locator('summary')
                    .filter({ hasText: 'Pelengkap: peta' })
                    .count()) === 0 &&
                    (await page.getByTestId('landing-demo-region').count()) ===
                        0,
                width +
                    'px: dropdown dan region peta pelengkap tidak tersedia.',
            );
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
            const journey = page.getByTestId('journey-demo');
            check(
                await journey.evaluate((element) => {
                    const navigation = element
                        .querySelector('.landing-journey-steps')
                        .getBoundingClientRect();
                    const scene = element
                        .querySelector('.landing-journey-scene')
                        .getBoundingClientRect();
                    const story = element
                        .querySelector('.journey-story')
                        .getBoundingClientRect();
                    const preview = element
                        .querySelector('.journey-preview-stage')
                        .getBoundingClientRect();

                    return (
                        (innerWidth >= 1280
                            ? navigation.right <= scene.left + 1
                            : navigation.bottom <= scene.top + 1) &&
                        (innerWidth >= 1024 || story.bottom <= preview.top) &&
                        element.querySelectorAll('form, input, select')
                            .length === 0 &&
                        [
                            ...element.querySelectorAll('.journey-scenario'),
                        ].every((button) =>
                            document
                                .getElementById(
                                    button.getAttribute('aria-describedby'),
                                )
                                ?.textContent.trim(),
                        )
                    );
                }),
                width +
                    'px: indeks dan cerita responsif, pilihan skenario mempunyai penjelasan, tanpa form palsu.',
            );

            for (const [stepIndex, id, label] of [
                [0, 'profile', 'Bekal awal'],
                [1, 'opportunity', 'Peluang pemula'],
                [2, 'application', 'Pengajuan'],
                [3, 'decision', 'Keputusan tim'],
                [4, 'task', 'Bekerja bersama'],
                [5, 'contribution', 'Kontribusi'],
                [6, 'recognition', 'Pengakuan'],
                [7, 'sharing', 'Kendali berbagi'],
            ]) {
                await journey
                    .getByRole('button', {
                        name: stepIndex + 1 + '. ' + label,
                        exact: true,
                    })
                    .click();
                await page.waitForFunction(
                    (stage) =>
                        document.querySelector('.journey-preview')?.dataset
                            .stage === stage,
                    id,
                );
                check(
                    await journey.evaluate((element) => {
                        const preview =
                            element.querySelector('.journey-preview');
                        const bounds = preview.getBoundingClientRect();
                        const facts = [
                            ...preview.querySelectorAll(
                                '.journey-facts dd, .journey-profile > div, .journey-application > p, .journey-team > div, .journey-evidence > div, .journey-review > div',
                            ),
                        ];

                        return (
                            document.documentElement.scrollWidth <=
                                innerWidth + 1 &&
                            element.querySelectorAll('[aria-current="step"]')
                                .length === 1 &&
                            facts.every((item) => {
                                const box = item.getBoundingClientRect();

                                return (
                                    item.scrollWidth <= item.clientWidth + 1 &&
                                    box.left >= bounds.left &&
                                    box.right <= bounds.right
                                );
                            })
                        );
                    }),
                    width +
                        'px: tahap ' +
                        (stepIndex + 1) +
                        ' mempunyai satu pilihan aktif dan teks pratinjau utuh.',
                );
            }

            await journey
                .getByRole('button', { name: 'Reset perjalanan' })
                .click();
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
        await page.setViewportSize({ width: 320, height: 640 });
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
            'Perjalanan tanpa exception JavaScript.',
        );
        check(
            graphRequests.length === 0,
            'Landing tidak meminta modul peta atau daftar hubungan pelengkap.',
        );
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await demo
            .getByRole('button', { name: '2. Peluang pemula', exact: true })
            .click();
        check(
            await page.locator('.journey-preview-sheet').evaluate((element) => {
                const style = getComputedStyle(element);

                return (
                    style.animationName === 'satu-journey-page' &&
                    style.animationDuration === '0.22s' &&
                    style.animationIterationCount === '1'
                );
            }),
            'Pratinjau berganti dengan fade singkat sekali, bukan animasi berulang.',
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        check(
            await page
                .locator('.journey-preview-sheet')
                .evaluate(
                    (element) =>
                        getComputedStyle(element).animationName === 'none',
                ),
            'Reduced motion meniadakan fade lembar pratinjau.',
        );
        console.log(
            checks + ' pemeriksaan browser lulus. Artefak: ' + artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
