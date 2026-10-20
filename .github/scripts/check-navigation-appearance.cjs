const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium, selectors } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
selectors.setTestIdAttribute('data-test');
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://127.0.0.1:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
);
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-navigation-'));
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}

(async () => {
    const logoBytes = fs.readFileSync(
        path.join(__dirname, '../../public/images/university-uty.webp'),
    );
    check(
        logoBytes.toString('ascii', 8, 12) === 'WEBP' &&
            logoBytes.length < 100000,
        'Logo UTY runtime WebP teroptimasi, source pengguna tetap.',
    );
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );

    try {
        for (const role of ['pemula', 'admin']) {
            const context = await browser.newContext({
                reducedMotion: 'reduce',
                viewport: { width: 1280, height: 900 },
            });
            const errors = [],
                mutations = [];
            await context.grantPermissions(['local-network-access'], {
                origin: qaOrigin,
            });
            await context.route('**/*', async (route) => {
                const request = route.request(),
                    url = new URL(request.url());

                if (
                    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
                ) {
                    return route.abort();
                }

                if (url.pathname.includes('_boost/browser-logs')) {
                    return route.fulfill({ status: 204 });
                }

                if (
                    request.method() !== 'GET' &&
                    !(
                        url.origin === qaOrigin &&
                        url.pathname === '/login' &&
                        request.method() === 'POST'
                    )
                ) {
                    mutations.push(request.method() + ' ' + url.pathname);

                    return route.abort();
                }

                return route.fallback();
            });
            const page = await context.newPage();
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(qaOrigin + '/login');
            await page
                .getByLabel('Nama pengguna', { exact: true })
                .fill('uty_' + role);
            await page.locator('#password').fill('password');
            await page.locator('form button[type="submit"]').click();
            await page.waitForURL((url) => url.pathname !== '/login');
            const response = await context.request.get(qaOrigin + '/dashboard');
            const html = await response.text();
            const data = JSON.parse(
                html.match(
                    /<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/,
                )[1],
            );
            check(
                data.props.auth.user.name.includes('Data synthetic'),
                role + ': hanya akun synthetic lokal.',
            );
            await context.addInitScript((id) => {
                for (const guide of [
                    'student-dashboard-journey-v1',
                    'student-menu-tour-v1',
                ]) {
                    localStorage.setItem(
                        'satu:feature-guide:' + guide + ':user:' + id,
                        'seen',
                    );
                }
            }, data.props.auth.user.id);
            const startUrl = page.url();
            await page.reload();
            const toggle = page.getByTestId('sidebar-trigger');
            const nav = page.getByRole('navigation', {
                name:
                    role === 'admin'
                        ? 'Navigasi Admin Universitas'
                        : 'Navigasi utama',
                exact: true,
            });
            const iconMap =
                role === 'admin'
                    ? {
                          Ringkasan: 'layout-panel-top',
                          Mahasiswa: 'contact-round',
                          'Roster mahasiswa': 'table-properties',
                          'Validasi kontribusi': 'clipboard-check',
                          Peringkat: 'chart-bar',
                          'Bantuan kesempatan': 'hand-heart',
                          Pengaturan: 'sliders-horizontal',
                      }
                    : {
                          Beranda: 'house',
                          Proyek: 'folder-kanban',
                          Kontribusi: 'notebook-pen',
                          Portofolio: 'gallery-vertical-end',
                          Peringkat: 'chart-bar',
                      };

            for (const [label, icon] of Object.entries(iconMap)) {
                const svg = nav
                    .getByRole('link', { name: label, exact: true })
                    .locator('svg');
                check(
                    (await svg.getAttribute('class')).includes(
                        'lucide-' + icon,
                    ) && (await svg.getAttribute('stroke-width')) === '1.75',
                    role +
                        ': ikon ' +
                        label +
                        ' sesuai fungsi dan stroke seragam.',
                );
            }

            if (role === 'admin') {
                const advanced = page.getByTestId('advanced-navigation');
                await advanced.locator('summary').click();

                for (const [label, icon] of Object.entries({
                    'Peninjauan inklusi': 'waypoints',
                    'Pemetaan kredit': 'blocks',
                    'Sinkronisasi akademik': 'workflow',
                })) {
                    const svg = advanced
                        .getByRole('link', { name: label, exact: true })
                        .locator('svg');
                    check(
                        (await svg.getAttribute('class')).includes(
                            'lucide-' + icon,
                        ) &&
                            (await svg.getAttribute('stroke-width')) === '1.75',
                        'Admin: ikon lanjutan ' +
                            label +
                            ' selaras tanpa mengubah izin.',
                    );
                }

                await advanced.locator('summary').click();
            }

            check(
                (await nav.locator('[aria-current="page"]').count()) === 1,
                role + ': tepat satu menu aktif.',
            );
            const university = page.getByTestId('workspace-context');
            await university
                .getByTestId('university-logo')
                .evaluate((img) => img.decode());
            check(
                await university
                    .getByTestId('university-logo')
                    .evaluate(
                        (img) =>
                            img.naturalWidth === 256 &&
                            img.alt === '' &&
                            getComputedStyle(img).objectFit === 'contain',
                    ),
                role + ': logo UTY utuh, dekoratif dan termuat.',
            );
            check(
                (await university.innerText()).includes(
                    'Universitas Teknologi Yogyakarta',
                ) &&
                    !(await university.innerText()).includes('Afiliasi kampus'),
                role +
                    ': nama universitas tetap, teks Afiliasi kampus tidak ditampilkan.',
            );

            if (role === 'pemula') {
                check(
                    (await university.innerText()).includes('Terverifikasi'),
                    'Badge afiliasi aktual tidak dihapus bersama label.',
                );
            }

            for (const width of [320, 390, 768, 1280, 1920]) {
                await page.setViewportSize({ width, height: 900 });
                await toggle.waitFor();
                check(
                    (await toggle.locator('svg.lucide-menu line').count()) ===
                        3 && (await toggle.getAttribute('aria-controls')),
                    role +
                        ' ' +
                        width +
                        ': toggle memakai tiga garis dengan relasi navigasi.',
                );
                check(
                    await toggle.evaluate(
                        (node) =>
                            node.getBoundingClientRect().width >= 44 &&
                            node.getBoundingClientRect().height >= 44 &&
                            getComputedStyle(node).cursor === 'pointer',
                    ),
                    role + ' ' + width + ': toggle 44px dan pointer.',
                );
                check(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    ),
                    role + ' ' + width + ': tanpa overflow horizontal.',
                );

                if (width < 768) {
                    await toggle.click();
                    const close = page.getByTestId('sidebar-close');
                    await close.waitFor();
                    check(
                        (await close
                            .locator('svg.lucide-menu line')
                            .count()) === 3 &&
                            (await close.getAttribute('aria-label')) ===
                                'Tutup navigasi' &&
                            (await toggle.getAttribute('aria-expanded')) ===
                                'true',
                        role +
                            ' ' +
                            width +
                            ': drawer dan tombol tutup tiga garis jelas.',
                    );
                    await page
                        .getByTestId('university-logo')
                        .evaluate((img) => img.decode());
                    await page.screenshot({
                        path: path.join(
                            artifacts,
                            role + '-drawer-' + width + '.png',
                        ),
                    });
                    await close.focus();
                    await page.keyboard.press('Enter');
                    await close.waitFor({ state: 'hidden' });
                    check(
                        await toggle.evaluate(
                            (node) =>
                                document.activeElement === node &&
                                node.getAttribute('aria-expanded') === 'false',
                        ),
                        role + ': tutup dengan keyboard memulihkan fokus.',
                    );
                    await toggle.click();
                    await close.waitFor();
                    await page.keyboard.press('Escape');
                    await close.waitFor({ state: 'hidden' });
                    check(
                        await toggle.evaluate(
                            (node) => document.activeElement === node,
                        ),
                        role + ': Escape memulihkan fokus.',
                    );
                    await toggle.click();
                    await close.waitFor();
                    await page.mouse.click(width - 3, 400);
                    await close.waitFor({ state: 'hidden' });
                    check(
                        (await toggle.getAttribute('aria-expanded')) ===
                            'false',
                        role + ': klik backdrop menutup drawer.',
                    );
                } else {
                    await nav.waitFor();
                    await page.screenshot({
                        path: path.join(
                            artifacts,
                            role + '-desktop-' + width + '.png',
                        ),
                    });
                }
            }

            await toggle.click();
            check(
                (await toggle.getAttribute('aria-expanded')) === 'false' &&
                    (await toggle.locator('svg.lucide-menu line').count()) ===
                        3,
                role + ': desktop tertutup tetap tiga garis.',
            );
            await page.reload();
            check(
                (await toggle.getAttribute('aria-expanded')) === 'false',
                role + ': preferensi desktop bertahan setelah reload.',
            );
            await toggle.click();
            await page.keyboard.press('Control+b');
            check(
                (await toggle.getAttribute('aria-expanded')) === 'false',
                role + ': pintasan keyboard tetap berfungsi.',
            );
            await page.keyboard.press('Control+b');
            await page.setViewportSize({ width: 390, height: 900 });
            await toggle.click();
            const close = page.getByTestId('sidebar-close');
            await close.waitFor();
            const target = role === 'admin' ? 'Mahasiswa' : 'Proyek';
            const link = nav.getByRole('link', { name: target, exact: true });
            const href = await link.getAttribute('href');
            await link.click();
            await page.waitForURL(
                (url) => url.pathname === new URL(href, qaOrigin).pathname,
            );
            await close.waitFor({ state: 'hidden' });
            await toggle.click();
            await close.waitFor();
            check(
                (await nav
                    .getByRole('link', { name: target, exact: true })
                    .getAttribute('aria-current')) === 'page',
                role +
                    ': pindah menu menutup drawer dan memperbarui menu aktif.',
            );
            await close.click();
            await page.setViewportSize({ width: 1280, height: 720 });
            await page
                .locator('html')
                .evaluate((node) => (node.style.fontSize = '200%'));
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                role + ': teks 200 persen tetap reflow.',
            );
            await page
                .locator('html')
                .evaluate((node) => (node.style.fontSize = ''));
            await page.goto(startUrl);
            check(
                errors.length === 0,
                role + ': tanpa exception JavaScript: ' + errors.join(', '),
            );
            check(
                mutations.length === 0,
                role + ': tanpa mutasi bisnis: ' + mutations.join(', '),
            );
            await context.close();
        }

        console.log(
            checks + ' pemeriksaan navigasi lulus. Artefak: ' + artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
