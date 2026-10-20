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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-landing-ui-'));
let count = 0;
const check = (value, message) => {
    assert.ok(value, message);
    count++;
    console.log('PASS ' + message);
};

(async () => {
    console.log('Artefak: ' + artifacts);
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const errors = [],
        mutations = [];

    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        await context.grantPermissions(['local-network-access'], {
            origin: qaOrigin,
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

            if (request.method() !== 'GET') {
                mutations.push(url.pathname);

                return route.abort();
            }

            return route.continue();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        const heroArtworkIsUnclipped = () =>
            page.locator('.landing-bird-figure img').evaluate((halo) => {
                const box = halo.getBoundingClientRect();

                if (box.left < 0 || box.right > innerWidth) {
                    return false;
                }

                for (
                    let parent = halo.parentElement;
                    parent;
                    parent = parent.parentElement
                ) {
                    const style = getComputedStyle(parent);
                    const bounds = parent.getBoundingClientRect();
                    const clips = (overflow) =>
                        ['hidden', 'clip', 'auto', 'scroll'].includes(overflow);

                    if (
                        clips(style.overflowX) &&
                        (box.left < bounds.left - 1 ||
                            box.right > bounds.right + 1)
                    ) {
                        return false;
                    }

                    if (
                        clips(style.overflowY) &&
                        (box.top < bounds.top - 1 ||
                            box.bottom > bounds.bottom + 1)
                    ) {
                        return false;
                    }
                }

                return (
                    getComputedStyle(halo.parentElement).overflow === 'visible'
                );
            });

        const heroControlsDoNotOverlap = () =>
            page.locator('.landing-feature-list').evaluate((scene) => {
                const controls = [
                    ...scene.querySelectorAll('.landing-feature-link'),
                ].filter(
                    (element) => element.getBoundingClientRect().width > 0,
                );

                return controls.every((element, index) => {
                    const box = element.getBoundingClientRect();

                    return controls.slice(index + 1).every((other) => {
                        const target = other.getBoundingClientRect();

                        return (
                            box.right <= target.left + 1 ||
                            box.left >= target.right - 1 ||
                            box.bottom <= target.top + 1 ||
                            box.top >= target.bottom - 1
                        );
                    });
                });
            });
        const figurePosition = () =>
            page.locator('.landing-bird-figure').evaluate((element) => {
                const box = element.getBoundingClientRect();

                return {
                    x: box.x + scrollX,
                    y: box.y + scrollY,
                    width: box.width,
                    height: box.height,
                };
            });

        for (const width of [
            320, 390, 768, 1024, 1280, 1536, 1920, 2560, 3440,
        ]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(qaOrigin);
            await page.getByTestId('landing-mascot').waitFor();
            await page.evaluate(() => document.fonts.ready);
            await page
                .locator('.landing-hero-backdrop')
                .evaluate((image) => image.decode());
            await page
                .locator('.landing-bird-figure img')
                .evaluate((img) => img.decode());
            await page.screenshot({
                path: path.join(artifacts, 'hero-' + width + '.png'),
            });

            if (width === 1280 || width === 390) {
                await page.screenshot({
                    path: path.join(artifacts, 'page-' + width + '.png'),
                    fullPage: true,
                });
            }

            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                width + ': reflow halaman.',
            );
            check(
                (await page.locator('h1').count()) === 1,
                width + ': satu judul utama.',
            );

            if (await page.locator('.landing-header-links').isVisible()) {
                check(
                    await page
                        .locator('.landing-header-links')
                        .evaluate((nav) => {
                            const indicator = nav.querySelector(
                                '.landing-nav-indicator',
                            );
                            const selected = nav.querySelector(
                                '[aria-current="location"]',
                            );
                            const marker = indicator.getBoundingClientRect();
                            const link = selected.getBoundingClientRect();

                            return (
                                Math.abs(marker.left - link.left) < 1 &&
                                Math.abs(marker.width - link.width) < 1 &&
                                Math.abs(marker.top - link.top) < 1 &&
                                marker.height === link.height &&
                                indicator.getAttribute('aria-hidden') ===
                                    'true' &&
                                getComputedStyle(indicator).pointerEvents ===
                                    'none' &&
                                getComputedStyle(indicator)
                                    .transitionProperty === 'none'
                            );
                        }),
                    width +
                        ': pil sesuai menu aktif, dekoratif dan tanpa animasi pada reduced motion.',
                );
            }

            check(
                (await page
                    .getByRole('group', { name: 'Kenali fitur SATU' })
                    .getByRole('button')
                    .count()) === 3,
                width + ': tiga pilihan penjelasan fitur.',
            );
            check(
                await heroControlsDoNotOverlap(),
                width + ': kartu konsep tidak saling menutupi.',
            );
            check(
                await page
                    .locator('.landing-bird-figure img')
                    .evaluate((img) => img.complete && img.naturalWidth > 0),
                width + ': maskot termuat.',
            );
            check(
                await page
                    .locator('.landing-hero-backdrop')
                    .evaluate(
                        (image) => image.complete && image.naturalWidth > 0,
                    ),
                width + ': latar referensi termuat sebagai gambar.',
            );
            check(
                await page.locator('.landing-benefits').evaluate((benefits) => {
                    const hero = document.querySelector('.landing-intro');
                    const image = document.querySelector(
                        '.landing-hero-backdrop',
                    );
                    const imageStyle = getComputedStyle(image);
                    const ambient = getComputedStyle(benefits, '::before');
                    const transparent = 'rgba(0, 0, 0, 0)';

                    return (
                        Math.abs(
                            hero.getBoundingClientRect().bottom -
                                benefits.getBoundingClientRect().top,
                        ) < 1 &&
                        getComputedStyle(hero).backgroundColor ===
                            transparent &&
                        getComputedStyle(benefits).backgroundColor ===
                            transparent &&
                        imageStyle.maskImage.includes(transparent + ' 100%') &&
                        imageStyle.pointerEvents === 'none' &&
                        ambient.maskImage.startsWith(
                            'linear-gradient(' + transparent,
                        ) &&
                        ambient.maskImage.endsWith(transparent + ')') &&
                        ambient.backgroundImage.includes('radial-gradient') &&
                        ambient.position === 'absolute' &&
                        ambient.zIndex === '-1' &&
                        ambient.pointerEvents === 'none'
                    );
                }),
                width +
                    ': latar hero dan Cara kerja tersambung dengan gradasi tanpa celah atau lapisan penghalang.',
            );
            check(
                await heroArtworkIsUnclipped(),
                width + ': ilustrasi hero tidak dipotong wadah.',
            );
            check(
                await page
                    .locator('.landing-hero-emphasis')
                    .evaluate((title) => {
                        const underline = getComputedStyle(title, '::after');
                        const demoIcon = document.querySelector(
                            '.landing-hero-actions .landing-control > svg',
                        );
                        const primary = document.querySelector(
                            '.landing-hero-actions .landing-primary',
                        );

                        return (
                            underline.borderTopColor === 'rgb(255, 184, 92)' &&
                            getComputedStyle(title).color ===
                                'rgb(23, 100, 232)' &&
                            getComputedStyle(demoIcon).color ===
                                'rgb(154, 81, 15)' &&
                            getComputedStyle(primary).backgroundColor ===
                                'rgb(23, 100, 232)'
                        );
                    }),
                width +
                    ': aksen jingga hangat melengkapi judul dan CTA utama yang tetap biru.',
            );
            check(
                await page
                    .locator('.landing-bird-portrait')
                    .evaluate((portrait) => {
                        const ambient = getComputedStyle(portrait, '::before');

                        return (
                            ambient.backgroundImage.includes(
                                'radial-gradient',
                            ) &&
                            ambient.backgroundImage.includes('255, 184, 92') &&
                            ambient.zIndex === '-1' &&
                            ambient.pointerEvents === 'none' &&
                            ambient.animationName === 'none'
                        );
                    }),
                width +
                    ': cahaya hangat berada di belakang maskot, statis dan tidak menangkap input.',
            );
            check(
                (await page
                    .getByRole('button', { name: 'Sapa maskot SATU' })
                    .count()) === 0,
                width + ': tombol Sapa aku dihapus.',
            );
            check(
                await page
                    .locator('#cara-kerja')
                    .evaluate(
                        (element) =>
                            element.getBoundingClientRect().top >=
                            innerHeight - 1,
                    ),
                width + ': section berikutnya tidak muncul di viewport awal.',
            );
            const trigger = page.getByTestId('landing-mascot-topic-project');
            const initialFigure = await figurePosition();
            await trigger.click();
            const explanation = page.getByRole('dialog');
            check(
                await explanation.isVisible(),
                width + ': penjelasan dapat dibuka.',
            );
            check(
                await explanation
                    .getByRole('heading', {
                        name: 'Temukan proyek',
                        exact: true,
                    })
                    .isVisible(),
                width + ': dialog mempunyai judul sesuai topik.',
            );
            check(
                await explanation.evaluate((element) => {
                    const box = element.getBoundingClientRect();

                    return (
                        box.left >= 0 &&
                        box.right <= innerWidth &&
                        box.top >= 0 &&
                        box.bottom <= innerHeight
                    );
                }),
                width + ': dialog tidak meluap dari layar.',
            );
            await page.screenshot({
                path: path.join(artifacts, 'explanation-' + width + '.png'),
            });
            await explanation
                .getByRole('button', { name: 'Tutup', exact: true })
                .focus();
            await page.keyboard.press('Tab');
            check(
                await explanation.evaluate((element) =>
                    element.contains(document.activeElement),
                ),
                width + ': fokus keyboard tetap di dalam dialog.',
            );
            await explanation
                .getByRole('button', { name: 'Mengerti', exact: true })
                .click();
            await explanation.waitFor({ state: 'hidden' });
            check(
                await trigger.evaluate((el) => el === document.activeElement),
                width + ': menutup penjelasan memulihkan fokus.',
            );

            for (const [topic, title] of [
                ['project', 'Temukan proyek'],
                ['team', 'Berkarya bersama'],
                ['portfolio', 'Susun portofolio'],
            ]) {
                const control = page.getByTestId(
                    'landing-mascot-topic-' + topic,
                );
                check(
                    await control.evaluate(
                        (element) =>
                            element.getBoundingClientRect().height >= 44 &&
                            getComputedStyle(element).cursor === 'pointer',
                    ),
                    width +
                        ': target fitur ' +
                        topic +
                        ' minimal 44px dan berkursor pointer.',
                );
                await control.focus();
                await page.keyboard.press(topic === 'team' ? 'Space' : 'Enter');
                check(
                    await explanation
                        .getByRole('heading', { name: title, exact: true })
                        .isVisible(),
                    width +
                        ': fitur ' +
                        topic +
                        ' dapat dibuka lewat keyboard.',
                );
                const currentFigure = await figurePosition();
                check(
                    ['x', 'y', 'width', 'height'].every(
                        (key) =>
                            Math.abs(currentFigure[key] - initialFigure[key]) <
                            0.5,
                    ),
                    width +
                        ': maskot tidak bergerak atau mengecil pada ' +
                        topic +
                        '.',
                );
                await page.keyboard.press('Escape');
                await explanation.waitFor({ state: 'hidden' });
                check(
                    await control.evaluate(
                        (element) => element === document.activeElement,
                    ),
                    width +
                        ': Escape mengembalikan fokus ke fitur ' +
                        topic +
                        '.',
                );
            }

            await page
                .getByRole('tab', { name: 'Admin Universitas', exact: true })
                .click();
            check(
                (await page.locator('#role-panel').innerText()).includes(
                    'Berikan keputusan beralasan',
                ),
                width + ': peran mengubah penjelasan.',
            );
            check(
                await page.locator('#role-panel').evaluate((panel) => {
                    const bounds = panel.getBoundingClientRect();

                    return (
                        Math.abs(panel.scrollHeight - panel.clientHeight) <=
                            1 &&
                        [...panel.querySelectorAll('h3, li, a')].every(
                            (element) => {
                                const box = element.getBoundingClientRect();

                                return (
                                    box.top >= bounds.top &&
                                    box.bottom <= bounds.bottom
                                );
                            },
                        )
                    );
                }),
                width + ': panel peran mengikuti isi tanpa teks terpotong.',
            );
            check(
                (await page.locator('.landing-role-step').count()) === 3,
                width + ': peran admin menjelaskan tiga langkah nyata.',
            );
            check(
                await page.locator('.landing-lower').evaluate((lower) => {
                    const style = getComputedStyle(lower);
                    const ambient = getComputedStyle(lower, '::before');

                    return (
                        style.backgroundImage.includes('linear-gradient') &&
                        ambient.pointerEvents === 'none' &&
                        ['#peran', '#privasi', '#pertanyaan'].every(
                            (selector) =>
                                getComputedStyle(lower.querySelector(selector))
                                    .backgroundColor === 'rgba(0, 0, 0, 0)',
                        )
                    );
                }),
                width + ': bagian bawah berbagi latar tanpa panel pemutus.',
            );
            check(
                await page.evaluate(() =>
                    [
                        ...document.querySelectorAll(
                            '.landing-lower button, .landing-lower a, .landing-lower summary, .landing-footer a',
                        ),
                    ]
                        .filter((element) => element.getClientRects().length)
                        .every((element) => {
                            const box = element.getBoundingClientRect();

                            return (
                                box.height >= 44 &&
                                box.left >= -1 &&
                                box.right <= innerWidth + 1 &&
                                getComputedStyle(element).cursor === 'pointer'
                            );
                        }),
                ),
                width + ': kontrol bagian bawah minimal 44px dan tidak meluap.',
            );

            for (const label of ['Publik', 'Hanya saya']) {
                const choice = page
                    .getByRole('group', { name: 'Simulasi jangkauan karya' })
                    .getByRole('button', { name: label, exact: true });
                await choice.focus();
                await page.keyboard.press('Enter');
                check(
                    (await choice.getAttribute('aria-pressed')) === 'true' &&
                        (await page
                            .locator('.landing-folio-audience')
                            .innerText()) === label &&
                        (await page
                            .locator('.landing-visibility-result')
                            .getAttribute('aria-live')) === 'polite',
                    width +
                        ': jangkauan ' +
                        label +
                        ' menyelaraskan kontrol, label, dan status.',
                );
            }

            for (const summary of await page
                .locator('#pertanyaan summary')
                .all()) {
                await summary.focus();
                await page.keyboard.press('Enter');
                const open = await summary.evaluate(
                    (element) => element.parentElement.open,
                );
                const answerFits = await summary.evaluate((element) => {
                    const answer = element.parentElement.querySelector('p');
                    const box = answer.getBoundingClientRect();

                    return (
                        box.width > 0 &&
                        box.left >= 0 &&
                        box.right <= innerWidth + 1
                    );
                });
                await page.keyboard.press('Enter');
                check(
                    open &&
                        answerFits &&
                        (await summary.evaluate(
                            (element) => !element.parentElement.open,
                        )),
                    width +
                        ': FAQ ' +
                        (await summary.innerText()).trim() +
                        ' terbuka dan tertutup lewat keyboard.',
                );
            }

            if (width >= 1024) {
                check(
                    await page
                        .locator('.landing-closing-stage')
                        .evaluate((stage) => {
                            const greeting = stage
                                .querySelector('.landing-closing-greeting')
                                .getBoundingClientRect();
                            const mascot = stage
                                .querySelector('.landing-closing-mascot')
                                .getBoundingClientRect();
                            const bounds = stage.getBoundingClientRect();

                            return (
                                greeting.bottom <= mascot.top &&
                                mascot.left >= bounds.left - 1 &&
                                mascot.right <= bounds.right + 1
                            );
                        }),
                    width + ': sapaan penutup tidak menutupi maskot.',
                );
            }

            if ([390, 1280, 2560].includes(width)) {
                for (const id of ['peran', 'privasi', 'pertanyaan']) {
                    await page.locator('#' + id).screenshot({
                        path: path.join(artifacts, id + '-' + width + '.png'),
                        style: '.landing-header { visibility: hidden !important; }',
                    });
                }
            }

            await page.locator('.landing-footer-back').click();
            await page.waitForFunction(() => scrollY <= 1);
            check(
                new URL(page.url()).hash === '#top',
                width +
                    ': kembali ke atas dapat diklik tanpa dihalangi watermark.',
            );
        }

        for (const [width, height] of [
            [1280, 720],
            [1366, 768],
            [1440, 900],
            [1536, 864],
            [1536, 776],
            [1920, 800],
            [1920, 970],
        ]) {
            await page.setViewportSize({ width, height });
            await page.goto(qaOrigin);
            await page
                .locator('.landing-bird-figure img')
                .evaluate((image) => image.decode());
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({
                path: path.join(
                    artifacts,
                    'laptop-' + width + '-' + height + '.png',
                ),
            });
            const bottom = await page
                .locator('.landing-intro')
                .evaluate((element) => element.getBoundingClientRect().bottom);
            check(
                bottom <= height + 1,
                width +
                    'x' +
                    height +
                    ': seluruh hero terlihat tanpa gulir (' +
                    Math.round(bottom) +
                    'px).',
            );
            check(
                await page
                    .locator('#cara-kerja')
                    .evaluate(
                        (element) =>
                            element.getBoundingClientRect().top >=
                            innerHeight - 1,
                    ),
                width +
                    'x' +
                    height +
                    ': manfaat belum terlihat pada layar pertama.',
            );
            check(
                await page.locator('.landing-intro').evaluate((hero) => {
                    const headerBottom = document
                        .querySelector('.landing-header')
                        .getBoundingClientRect().bottom;

                    return [
                        ...hero.querySelectorAll(
                            'h1, .landing-hero-actions a, .landing-bird-figure, .landing-feature-link, .landing-hero-scroll',
                        ),
                    ].every((element) => {
                        const box = element.getBoundingClientRect();

                        return (
                            box.top >= headerBottom &&
                            box.bottom <= innerHeight &&
                            box.left >= 0 &&
                            box.right <= innerWidth
                        );
                    });
                }),
                width +
                    'x' +
                    height +
                    ': judul, aksi, burung dan petunjuk gulir terlihat utuh.',
            );
            await page.getByTestId('landing-mascot-topic-project').click();
            check(
                await page
                    .getByRole('dialog')
                    .evaluate(
                        (element) =>
                            element.getBoundingClientRect().bottom <=
                            innerHeight,
                    ),
                width + 'x' + height + ': penjelasan tetap di dalam layar.',
            );
            await page.keyboard.press('Escape');
        }

        await page.locator('.landing-hero-scroll').click();
        check(
            await page.locator('#benefits-heading').evaluate((element) => {
                const box = element.getBoundingClientRect();

                return (
                    box.top >=
                        document
                            .querySelector('.landing-header')
                            .getBoundingClientRect().bottom &&
                    box.top < innerHeight
                );
            }),
            'Petunjuk gulir membawa pengguna ke manfaat tanpa tertutup navbar.',
        );

        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(qaOrigin);
        const primaryNavigation = page.getByRole('navigation', {
            name: 'Navigasi landing',
            exact: true,
        });
        const waitForActiveSection = (href) =>
            page.waitForFunction((expected) => {
                const readingLine =
                    document
                        .querySelector('.landing-header')
                        .getBoundingClientRect().bottom + 24;
                const visibleSection = [
                    '#top',
                    '#cara-kerja',
                    '#demo',
                    '#peran',
                    '#pertanyaan',
                ].findLast((selector) => {
                    const section = document.querySelector(selector);

                    return (
                        section.getClientRects().length > 0 &&
                        section.getBoundingClientRect().top <= readingLine
                    );
                });

                return (
                    visibleSection === expected &&
                    document
                        .querySelector(
                            '.landing-header-links [aria-current="location"]',
                        )
                        ?.getAttribute('href') === expected
                );
            }, href);
        const waitForSavedScroll = () =>
            page.waitForFunction(
                () =>
                    Math.abs(
                        (history.state?.documentScrollPosition?.top ?? 0) -
                            scrollY,
                    ) < 1,
            );

        for (const [index, href, label] of [
            [0, '#cara-kerja', 'Cara kerja'],
            [1, '#demo', 'Coba demo'],
            [2, '#peran', 'Untuk siapa'],
            [3, '#pertanyaan', 'Tanya jawab'],
            [4, '#top', 'Beranda'],
        ]) {
            const link = primaryNavigation.getByRole('link', {
                name: label,
                exact: true,
            });

            if (index % 2 === 0) {
                await link.click();
            } else {
                await link.focus();
                await page.keyboard.press('Enter');
            }

            await waitForActiveSection(href);
            check(
                (await link.getAttribute('aria-current')) === 'location' &&
                    (await primaryNavigation
                        .locator('[aria-current]')
                        .count()) === 1,
                'Navigasi ' +
                    label +
                    ': satu penanda aktif mengikuti tujuan klik/keyboard.',
            );
        }

        const hashBeforeScroll = new URL(page.url()).hash;

        for (const [id, expected] of [
            ['cara-kerja', '#cara-kerja'],
            ['demo', '#demo'],
            ['peran', '#peran'],
            ['privasi', '#peran'],
            ['pertanyaan', '#pertanyaan'],
        ]) {
            await page.locator('#' + id).evaluate((element) => {
                const headerBottom = document
                    .querySelector('.landing-header')
                    .getBoundingClientRect().bottom;

                window.scrollTo({
                    top:
                        scrollY +
                        element.getBoundingClientRect().top -
                        headerBottom -
                        16,
                    behavior: 'instant',
                });
            });
            await waitForActiveSection(expected);
            check(
                new URL(page.url()).hash === hashBeforeScroll,
                'Scroll manual ke ' +
                    id +
                    ': penanda mengikuti posisi tanpa mengubah hash.',
            );
        }

        await page.goto(new URL('#demo', qaOrigin).href);
        await waitForActiveSection('#demo');
        await waitForSavedScroll();
        check(true, 'Hash awal langsung mengaktifkan Coba demo.');
        await primaryNavigation
            .getByRole('link', { name: 'Cara kerja', exact: true })
            .click();
        await waitForActiveSection('#cara-kerja');
        await waitForSavedScroll();
        await primaryNavigation
            .getByRole('link', { name: 'Coba demo', exact: true })
            .click();
        await waitForActiveSection('#demo');
        await waitForSavedScroll();
        await page.goBack();
        await waitForActiveSection('#cara-kerja');
        check(true, 'Back browser memulihkan penanda bagian sebelumnya.');
        await page.goForward();
        await waitForActiveSection('#demo');
        check(true, 'Forward browser memulihkan penanda bagian berikutnya.');

        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByTestId('landing-menu-toggle').click();
        const mobileNavigation = page.locator('#landing-mobile-navigation');
        await mobileNavigation
            .getByRole('link', { name: 'Cara kerja', exact: true })
            .click();
        await mobileNavigation.waitFor({ state: 'hidden' });
        await waitForActiveSection('#cara-kerja');
        await page.getByTestId('landing-menu-toggle').click();
        check(
            (await mobileNavigation
                .getByRole('link', { name: 'Cara kerja', exact: true })
                .getAttribute('aria-current')) === 'location' &&
                (await mobileNavigation.locator('[aria-current]').count()) ===
                    1,
            'Menu mobile memakai pilihan aktif yang sama setelah menavigasi.',
        );
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(qaOrigin);

        await page.setViewportSize({ width: 1280, height: 800 });
        await page
            .locator('#pertanyaan summary')
            .filter({ hasText: 'Bagaimana cara mulai menggunakan SATU?' })
            .click();

        for (const selector of [
            '.landing-header-inner .landing-primary',
            '.landing-hero-actions .landing-primary',
        ]) {
            const action = page.locator(selector);

            if (selector.includes('landing-hero-actions')) {
                await page.mouse.move(0, 0);
                check(
                    await action.evaluate(
                        (el) => getComputedStyle(el).boxShadow === 'none',
                    ),
                    selector + ': tanpa bayangan.',
                );
                await action.hover();
                check(
                    await action.evaluate(
                        (el) => getComputedStyle(el).boxShadow === 'none',
                    ),
                    selector + ': hover tetap tanpa bayangan.',
                );
            }

            await page.keyboard.press('Tab');
            await action.focus();
            check(
                await action.evaluate((el) => {
                    const style = getComputedStyle(el);

                    return (
                        style.outlineStyle !== 'none' &&
                        parseFloat(style.outlineWidth) >= 2
                    );
                }),
                selector + ': fokus keyboard terlihat.',
            );
        }

        const student = page.getByRole('tab', {
            name: 'Mahasiswa',
            exact: true,
        });
        await student.focus();
        await page.keyboard.press('End');
        check(
            (await page
                .getByRole('tab', { name: 'Admin Universitas', exact: true })
                .getAttribute('aria-selected')) === 'true',
            'Tab peran mendukung End.',
        );
        await page.keyboard.press('Home');
        check(
            (await student.getAttribute('aria-selected')) === 'true',
            'Tab peran mendukung Home.',
        );
        const faq = page.locator('#pertanyaan summary').first();
        await faq.focus();
        await page.keyboard.press('Enter');
        check(
            await faq.evaluate((el) => el.parentElement.open),
            'FAQ dapat dibuka dengan keyboard.',
        );
        await page.keyboard.press('Enter');
        check(
            await faq.evaluate((el) => !el.parentElement.open),
            'FAQ dapat ditutup dengan keyboard.',
        );
        await page.setViewportSize({ width: 320, height: 640 });
        await page.evaluate(() => window.scrollTo(0, 0));
        const menu = page.getByTestId('landing-menu-toggle');
        await menu.click();
        check(
            await page.locator('#landing-mobile-navigation').isVisible(),
            'Navigasi mobile terbuka.',
        );
        await page.keyboard.press('Escape');
        check(
            await menu.evaluate((el) => el === document.activeElement),
            'Escape memulihkan fokus navigasi.',
        );
        await page.getByTestId('landing-mascot-topic-project').click();
        check(
            (await page.getByRole('dialog').innerText()).includes(
                'kebutuhan peran',
            ),
            'Kartu maskot menjelaskan peran.',
        );
        await page.keyboard.press('Escape');
        const demo = page.getByTestId('journey-demo');
        await demo
            .getByRole('button', { name: 'Berikutnya', exact: true })
            .click();
        check(
            (
                await page.getByTestId('journey-step-heading').innerText()
            ).includes('bukan ditebak'),
            'Aksi lanjut memajukan simulasi.',
        );
        check(
            (await page
                .locator('summary')
                .filter({ hasText: 'Pelengkap: peta' })
                .count()) === 0 &&
                (await page.getByTestId('landing-demo-region').count()) === 0,
            'Landing berfokus pada demo utama tanpa dropdown peta pelengkap.',
        );
        const overflow = await page.evaluate(() =>
            [...document.querySelectorAll('body *')]
                .filter((el) => {
                    const box = el.getBoundingClientRect();

                    return (
                        box.width &&
                        box.right > innerWidth + 1 &&
                        getComputedStyle(el).position !== 'absolute'
                    );
                })
                .map((el) => ({
                    tag: el.tagName,
                    class: el.className,
                    right: el.getBoundingClientRect().right,
                })),
        );

        if (
            await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth + 1,
            )
        ) {
            console.log(JSON.stringify(overflow.slice(0, 25)));
        }

        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Demo utama tidak meluapkan mobile.',
        );
        const visibility = page.getByRole('group', {
            name: 'Simulasi jangkauan karya',
        });

        for (const [label, text] of [
            ['Publik', 'Ringkasan karya dapat dilihat publik.'],
            ['Hanya saya', 'Disimpan untuk diri sendiri.'],
        ]) {
            await visibility
                .getByRole('button', { name: label, exact: true })
                .click();
            check(
                (await visibility
                    .getByRole('button', { name: label, exact: true })
                    .getAttribute('aria-pressed')) === 'true',
                label + ': pilihan jangkauan semantik.',
            );
            check(
                await page.getByText(text, { exact: true }).isVisible(),
                label + ': penjelasan jangkauan berubah.',
            );
        }

        await page.setViewportSize({ width: 1280, height: 800 });
        check(
            (await page.locator('body').innerText()).includes(
                'mahasiswa Universitas Teknologi Yogyakarta',
            ),
            'Landing menjelaskan sasaran mahasiswa UTY.',
        );
        check(
            !(await page.locator('body').innerText()).includes(
                'universitas tujuan',
            ),
            'Landing tidak menawarkan pemilihan universitas.',
        );
        await page.evaluate(() => {
            document.body.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Seluruh halaman reflow pada zoom 200%.',
        );
        await page.evaluate(() => {
            document.body.style.zoom = '';
        });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(qaOrigin);
        await page.getByTestId('landing-mascot').waitFor();
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(artifacts, 'hero-motion.png'),
        });
        check(
            await page.locator('h1').isVisible(),
            'Konten tetap terlihat dengan motion aktif.',
        );
        const beforeHover = await figurePosition();
        const imageBounds = await page
            .locator('.landing-bird-figure')
            .boundingBox();
        await page.mouse.move(
            imageBounds.x + imageBounds.width / 2,
            imageBounds.y + imageBounds.height / 2,
        );
        await page.waitForTimeout(250);
        check(
            await page.locator('.landing-bird-figure img').evaluate((image) => {
                const style = getComputedStyle(image);

                return (
                    style.animationName === 'none' &&
                    style.transform === 'none' &&
                    style.transitionProperty === 'none'
                );
            }),
            'Maskot tidak memiliki animasi atau transform saat kursor melintas.',
        );
        await page.getByTestId('landing-mascot-topic-team').click();
        await page.waitForTimeout(250);
        const afterClick = await figurePosition();
        check(
            ['x', 'y', 'width', 'height'].every(
                (key) => Math.abs(beforeHover[key] - afterClick[key]) < 0.5,
            ),
            'Pada motion aktif, hover dan klik kartu tidak menggeser atau mengecilkan maskot.',
        );
        check(
            await page
                .locator('.landing-bird-figure img')
                .evaluate(
                    (image) => getComputedStyle(image).animationName === 'none',
                ),
            'Memilih kartu tidak memulai animasi sapaan lama.',
        );
        const animations = await page.evaluate(
            () =>
                document
                    .getAnimations()
                    .filter(
                        (animation) =>
                            animation.effect?.getTiming().iterations ===
                            Infinity,
                    ).length,
        );
        check(animations === 0, 'Tidak ada animasi otomatis berulang.');
        await page.keyboard.press('Escape');

        const checkImmediateNavigation = async (href, activate) => {
            await page.evaluate((target) => {
                const indicator = document.querySelector(
                    '.landing-nav-indicator',
                );
                const trace = {
                    selections: [],
                    positions: [],
                    startX: indicator.getBoundingClientRect().left,
                    frame: 0,
                };
                const sample = () => {
                    trace.selections.push(
                        document
                            .querySelector(
                                '.landing-header-links [aria-current="location"]',
                            )
                            ?.getAttribute('href'),
                    );
                    trace.positions.push(
                        indicator.getBoundingClientRect().left,
                    );
                    trace.frame = requestAnimationFrame(sample);
                };

                window.__satuNavigationTrace = trace;
                document
                    .querySelector(
                        '.landing-header-links a[href="' + target + '"]',
                    )
                    .addEventListener(
                        'click',
                        () => {
                            trace.startX =
                                indicator.getBoundingClientRect().left;
                            trace.frame = requestAnimationFrame(sample);
                        },
                        { once: true },
                    );
            }, href);
            await activate();
            check(
                (await primaryNavigation
                    .locator('[aria-current="location"]')
                    .getAttribute('href')) === href,
                href + ': penanda langsung berpindah setelah menu diaktifkan.',
            );
            await waitForActiveSection(href);
            await waitForSavedScroll();
            await page.waitForFunction(() => {
                const indicator = document.querySelector(
                    '.landing-nav-indicator',
                );

                return indicator.getAnimations().length === 0;
            });
            const { selections, positions, startX } = await page.evaluate(
                () => {
                    const trace = window.__satuNavigationTrace;
                    cancelAnimationFrame(trace.frame);
                    delete window.__satuNavigationTrace;

                    return {
                        selections: trace.selections,
                        positions: trace.positions,
                        startX: trace.startX,
                    };
                },
            );
            check(
                selections.length > 0 &&
                    selections.every((value) => value === href),
                href +
                    ': penanda tidak berpindah ke section perantara selama smooth scroll.',
            );
            const marker = await page
                .locator('.landing-nav-indicator')
                .boundingBox();
            const selected = await primaryNavigation
                .locator('[aria-current]')
                .boundingBox();
            check(
                (Math.abs(startX - selected.x) < 2 ||
                    positions.some(
                        (x) =>
                            x > Math.min(startX, selected.x) + 0.25 &&
                            x < Math.max(startX, selected.x) - 0.25,
                    )) &&
                    Math.abs(marker.x - selected.x) < 1 &&
                    Math.abs(marker.width - selected.width) < 1,
                href +
                    ': pil benar-benar bergeser dari posisi sebelumnya dan tepat berhenti di menu tujuan.',
            );
        };

        for (const [href, label, keyboard] of [
            ['#pertanyaan', 'Tanya jawab', false],
            ['#top', 'Beranda', false],
            ['#cara-kerja', 'Cara kerja', true],
        ]) {
            await checkImmediateNavigation(href, async () => {
                const link = primaryNavigation.getByRole('link', {
                    name: label,
                    exact: true,
                });

                if (keyboard) {
                    await link.focus();
                    await page.keyboard.press('Enter');
                } else {
                    await link.click();
                }
            });
        }

        await primaryNavigation
            .getByRole('link', { name: 'Tanya jawab', exact: true })
            .click();
        await checkImmediateNavigation('#demo', () =>
            primaryNavigation
                .getByRole('link', { name: 'Coba demo', exact: true })
                .click(),
        );
        const scrollBeforeInterruption = await page.evaluate(() => scrollY);
        await primaryNavigation
            .getByRole('link', { name: 'Tanya jawab', exact: true })
            .click();
        await page.waitForFunction(
            (start) =>
                scrollY > start + 20 &&
                document.getElementById('pertanyaan').getBoundingClientRect()
                    .top > innerHeight,
            scrollBeforeInterruption,
        );
        await page.keyboard.press('Home');
        await waitForActiveSection('#top');
        await waitForSavedScroll();
        check(
            true,
            'Scroll keyboard membatalkan tujuan lama dan mengembalikan pelacakan section.',
        );

        await page.emulateMedia({ reducedMotion: 'reduce' });

        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(new URL('#pertanyaan', qaOrigin).href);
            await waitForActiveSection('#pertanyaan');
            await page.evaluate(() => {
                const lower = document.querySelector('.landing-lower');
                lower.replaceWith(lower.cloneNode(true));
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
            await waitForActiveSection('#top');
            check(
                true,
                width +
                    ': penggantian section tidak mengunci penanda pada Tanya jawab.',
            );

            await page.locator('#pertanyaan').evaluate((section) => {
                section.hidden = true;
            });
            await waitForActiveSection('#top');
            check(
                (await page
                    .locator('.landing-header-links [aria-current]')
                    .getAttribute('href')) === '#top',
                width + ': section tanpa kotak layout tidak mengaktifkan menu.',
            );
            await page.locator('#pertanyaan').evaluate((section) => {
                section.hidden = false;
            });

            for (const [href, label] of [
                ['#pertanyaan', 'Tanya jawab'],
                ['#cara-kerja', 'Cara kerja'],
                ['#demo', 'Coba demo'],
                ['#peran', 'Untuk siapa'],
                ['#top', 'Beranda'],
            ]) {
                let menu = primaryNavigation;

                if (!(await menu.isVisible())) {
                    await page.getByTestId('landing-menu-toggle').click();
                    menu = page.locator('#landing-mobile-navigation');
                }

                await menu
                    .getByRole('link', { name: label, exact: true })
                    .click();
                await waitForActiveSection(href);
                check(
                    true,
                    width +
                        ': ' +
                        label +
                        ' tetap bekerja setelah section diganti.',
                );
            }

            await page.locator('#pertanyaan').evaluate((section) => {
                document.documentElement.style.overflowAnchor = 'none';
                document.body.style.overflowAnchor = 'none';
                const headerBottom = document
                    .querySelector('.landing-header')
                    .getBoundingClientRect().bottom;
                window.scrollTo({
                    top:
                        scrollY +
                        section.getBoundingClientRect().top -
                        headerBottom -
                        16,
                    behavior: 'instant',
                });
            });
            await waitForActiveSection('#pertanyaan');
            const hashBeforeResize = new URL(page.url()).hash;
            await page.locator('#privasi').evaluate((section) => {
                section.style.paddingBottom = '1000px';
            });
            await waitForActiveSection('#peran');
            await page.locator('#privasi').evaluate((section) => {
                section.style.removeProperty('padding-bottom');
            });
            await waitForActiveSection('#pertanyaan');
            check(
                new URL(page.url()).hash === hashBeforeResize,
                width +
                    ': tinggi section pengganti memperbarui penanda tanpa mengubah URL.',
            );
        }

        check(
            errors.length === 0,
            'Tidak ada exception JavaScript: ' + errors.join(', '),
        );
        check(
            mutations.length === 0,
            'Interaksi landing tidak mengirim mutasi.',
        );
        console.log(count + ' pemeriksaan lulus. Artefak: ' + artifacts);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
