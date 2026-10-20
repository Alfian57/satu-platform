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
const artifacts = fs.mkdtempSync(
    path.join(os.tmpdir(), 'satu-project-discovery-'),
);
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}
const institution = {
    id: 99002,
    name: 'Universitas Teknologi Yogyakarta. Data synthetic',
};
const stats = { total: 5, occupied: 2, remaining: 3, accepting: true };
const sample = {
    id: 99010,
    institution_id: institution.id,
    institution,
    owner_id: 99003,
    owner: { id: 99003, name: 'Pemilik proyek. Data synthetic' },
    title: 'Ruang belajar bersama. Data synthetic',
    description:
        'Menyusun ruang belajar yang mudah dipakai mahasiswa, melalui riset pengguna, desain dan pengembangan bersama.',
    status: 'open',
    visibility: 'institution',
    capacity: 5,
    capacity_stats: stats,
    deadline: '2099-12-31T00:00:00Z',
    created_at: '2026-10-19T00:00:00Z',
    updated_at: '2026-10-19T00:00:00Z',
    roles: [
        {
            id: 99020,
            title: 'Desainer antarmuka',
            description: null,
            capacity: 2,
            capacity_stats: {
                total: 2,
                occupied: 0,
                remaining: 2,
                accepting: true,
            },
            accepts_beginners: true,
            skills: [
                {
                    id: 99030,
                    name: 'Desain antarmuka',
                    proficiency: 'beginner',
                },
            ],
        },
        {
            id: 99021,
            title: 'Pengembang frontend',
            description: null,
            capacity: 2,
            accepts_beginners: null,
            skills: [{ id: 99031, name: 'React', proficiency: 'intermediate' }],
        },
    ],
};
(async () => {
    const html = await (await fetch(qaOrigin)).text();
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
    const provenance = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                '../../resources/images/mascot/project-plan-mascot.provenance.json',
            ),
            'utf8',
        ),
    );
    const master = fs.readFileSync(
        path.join(__dirname, '../../' + provenance.source.file),
    );
    check(
        master.readUInt32BE(16) >= 1024 && master[25] === 6,
        'Master maskot proyek HD dengan alpha.',
    );
    check(
        provenance.prompt && provenance.identity_references.length === 2,
        'Prompt dan kedua referensi identitas tercatat.',
    );

    for (const asset of provenance.runtime_variants) {
        const bytes = fs.readFileSync(
            path.join(__dirname, '../../' + asset.file),
        );
        check(
            bytes.toString('ascii', 8, 12) === 'WEBP' && bytes.length < 200000,
            'WebP proyek ringan: ' + asset.width,
        );
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
            for (const guide of [
                'student-dashboard-journey-v1',
                'student-menu-tour-v1',
            ]) {
                localStorage.setItem(
                    'satu:feature-guide:' + guide + ':user:99001',
                    'seen',
                );
            }
        });
        let failure = null,
            delay = 0,
            sidebarOpen = true,
            longContent = false;
        const errors = [],
            requests = [],
            mutations = [];
        function payload(url) {
            const q = url.searchParams;
            const mine = q.get('view') === 'mine';
            const empty = q.get('q') === 'tidak-cocok';
            const currentPage = Number(q.get('page') || 1);
            const filters = {
                view: mine ? 'mine' : 'opportunities',
                institution_id: institution.id,
                q: q.get('q') || '',
                beginner: q.get('beginner') || 'all',
                availability: q.get('availability') || 'all',
                status:
                    q.get('status')?.split(',').filter(Boolean) ||
                    (mine ? ['draft', 'open'] : ['open', 'forming']),
                visibility:
                    q.get('visibility')?.split(',').filter(Boolean) ||
                    (mine
                        ? ['private', 'institution']
                        : ['institution', 'public']),
                sort: q.get('sort') || 'newest',
                direction: q.get('direction') || 'desc',
                per_page: Number(q.get('per_page') || 10),
                page: currentPage,
            };
            const data = empty
                ? []
                : mine
                  ? [
                        {
                            ...sample,
                            id: 99012,
                            title: 'Draft proyek saya. Data synthetic',
                            status: 'draft',
                            visibility: 'private',
                            capacity_stats: undefined,
                            roles: [],
                        },
                    ]
                  : [
                        sample,
                        {
                            ...sample,
                            id: 99011,
                            title: 'Arsip kegiatan mahasiswa. Data synthetic',
                            status: 'full',
                            capacity_stats: {
                                ...stats,
                                occupied: 5,
                                remaining: 0,
                                accepting: false,
                            },
                            roles: [
                                {
                                    ...sample.roles[0],
                                    id: 99022,
                                    title: 'Peneliti kebutuhan mahasiswa',
                                    accepts_beginners: false,
                                },
                            ],
                        },
                    ];

            if (longContent) {
                data[0] = {
                    ...data[0],
                    title: 'JudulSangatPanjang'.repeat(15),
                    owner: {
                        ...sample.owner,
                        name: 'PemilikDenganNamaPanjang'.repeat(10),
                    },
                    roles: [
                        {
                            ...sample.roles[0],
                            title: 'PeranDenganNamaPanjang'.repeat(12),
                        },
                    ],
                };
            }

            return {
                ...initial,
                component: 'projects/index',
                url: url.pathname + url.search,
                props: {
                    ...initial.props,
                    errors: {},
                    sidebarOpen,
                    institution,
                    auth: {
                        user: {
                            id: 99001,
                            name: 'Mahasiswa. Data synthetic',
                            workspace: { role: 'student', institution },
                            created_at: sample.created_at,
                            updated_at: sample.updated_at,
                        },
                    },
                    shell: {
                        institutionMembership: {
                            institutionName: institution.name,
                            status: 'verified',
                        },
                    },
                    onboarding: {
                        required: false,
                        universityState: 'ready',
                        institutionId: institution.id,
                        membershipStatus: 'verified',
                        profileId: 99040,
                    },
                    filters,
                    filter_options: {
                        status: [
                            'draft',
                            'open',
                            'forming',
                            'full',
                            'closed',
                            'cancelled',
                            'archived',
                        ],
                        visibility: ['private', 'institution', 'public'],
                        sort: ['newest', 'deadline', 'title'],
                        direction: ['asc', 'desc'],
                        per_page: { default: 10, max: 50 },
                    },
                    projects: {
                        data,
                        links: [],
                        meta: {
                            current_page: currentPage,
                            from: empty ? null : (currentPage - 1) * 2 + 1,
                            to: empty ? null : currentPage * 2,
                            total: empty ? 0 : 4,
                            per_page: 10,
                            last_page: empty ? 1 : 2,
                        },
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

            if (request.method() !== 'GET') {
                mutations.push(url.pathname);

                return route.abort();
            }

            if (url.origin === qaOrigin && url.pathname === '/projects') {
                requests.push(url.href);

                if (delay) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }

                if (failure) {
                    const current = failure;
                    failure = null;

                    if (current === 'network') {
                        return route.abort('connectionfailed');
                    }

                    return route.fulfill({
                        status: current,
                        contentType: 'text/html',
                        body: 'Data synthetic. Pemeriksaan akses.',
                    });
                }

                const data = payload(url);

                if (request.headers()['x-inertia']) {
                    return route.fulfill({
                        status: 200,
                        headers: {
                            'X-Inertia': 'true',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                }

                return route.fulfill({
                    contentType: 'text/html',
                    body: template.replace(
                        tag,
                        '$1' +
                            JSON.stringify(data).replace(/</g, '\\u003c') +
                            '$3',
                    ),
                });
            }

            return route.fallback();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        async function load(query = '') {
            await page.goto(qaOrigin + '/projects' + query);
            await page.getByTestId('projects-root').waitFor();
            await page
                .locator('[data-pose="project-plan"] img')
                .evaluate((img) => img.decode());
        }
        async function noOverflow(label) {
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                label + ': tanpa overflow horizontal.',
            );
        }

        for (const width of [320, 390, 768, 1024, 1366, 1672, 2560]) {
            await page.setViewportSize({ width, height: 900 });
            await load();
            await noOverflow(String(width));
            check(
                await page
                    .locator('.student-menu-hero__actions')
                    .evaluate((actions) => {
                        const description =
                            actions.previousElementSibling.getBoundingClientRect();
                        const rectangle = actions.getBoundingClientRect();
                        const expected = innerWidth >= 640 ? 48 : 36;

                        return (
                            Math.abs(
                                parseFloat(
                                    getComputedStyle(actions).marginTop,
                                ) - expected,
                            ) < 1 &&
                            Math.abs(
                                rectangle.top - description.bottom - expected,
                            ) < 1
                        );
                    }),
                width +
                    ': tombol dan konteks universitas turun dengan jarak bersama 36px/48px.',
            );
            const hero = await page
                .getByTestId('project-discovery-header')
                .boundingBox();
            const result = await page
                .getByTestId('projects-results')
                .boundingBox();
            const bird = await page
                .locator('[data-pose="project-plan"] img')
                .boundingBox();
            const expectedBirdWidth =
                width >= 1024
                    ? Math.min((hero.width - 2) * 0.36, 384)
                    : width >= 640
                      ? Math.min((hero.width - 2) * 0.39, 320)
                      : 208;
            const motif = page.locator('.student-hero-backdrop');
            check(
                (await motif.getAttribute('aria-hidden')) === 'true' &&
                    (await motif.evaluate(
                        (node) =>
                            getComputedStyle(node).pointerEvents === 'none',
                    )),
                width +
                    ': motif dekoratif tidak masuk aksesibilitas atau menghalangi kontrol.',
            );
            check(
                (await motif.getAttribute('data-hero-theme')) === 'projects' &&
                    (await motif.locator('img').evaluate(async (img) => {
                        await img.decode();

                        return (
                            img.naturalWidth > 0 &&
                            img.alt === '' &&
                            img.currentSrc.includes(
                                '/images/student-hero-projects',
                            )
                        );
                    })),
                width +
                    ': latar rancangan responsif termuat tanpa teks alternatif dekoratif.',
            );
            check(
                (await page
                    .locator(
                        '.student-menu-hero__archive, .student-menu-hero__ledger, .student-menu-hero__paper',
                    )
                    .count()) === 0,
                width + ': latar tidak ditumpuk watermark dan dekorasi lama.',
            );
            check(
                Math.abs(bird.width - expectedBirdWidth) < 1,
                width + ': ukuran maskot mengikuti rumus Beranda.',
            );
            check(
                Math.abs(bird.y + bird.height - hero.y - hero.height - 27) <
                    1 &&
                    Math.abs(
                        hero.x +
                            hero.width -
                            bird.x -
                            bird.width -
                            (width >= 1024 ? 29 : width >= 640 ? 9 : 1),
                    ) < 1 &&
                    (await page
                        .getByTestId('project-discovery-header')
                        .evaluate(
                            (node) =>
                                getComputedStyle(node).overflow === 'visible',
                        )),
                width +
                    ': posisi kanan/bawah seperti Beranda dan siluet tidak terklip.',
            );
            check(
                Math.abs(hero.x - result.x) < 2 &&
                    Math.abs(hero.width - result.width) < 2,
                width + ': batas hero dan hasil sejajar.',
            );
            const cardBoxes = await page
                .getByTestId('project-row')
                .evaluateAll((rows) =>
                    rows.map((row) => ({
                        top: row.getBoundingClientRect().top,
                        left: row.getBoundingClientRect().left,
                    })),
                );
            check(
                result.width >= 864
                    ? Math.abs(cardBoxes[0].top - cardBoxes[1].top) < 2
                    : cardBoxes[1].top > cardBoxes[0].top,
                width + ': grid mengikuti lebar region.',
            );
            check(
                (await page
                    .locator('[data-pose="project-plan"] button')
                    .count()) === 0,
                width + ': maskot dekoratif tanpa tombol sapaan.',
            );
            await page.screenshot({
                path: path.join(artifacts, 'projects-' + width + '.png'),
                fullPage: true,
            });
        }

        await page.setViewportSize({ width: 1366, height: 900 });
        await load();
        const advanced = page.getByTestId('project-advanced-filters');
        await advanced.locator('summary').focus();
        await advanced.locator('summary').press('Enter');
        check(
            (await advanced.getAttribute('open')) !== null,
            'Filter tambahan dapat dibuka dengan keyboard.',
        );
        await noOverflow('Filter tambahan desktop');
        await page.setViewportSize({ width: 320, height: 900 });
        await noOverflow('Filter tambahan mobile');
        await page.setViewportSize({ width: 1366, height: 900 });
        await page.locator('#project-sort').selectOption('deadline');
        await page.locator('#project-direction').selectOption('asc');
        await page.locator('#project-per-page').selectOption('20');
        await page.getByTestId('project-apply-filters').click();
        await page.waitForURL(
            (url) => url.searchParams.get('per_page') === '20',
        );
        check(
            new URL(page.url()).searchParams.get('sort') === 'deadline' &&
                new URL(page.url()).searchParams.get('direction') === 'asc',
            'Urutan dan jumlah hasil dikirim eksplisit ke server.',
        );
        await load();
        const first = page.getByTestId('project-row').first();
        check(
            (await first.innerText()).includes('Menerima pemula') &&
                (await first.innerText()).includes(
                    'Penerimaan pemula belum dinyatakan',
                ),
            'Pernyataan pemula tiga keadaan tidak disimpulkan otomatis.',
        );
        check(
            (await first.innerText()).includes(
                '2 terisi dari 5. 3 tempat tersisa.',
            ),
            'Kapasitas tim tetap bersumber agregat server.',
        );
        check(
            (await page.getByTestId('project-row').nth(1).innerText()).includes(
                'Kapasitas tim penuh.',
            ),
            'Tim penuh tidak ditawarkan seolah masih kosong.',
        );
        async function styles(locator) {
            return locator.evaluate((node) => {
                const s = getComputedStyle(node);

                return [
                    s.backgroundColor,
                    s.borderColor,
                    s.boxShadow,
                    s.transform,
                ].join('|');
            });
        }

        for (const [target, name] of [
            [page.getByTestId('create-project-link'), 'Buat proyek'],
            [first, 'Kartu peluang'],
        ]) {
            await page.mouse.move(0, 0);
            const before = await styles(target);
            await target.hover();
            check(
                before === (await styles(target)),
                name + ': tidak berubah saat hover.',
            );
        }

        await page.getByTestId('create-project-link').focus();
        check(
            await page
                .getByTestId('create-project-link')
                .evaluate(
                    (node) =>
                        getComputedStyle(node).outlineStyle !== 'none' ||
                        getComputedStyle(node).boxShadow !== 'none',
                ),
            'Aksi utama memiliki indikator fokus keyboard.',
        );
        const mascot = page.locator('[data-pose="project-plan"] img');
        check(
            await mascot.evaluate(
                (img) =>
                    getComputedStyle(img).animationName === 'none' &&
                    getComputedStyle(img).transform === 'none',
            ),
            'Maskot statis dan menghormati reduced motion.',
        );
        check(
            (
                await page
                    .getByTestId('create-project-link')
                    .getAttribute('href')
            ).includes('institution_id=99002'),
            'Buat proyek mempertahankan konteks universitas.',
        );
        await page.getByTestId('project-beginner-shortcut').click();
        await page.waitForURL(
            (url) => url.searchParams.get('beginner') === 'accepting',
        );
        check(
            new URL(page.url()).searchParams.get('availability') ===
                'available' &&
                (await page
                    .getByTestId('project-beginner-shortcut')
                    .getAttribute('aria-pressed')) === 'true',
            'Pintasan pemula menerapkan filter server dan selected state.',
        );
        await page.locator('#project-search').fill('belum diterapkan');
        await page
            .getByRole('button', { name: 'Halaman berikutnya', exact: true })
            .click();
        await page.waitForURL((url) => url.searchParams.get('page') === '2');
        check(
            !new URL(page.url()).searchParams.has('q') &&
                new URL(page.url()).searchParams.get('beginner') ===
                    'accepting',
            'Pagination memakai filter diterapkan, bukan draft pencarian.',
        );
        await page.locator('#project-search').fill('tidak-cocok');
        delay = 400;
        await page.getByTestId('project-apply-filters').click();
        await page.getByTestId('projects-refresh-skeleton').waitFor();
        check(
            (await page
                .getByTestId('projects-results')
                .getAttribute('aria-busy')) === 'true',
            'Refresh memakai skeleton regional dan aria-busy.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'projects-loading.png'),
            fullPage: true,
        });
        await page.getByTestId('projects-empty').waitFor();
        delay = 0;
        check(
            (await page.getByTestId('project-row').count()) === 0,
            'Hasil kosong tidak dipalsukan sebagai loading atau data contoh.',
        );
        await page.getByTestId('projects-reset-empty').click();
        await page.getByTestId('project-row').first().waitFor();
        check(
            new URL(page.url()).searchParams.get('q') === null,
            'Reset mengembalikan filter default server.',
        );
        await page
            .getByTestId('project-views')
            .getByRole('button', { name: 'Proyek saya', exact: true })
            .click();
        await page.waitForURL((url) => url.searchParams.get('view') === 'mine');
        check(
            (await page.getByTestId('project-row').innerText()).includes(
                'Draft proyek saya',
            ) &&
                (await page
                    .getByTestId('project-beginner-shortcut')
                    .count()) === 0,
            'Proyek saya memuat draft privat dan tidak menampilkan pintasan peluang.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'projects-mine.png'),
            fullPage: true,
        });
        await page.locator('#project-search').fill('tidak-cocok');
        await page.getByTestId('project-apply-filters').click();
        await page.getByTestId('projects-empty').waitFor();
        await page
            .getByTestId('projects-empty')
            .getByRole('button', { name: 'Temukan peluang', exact: true })
            .click();
        await page.waitForURL(
            (url) => url.searchParams.get('view') === 'opportunities',
        );

        for (const mode of [403, 500, 'network']) {
            failure = mode;
            await page.locator('#project-search').fill('draft aman');
            await page.getByTestId('project-apply-filters').click();
            await page.getByTestId('projects-error').waitFor();
            check(
                (await page.getByTestId('project-row').count()) === 0 &&
                    (await page.locator('#project-search').inputValue()) ===
                        'draft aman',
                mode + ': snapshot lama disembunyikan, draft tetap tersedia.',
            );

            if (mode === 403) {
                check(
                    (
                        await page.getByTestId('projects-error').innerText()
                    ).includes('tidak dapat diakses'),
                    'Forbidden dijelaskan tanpa membocorkan resource.',
                );
            }

            await page
                .getByTestId('projects-error')
                .getByRole('button', { name: 'Coba lagi', exact: true })
                .click();
            await page.getByTestId('project-row').first().waitFor();
            check(
                (await page.getByTestId('projects-error').count()) === 0,
                mode + ': retry memulihkan hasil.',
            );
        }

        sidebarOpen = false;
        await load();
        await noOverflow('Sidebar ditutup');
        longContent = true;

        for (const width of [320, 1366]) {
            await page.setViewportSize({ width, height: 900 });
            await load();
            await noOverflow('Nama proyek, pemilik dan peran panjang ' + width);
        }

        longContent = false;
        await load();
        await page
            .locator('html')
            .evaluate((node) => (node.style.fontSize = '200%'));
        await noOverflow('Teks 200 persen');
        await page.screenshot({
            path: path.join(artifacts, 'projects-text-200.png'),
            fullPage: true,
        });
        await page.emulateMedia({ reducedMotion: 'no-preference' });

        for (const width of [390, 1366]) {
            await page.setViewportSize({ width, height: 900 });
            await load();
            const entrance = await mascot.evaluate((img) => {
                const animation = img.getAnimations()[0];
                const style = getComputedStyle(img);

                if (!animation) {
                    return null;
                }

                animation.pause();
                animation.currentTime = 0;
                const start = getComputedStyle(img).opacity;
                animation.currentTime = 210;
                const middle = getComputedStyle(img).opacity;
                animation.finish();

                return {
                    name: style.animationName,
                    duration: animation.effect.getTiming().duration,
                    iterations: animation.effect.getTiming().iterations,
                    start: Number(start),
                    middle: Number(middle),
                    end: Number(getComputedStyle(img).opacity),
                };
            });
            check(
                entrance?.name === 'satu-mascot-enter' &&
                    entrance.duration === 420 &&
                    entrance.iterations === 1,
                width +
                    ': animasi masuk sama dengan Beranda dan tidak berulang.',
            );
            check(
                entrance.start === 0 &&
                    entrance.middle > 0 &&
                    entrance.middle < 1 &&
                    entrance.end === 1,
                width +
                    ': fade memiliki frame awal, antara dan akhir yang halus.',
            );
            await noOverflow('Animasi masuk ' + width);
            await page.screenshot({
                path: path.join(artifacts, 'projects-motion-' + width + '.png'),
                fullPage: true,
            });
            await mascot.evaluate((img) => {
                window.__qaMascotAnimation = img.getAnimations()[0];
            });
            const box = await mascot.boundingBox();
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            check(
                await mascot.evaluate(
                    (img) =>
                        img.getAnimations()[0] === window.__qaMascotAnimation &&
                        img.getAnimations()[0].playState === 'finished',
                ),
                width + ': hover tidak memulai ulang animasi.',
            );
            await page
                .getByTestId('project-views')
                .getByRole('button', { name: 'Proyek saya', exact: true })
                .click();
            await page.waitForURL(
                (url) => url.searchParams.get('view') === 'mine',
            );
            check(
                await mascot.evaluate(
                    (img) =>
                        img.getAnimations()[0] === window.__qaMascotAnimation &&
                        img.getAnimations()[0].playState === 'finished',
                ),
                width + ': pergantian tampilan mempertahankan pose akhir.',
            );
        }

        await page.emulateMedia({ reducedMotion: 'reduce' });
        check(
            await mascot.evaluate(
                (img) =>
                    getComputedStyle(img).animationName === 'none' &&
                    getComputedStyle(img).opacity === '1',
            ),
            'Reduced motion langsung menampilkan maskot tanpa animasi.',
        );
        check(
            errors.length === 0,
            'Tidak ada exception browser: ' + errors.join('; '),
        );
        check(
            mutations.length === 0 && requests.length > 10,
            'Semua interaksi daftar hanya GET pada fixture sintetis.',
        );
        console.log(JSON.stringify({ checks, artifacts }));
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
