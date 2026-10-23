const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-core-ui-local-'));
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}
function initialPage(html) {
    return JSON.parse(
        html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)[1],
    );
}
(async () => {
    const backgrounds = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                '../../resources/images/mascot/student-hero-backgrounds.provenance.json',
            ),
            'utf8',
        ),
    );
    check(
        backgrounds.assets.length === 5,
        'Lima latar berbeda memiliki provenance.',
    );

    for (const asset of backgrounds.assets) {
        const master = fs.readFileSync(
            path.join(__dirname, '../../' + asset.source.file),
        );
        check(
            master.readUInt32BE(16) >= 2048 &&
                createHash('sha256').update(master).digest('hex') ===
                    asset.source.sha256 &&
                asset.prompt &&
                asset.generation_id,
            asset.theme + ': master HD, hash, prompt serta sumber tercatat.',
        );

        for (const variant of asset.runtime_variants) {
            const bytes = fs.readFileSync(
                path.join(__dirname, '../../' + variant.file),
            );
            check(
                bytes.toString('ascii', 8, 12) === 'WEBP' &&
                    bytes.length < 60000 &&
                    bytes.length === variant.bytes &&
                    createHash('sha256').update(bytes).digest('hex') ===
                        variant.sha256,
                asset.theme +
                    ' ' +
                    variant.width +
                    ': latar WebP di bawah 60 KB dan hash cocok.',
            );
        }
    }

    for (const pose of ['portfolio-showcase', 'ranking-context']) {
        const provenance = JSON.parse(
            fs.readFileSync(
                path.join(
                    __dirname,
                    '../../resources/images/mascot/' +
                        pose +
                        '-mascot.provenance.json',
                ),
                'utf8',
            ),
        );
        const master = fs.readFileSync(
            path.join(__dirname, '../../' + provenance.source.file),
        );
        check(
            master.readUInt32BE(16) >= 1024 &&
                master[25] === 6 &&
                provenance.prompt &&
                provenance.identity_references.length === 2,
            pose +
                ': master HD transparan, prompt dan sumber identitas tercatat.',
        );

        for (const asset of provenance.runtime_variants) {
            const bytes = fs.readFileSync(
                path.join(__dirname, '../../' + asset.file),
            );
            check(
                bytes.toString('ascii', 8, 12) === 'WEBP' &&
                    bytes.length < 200000,
                pose + ' ' + asset.width + ': asset WebP ringan.',
            );
        }
    }

    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );

    try {
        const roles = [
            'mahasiswa',
            'pemula',
            'pemilik',
            'anggota',
            'pelamar',
            'admin',
            'afiliasi',
            'admin_kedua',
            'aktivasi',
            'profil',
            'ditolak',
            'portofolio',
        ];
        const requestedRoles = process.env.SATU_QA_ROLES?.split(',');

        if (requestedRoles) {
            assert.ok(
                requestedRoles.every((role) => roles.includes(role)),
                'Pilih hanya akun fixture yang dikenal.',
            );
        }

        for (const role of roles.filter(
            (role) => !requestedRoles || requestedRoles.includes(role),
        )) {
            const context = await browser.newContext({
                reducedMotion: 'reduce',
            });
            const errors = [],
                prohibited = [];
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
                    prohibited.push(url.pathname);

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
            check(
                !new URL(page.url()).pathname.includes('login'),
                'Login akun synthetic uty_' + role + ' berhasil.',
            );
            const response = await context.request.get(qaOrigin + '/dashboard');
            check(
                response.status() < 400,
                'Beranda akun ' + role + ' dapat dibuka.',
            );
            const data = initialPage(await response.text()),
                user = data.props.auth.user;
            check(
                ['student', 'campus_admin'].includes(user.workspace.role) &&
                    Object.keys(user.workspace).sort().join('|') ===
                        'institution|role',
                'Workspace aktual hanya memakai kontrak dua role tanpa organisasi perekrut.',
            );
            check(
                user.name.includes('Data synthetic'),
                'Hanya akun dataset synthetic yang digunakan.',
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
            }, user.id);
            const campusId = user.workspace?.institution?.id;
            let pages = [
                '/dashboard',
                '/projects',
                '/contributions',
                '/portfolio',
                '/leaderboards',
                '/student-profiles/edit',
            ];

            if (role === 'admin' || role === 'admin_kedua') {
                check(
                    user.workspace.role === 'campus_admin' &&
                        !Object.hasOwn(user, 'is_platform_admin'),
                    'Admin UTY memakai satu membership, tanpa workspace platform.',
                );
                const legacy = await context.request.get(
                    qaOrigin + '/platform',
                );
                check(
                    new URL(legacy.url()).pathname ===
                        '/campus/' + campusId + '/overview',
                    'Route platform lama mengarah ke ringkasan UTY.',
                );
                const admins = await context.request.get(
                    qaOrigin + '/campus/' + campusId + '/admins',
                    { headers: { Accept: 'application/json' } },
                );
                const adminList = await admins.json();
                check(
                    admins.status() === 200 && adminList.data.length === 2,
                    'Kedua Admin Universitas tersedia pada daftar berotorisasi.',
                );
                const skills = await context.request.get(
                    qaOrigin + '/platform/skills',
                );
                check(
                    skills.status() === 200,
                    'Katalog keahlian tersedia bagi Admin Universitas.',
                );
                const otherId = process.env.SATU_QA_OTHER_INSTITUTION_ID;

                if (
                    otherId &&
                    /^\d+$/.test(otherId) &&
                    Number(otherId) !== campusId
                ) {
                    const other = await context.request.get(
                        qaOrigin + '/campus/' + otherId + '/overview',
                    );
                    check(
                        other.status() === 403,
                        'URL kampus lama tidak terbuka bagi admin UTY.',
                    );
                }

                pages = [
                    'overview',
                    'roster',
                    'affiliations',
                    'contributions',
                    'students',
                    'settings',
                    'settings/skills',
                    'admins',
                ].map((menu) => '/campus/' + campusId + '/' + menu);
                pages.push(
                    '/institutions/' + campusId + '/opportunity-support',
                    '/leaderboards',
                );
            } else if (role === 'afiliasi' || role === 'aktivasi') {
                pages = ['/dashboard', '/student-profiles/edit'];
            }

            if (role !== 'admin' && role !== 'admin_kedua') {
                const forbidden = await context.request.get(
                    qaOrigin + '/platform',
                );
                check(
                    forbidden.status() === 403,
                    'Mahasiswa tidak membuka route administrasi platform lama.',
                );
            }

            const homeMascotGeometry = new Map();

            for (const surface of pages) {
                const result = await page.goto(qaOrigin + surface);
                check(
                    result.status() < 400,
                    role + ' membuka ' + surface + ' tanpa error HTTP.',
                );
                await page.locator('main').first().waitFor();
                const backgroundThemes = {
                    '/dashboard': 'home',
                    '/projects': 'projects',
                    '/contributions': 'contributions',
                    '/portfolio': 'portfolio',
                    '/leaderboards': 'rankings',
                };
                const backdrop = page.locator('.student-hero-backdrop');
                const hasBackdrop = (await backdrop.count()) === 1;

                if (hasBackdrop) {
                    check(
                        (await backdrop.getAttribute('data-hero-theme')) ===
                            backgroundThemes[surface] &&
                            (await backdrop.getAttribute('aria-hidden')) ===
                                'true',
                        role +
                            ' ' +
                            surface +
                            ': latar sesuai menu dan dekoratif.',
                    );
                    await backdrop
                        .locator('img')
                        .evaluate((img) => img.decode());
                } else if (role === 'pemula' && backgroundThemes[surface]) {
                    check(false, surface + ': latar hero harus tersedia.');
                }

                const newHero =
                    !['admin', 'admin_kedua'].includes(role) &&
                    ['/portfolio', '/leaderboards'].includes(surface);

                if (newHero) {
                    await page
                        .locator(
                            '[data-test="' +
                                (surface === '/portfolio'
                                    ? 'portfolio-header'
                                    : 'leaderboard-header') +
                                '"]',
                        )
                        .waitFor();
                    await page
                        .locator('.student-hero-mascot img')
                        .evaluate((img) => img.decode());
                }

                if (surface === '/leaderboards') {
                    await page
                        .locator('[data-test="leaderboard-header"]')
                        .waitFor();
                    check(
                        (await page
                            .getByRole('link', {
                                name: 'Peringkat',
                                exact: true,
                            })
                            .count()) > 0,
                        'Peringkat tersedia melalui navigasi ' + role,
                    );
                    const isAdmin = role === 'admin' || role === 'admin_kedua';
                    check(
                        (await page
                            .locator('[data-test="leaderboard-consent"]')
                            .count()) === (isAdmin ? 0 : 1),
                        'Kontrol persetujuan hanya tersedia bagi mahasiswa.',
                    );

                    if (role === 'anggota' || role === 'portofolio') {
                        const xp = await page
                            .locator('[data-test="leaderboard-personal-xp"]')
                            .innerText();
                        check(
                            xp.includes(
                                (role === 'anggota' ? '1' : '3') + ' XP',
                            ),
                            'XP pribadi sesuai kontribusi contoh milik ' + role,
                        );
                    }
                }

                if (surface.endsWith('/opportunity-support')) {
                    check(
                        await page
                            .getByRole('heading', {
                                name: 'Anda belum ditunjuk sebagai peninjau bantuan',
                                exact: true,
                            })
                            .isVisible(),
                        'Admin synthetic tidak otomatis membaca berkas bantuan mahasiswa.',
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
                        role + ' ' + surface + ' reflow ' + width,
                    );

                    if (hasBackdrop) {
                        const geometry = await backdrop
                            .locator('..')
                            .evaluate((node) => {
                                const hero = node.getBoundingClientRect();
                                const bird = node
                                    .querySelector('.student-hero-mascot img')
                                    .getBoundingClientRect();
                                const copy =
                                    node.querySelector(
                                        '.student-menu-hero__copy',
                                    ) ??
                                    node.querySelector(':scope > div.relative');
                                const copyBox = copy.getBoundingClientRect();
                                const navbar = document
                                    .querySelector('[data-test="app-header"]')
                                    .getBoundingClientRect();
                                const next =
                                    node.nextElementSibling.getBoundingClientRect();
                                const overlap =
                                    bird.left < copyBox.right &&
                                    bird.right > copyBox.left &&
                                    bird.top < copyBox.bottom &&
                                    bird.bottom > copyBox.top;

                                return {
                                    width: bird.width,
                                    right: hero.right - bird.right,
                                    bottom: bird.bottom - hero.bottom,
                                    clearCopy: !overlap,
                                    clearNavbar: bird.top >= navbar.bottom - 1,
                                    clearNext: bird.bottom <= next.top + 1,
                                };
                            });

                        if (surface === '/dashboard') {
                            homeMascotGeometry.set(width, geometry);
                        } else if (homeMascotGeometry.has(width)) {
                            const home = homeMascotGeometry.get(width);
                            check(
                                ['width', 'right', 'bottom'].every(
                                    (key) =>
                                        Math.abs(home[key] - geometry[key]) < 1,
                                ),
                                surface +
                                    ' ' +
                                    width +
                                    ': ukuran dan offset maskot sama dengan Beranda aktual.',
                            );
                        }

                        check(
                            geometry.clearCopy &&
                                geometry.clearNavbar &&
                                geometry.clearNext,
                            surface +
                                ' ' +
                                width +
                                ': maskot tidak menabrak copy, navbar atau bagian berikutnya. ' +
                                JSON.stringify(geometry),
                        );

                        const backgroundState = await backdrop.evaluate(
                            (node) => {
                                const rect = node.getBoundingClientRect();
                                const hero =
                                    node.parentElement.getBoundingClientRect();
                                const img = node.querySelector('img');

                                return {
                                    pointer:
                                        getComputedStyle(node).pointerEvents ===
                                        'none',
                                    clipped:
                                        getComputedStyle(node).overflow ===
                                        'hidden',
                                    width: rect.width <= hero.width + 1,
                                    height: rect.height <= hero.height + 1,
                                    decorative: img.alt === '',
                                    static: img.getAnimations().length === 0,
                                    overlay: getComputedStyle(
                                        node,
                                        '::after',
                                    ).backgroundImage.includes(
                                        'linear-gradient',
                                    ),
                                };
                            },
                        );
                        check(
                            Object.values(backgroundState).every(Boolean),
                            surface +
                                ' ' +
                                width +
                                ': latar terklip, statis, bidang baca terang dan tidak menghalangi interaksi. ' +
                                JSON.stringify(backgroundState),
                        );

                        if (role === 'pemula') {
                            await backdrop
                                .locator('img')
                                .evaluate((img) => img.decode());
                            await page.screenshot({
                                path: path.join(
                                    artifacts,
                                    'background-' +
                                        backgroundThemes[surface] +
                                        '-' +
                                        width +
                                        '.png',
                                ),
                            });
                        }
                    }

                    if (newHero) {
                        const hero = await page
                            .locator('.student-menu-hero')
                            .boundingBox();
                        const bird = await page
                            .locator('.student-hero-mascot img')
                            .boundingBox();
                        const expectedWidth =
                            width >= 1024
                                ? Math.min((hero.width - 2) * 0.30, 295)
                                : width >= 640
                                  ? Math.min((hero.width - 2) * 0.36, 270)
                                  : 208;
                        check(
                            Math.abs(bird.width - expectedWidth) < 1 &&
                                Math.abs(
                                    bird.y +
                                        bird.height -
                                        hero.y -
                                        hero.height,
                                ) < 2,
                            role +
                                ' ' +
                                surface +
                                ' ' +
                                width +
                                ': maskot proporsional dan siluet utuh.',
                        );
                        check(
                            (await page
                                .locator('.student-hero-backdrop')
                                .getAttribute('aria-hidden')) === 'true' &&
                                (await page
                                    .locator('.student-hero-backdrop')
                                    .evaluate(
                                        (node) =>
                                            getComputedStyle(node)
                                                .pointerEvents === 'none',
                                    )),
                            role +
                                ' ' +
                                surface +
                                ' ' +
                                width +
                                ': motif tidak menghalangi kontrol atau pembaca layar.',
                        );
                        check(
                            (await page
                                .locator('.student-hero-mascot button')
                                .count()) === 0,
                            role +
                                ' ' +
                                surface +
                                ': maskot dekoratif tanpa tombol sapaan.',
                        );
                    }
                }

                await page.screenshot({
                    path: path.join(
                        artifacts,
                        role + '-' + surface.replace(/\W/g, '-') + '.png',
                    ),
                    fullPage: true,
                });

                if (newHero && role === 'pemula') {
                    await page.emulateMedia({ reducedMotion: 'no-preference' });
                    await page.reload();
                    const bird = page.locator('.student-hero-mascot img');
                    await bird.waitFor();
                    check(
                        await bird.evaluate((img) => {
                            const animation = img.getAnimations()[0];

                            if (!animation) {
                                return false;
                            }

                            window.__qaCollectionAnimation = animation;
                            animation.finish();

                            return (
                                getComputedStyle(img).animationName ===
                                    'satu-mascot-enter' &&
                                animation.effect.getTiming().duration === 420
                            );
                        }),
                        surface +
                            ': animasi masuk 420ms mengikuti menu sebelumnya.',
                    );
                    const primary = page.locator('.student-menu-hero__primary');

                    if (await primary.count()) {
                        const before = await primary.evaluate((node) =>
                            [
                                getComputedStyle(node).backgroundColor,
                                getComputedStyle(node).boxShadow,
                                getComputedStyle(node).transform,
                            ].join('|'),
                        );
                        await primary.hover();
                        check(
                            before ===
                                (await primary.evaluate((node) =>
                                    [
                                        getComputedStyle(node).backgroundColor,
                                        getComputedStyle(node).boxShadow,
                                        getComputedStyle(node).transform,
                                    ].join('|'),
                                )),
                            surface + ': CTA utama tetap statis saat hover.',
                        );
                    }

                    if (surface === '/portfolio') {
                        const rejectRefresh = async (route) =>
                            route.request().headers()['x-inertia']
                                ? route.fulfill({
                                      status: 403,
                                      contentType: 'text/html',
                                      body: 'Data synthetic. Akses tidak tersedia.',
                                  })
                                : route.fallback();
                        await page.route(
                            qaOrigin + '/portfolio',
                            rejectRefresh,
                        );
                        await page
                            .locator('[data-test="portfolio-refresh"]')
                            .click();
                        await page
                            .locator('[data-test="portfolio-refresh-error"]')
                            .waitFor();
                        check(
                            (await page
                                .locator('[data-test="portfolio-profile-jump"]')
                                .count()) === 0 &&
                                (await page
                                    .locator('[data-test="portfolio-grid"]')
                                    .count()) === 0,
                            '403 Portofolio menyembunyikan koleksi dan kendali profil lama.',
                        );
                        await page.unroute(
                            qaOrigin + '/portfolio',
                            rejectRefresh,
                        );
                        await page
                            .locator('[data-test="portfolio-refresh"]')
                            .click();
                        await page
                            .locator('[data-test="portfolio-refresh-error"]')
                            .waitFor({ state: 'hidden' });
                        await page
                            .locator('[data-test="portfolio-grid"]')
                            .waitFor();
                        check(
                            await bird.evaluate(
                                (img) =>
                                    img.getAnimations()[0] ===
                                        window.__qaCollectionAnimation &&
                                    img.getAnimations()[0].playState ===
                                        'finished',
                            ),
                            'Refresh Portofolio tidak mengulang animasi atau mengubah pilihan berbagi.',
                        );
                    }

                    await page.emulateMedia({ reducedMotion: 'reduce' });
                    check(
                        await bird.evaluate(
                            (img) =>
                                getComputedStyle(img).animationName ===
                                    'none' &&
                                getComputedStyle(img).opacity === '1',
                        ),
                        surface +
                            ': reduced motion langsung menampilkan pose akhir.',
                    );
                    await page
                        .locator('html')
                        .evaluate((node) => (node.style.fontSize = '200%'));
                    check(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth + 1,
                        ),
                        surface +
                            ': pembesaran teks 200 persen tanpa overflow.',
                    );
                    await page
                        .locator('html')
                        .evaluate((node) => (node.style.fontSize = ''));
                    await page.setViewportSize({ width: 320, height: 900 });
                    await page.screenshot({
                        path: path.join(
                            artifacts,
                            'hero-mobile-' + surface.slice(1) + '.png',
                        ),
                        fullPage: true,
                    });
                    await page.setViewportSize({ width: 1920, height: 900 });
                }

                if (hasBackdrop && role === 'pemula') {
                    const heading = await backdrop
                        .locator('..')
                        .locator('h1')
                        .innerText();
                    const rejectImage = (route) => route.abort();
                    await page.route(
                        '**/images/student-hero-*.webp',
                        rejectImage,
                    );
                    await page.reload();
                    await backdrop.locator('img').waitFor();
                    await page.waitForFunction(() => {
                        const img = document.querySelector(
                            '.student-hero-backdrop img',
                        );

                        return img.complete && img.naturalWidth === 0;
                    });
                    check(
                        (await backdrop.evaluate((node) =>
                            getComputedStyle(node).backgroundImage.includes(
                                'linear-gradient',
                            ),
                        )) &&
                            (await backdrop
                                .locator('..')
                                .locator('h1')
                                .innerText()) === heading &&
                            (await backdrop
                                .locator('..')
                                .locator('a, button')
                                .first()
                                .isVisible()),
                        surface +
                            ': gambar gagal tetap menampilkan gradasi, judul dan tindakan.',
                    );
                    await page.unroute(
                        '**/images/student-hero-*.webp',
                        rejectImage,
                    );
                    await page.reload();
                    await backdrop
                        .locator('img')
                        .evaluate((img) => img.decode());
                    await page.setViewportSize({ width: 1920, height: 900 });
                }
            }

            if (role === 'profil') {
                await page
                    .locator('#capability-faculty')
                    .selectOption('Fakultas Sains & Teknologi');
                check(
                    (await page
                        .locator('#capability-program option')
                        .count()) === 11,
                    'Editor memakai sepuluh program sains dari konfigurasi server aktual.',
                );
                await page
                    .locator('#capability-program')
                    .selectOption('Informatika (S1)');
                await page
                    .locator('#capability-faculty')
                    .selectOption('Fakultas Bisnis & Humaniora');
                check(
                    (await page
                        .locator('#capability-program option')
                        .count()) === 10 &&
                        (await page
                            .locator('#capability-program')
                            .inputValue()) === '',
                    'Editor menyaring program bisnis dan mengosongkan pilihan lintas fakultas.',
                );
                await page
                    .locator('#capability-program')
                    .selectOption('Akuntansi (D3)');
                await page.locator('#capability-year').fill('2023');
                check(
                    (await page.locator('#capability-year').inputValue()) ===
                        '2023',
                    'Editor menerima angkatan empat digit, bukan tingkat studi.',
                );

                for (const width of [320, 1920]) {
                    await page.setViewportSize({ width, height: 900 });
                    check(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth + 1,
                        ),
                        'Editor akademik aktual reflow ' + width,
                    );
                }

                await page.screenshot({
                    path: path.join(artifacts, 'profil-akademik-aktual.png'),
                    fullPage: true,
                });
            }

            if (role === 'mahasiswa') {
                await page.goto(qaOrigin + '/projects');
                await page
                    .locator('[data-test="project-beginner-shortcut"]')
                    .click();
                await page.waitForURL(
                    (url) =>
                        url.searchParams.get('beginner') === 'accepting' &&
                        url.searchParams.get('availability') === 'available',
                );
                check(
                    (await page
                        .locator('[data-test="project-beginner-shortcut"]')
                        .getAttribute('aria-pressed')) === 'true',
                    'Pintasan pemula menerapkan filter server dan menandai pilihan tersimpan.',
                );
                await page.reload();
                check(
                    (await page
                        .locator('[data-test="project-beginner-shortcut"]')
                        .getAttribute('aria-pressed')) === 'true',
                    'Filter pemula bertahan setelah reload.',
                );
            }

            if (role === 'pemilik') {
                await page.goto(qaOrigin + '/projects/create');
                await page
                    .locator('#project-role-0-beginner')
                    .selectOption({ label: 'Menerima pemula' });
                await page
                    .locator('#project-role-0-description')
                    .fill('Catatan pemilik harus dipertahankan.');
                await page
                    .locator('[data-test="project-role-0-beginner-example"]')
                    .click();
                check(
                    (await page
                        .locator('#project-role-0-description')
                        .inputValue()) ===
                        'Catatan pemilik harus dipertahankan.' &&
                        (
                            await page
                                .locator('#project-role-0-criteria')
                                .inputValue()
                        ).includes('Karya terdahulu tidak wajib'),
                    'Contoh peran mengisi kolom kosong dan mempertahankan draft pemilik.',
                );
                check(
                    await page
                        .locator(
                            '[data-test="project-role-0-beginner-example"]',
                        )
                        .isDisabled(),
                    'Contoh tidak menimpa peran yang sudah terisi.',
                );
            }

            if (role === 'admin') {
                await page.goto(
                    qaOrigin +
                        '/campus/' +
                        campusId +
                        '/contributions?status=approved&sort=newest',
                );
                const result = page
                    .locator('[data-test^="campus-contribution-result-"]')
                    .first();
                await result.waitFor();
                const claim = (
                    await result
                        .locator('xpath=ancestor::article')
                        .locator('h3')
                        .textContent()
                ).trim();
                await page
                    .locator('[data-test="campus-contribution-search"]')
                    .fill(claim.slice(0, 100));
                await page
                    .getByRole('button', {
                        name: 'Cari kontribusi',
                        exact: true,
                    })
                    .click();
                await page.waitForURL(
                    (url) => url.searchParams.get('q') === claim.slice(0, 100),
                );
                await result.waitFor();
                check(
                    (
                        await result
                            .locator('xpath=ancestor::article')
                            .locator('h3')
                            .textContent()
                    ).trim() === claim,
                    'Pencarian hasil disetujui berjalan pada query MySQL aktual.',
                );
                check(
                    (
                        await result
                            .locator('xpath=ancestor::article')
                            .textContent()
                    ).includes('Dikirim '),
                    'Waktu pengajuan hasil aktual tersedia dari sumber audit.',
                );
            }

            if (['mahasiswa', 'pemilik', 'admin'].includes(role)) {
                for (const width of [320, 1280, 1920]) {
                    await page.setViewportSize({ width, height: 900 });
                    check(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth + 1,
                        ),
                        role + ' penyempurnaan alur reflow ' + width,
                    );
                }

                await page.screenshot({
                    path: path.join(
                        artifacts,
                        role + '-penyempurnaan-alur.png',
                    ),
                    fullPage: true,
                });
            }

            check(
                errors.length === 0,
                role + ' tanpa exception JavaScript: ' + errors.join(', '),
            );
            check(
                prohibited.length === 0,
                role + ' tidak mengirim mutasi bisnis selama pemeriksaan.',
            );
            await context.close();
        }

        console.log(
            checks +
                ' pemeriksaan akun/halaman lokal lulus. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
