const assert = require('node:assert/strict');
const { chromium } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
const fs = require('node:fs'),
    os = require('node:os'),
    path = require('node:path');
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-t08-browser-'));
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://localhost:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
    'Hanya server lokal.',
);
const date = '2030-10-10T09:00:00Z',
    person = { id: 99003, name: 'Mahasiswa. Data sintetis' };
const mutations = [],
    errors = [],
    reads = [];
let checks = 0,
    failure = null,
    readFailure = null,
    delay = 0,
    contribution,
    selectedRole = 'student',
    confirmChoice = true,
    listCanCreate = true,
    listEmpty = false;
const rev = (n) => String(n).repeat(64);
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}
function reset(status = 'draft') {
    failure = readFailure = null;
    delay = 0;
    const version = {
        id: 99011,
        version_number: 1,
        claim: 'Menyusun desain individual. Data sintetis',
        summary:
            'Saya menyusun rancangan, bukan mengerjakan seluruh hasil tim.',
        declaration: 'Pernyataan privat sintetis.',
        task: { id: 99010, title: 'Rancangan bersama' },
        created_by: person,
        created_at: date,
        evidence: [
            {
                id: 99030,
                attachment_id: 99020,
                source_label: 'hasil.txt',
                notes: null,
                available: true,
                attachment: {
                    id: 99020,
                    original_name: 'hasil.txt',
                    mime_type: 'text/plain',
                    size_bytes: 80,
                },
            },
        ],
    };
    contribution = {
        id: 99040,
        revision: rev(1),
        project: { id: 99001, title: 'Proyek kolaborasi. Data sintetis' },
        owner: person,
        status,
        current_version_id: version.id,
        current_version: version,
        versions: [version],
        reviews:
            status === 'revision'
                ? [
                      {
                          id: 99050,
                          contribution_version_id: version.id,
                          decision: 'revision',
                          reviewer: { id: 99005, name: 'Peninjau kampus' },
                          policy_version: 'contribution-review-v1',
                          reason: 'Jelaskan bagian desain dan ganti bukti.',
                          note: null,
                          reviewed_at: date,
                          created_at: date,
                      },
                  ]
                : [],
        provenance: { timeline: [], portfolio: null },
        created_at: date,
        updated_at: date,
    };
}
const projects = [
    {
        id: 99001,
        title: 'Proyek kolaborasi. Data sintetis',
        status: 'open',
        tasks: [{ id: 99010, title: 'Rancangan bersama', status: 'done' }],
        evidence: [99020, 99021].map((id) => ({
            id,
            original_name: 'hasil-' + id + '.txt',
            mime_type: 'text/plain',
            size_bytes: 80,
            created_at: date,
        })),
    },
];
(async () => {
    const html = await (await fetch(qaOrigin + '/')).text(),
        tag = /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/;
    const initial = JSON.parse(html.match(tag)[2]),
        head = html
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
    const browser = await chromium.launch({
        ...(process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {}),
    });

    try {
        const context = await browser.newContext({
            reducedMotion: 'reduce',
            timezoneId: 'Asia/Bangkok',
        });
        await context.grantPermissions(['local-network-access'], {
            origin: qaOrigin,
        });
        await context.addInitScript(() => {
            for (const id of [
                'student-dashboard-journey-v1',
                'student-menu-tour-v1',
            ]) {
                localStorage.setItem(
                    'satu:feature-guide:' + id + ':user:99003',
                    'seen',
                );
            }
        });
        function payload(url) {
            const campus = url.pathname.includes('/campus/'),
                create = url.pathname.endsWith('/create'),
                listing = url.pathname === '/contributions';
            selectedRole = campus ? 'campus_admin' : 'student';
            const props = {
                ...initial.props,
                name: 'SATU',
                sidebarOpen: true,
                onboarding: null,
                errors: {},
                auth: {
                    user: {
                        ...person,
                        username: 'PRIVATE_USERNAME',
                        created_at: date,
                        updated_at: date,
                        workspace: {
                            role: selectedRole,
                            institution: {
                                id: 99002,
                                name: 'Kampus A. Data sintetis',
                            },
                            recruiterOrganization: null,
                        },
                    },
                },
                shell: {
                    institutionMembership: {
                        institutionName: 'Kampus A. Data sintetis',
                        status: 'verified',
                    },
                },
                projects,
                can_create: true,
                permissions: {
                    can_update: ['draft', 'revision'].includes(
                        contribution.status,
                    ),
                    can_submit: contribution.status === 'draft',
                },
                contribution: structuredClone(contribution),
            };

            if (listing) {
                props.can_create = listCanCreate;
                props.contributions = listEmpty
                    ? []
                    : [
                          {
                              id: contribution.id,
                              project: contribution.project,
                              status: contribution.status,
                              current_version: contribution.current_version
                                  ? {
                                        id: contribution.current_version.id,
                                        version_number:
                                            contribution.current_version
                                                .version_number,
                                        task: contribution.current_version.task,
                                    }
                                  : null,
                              created_at: date,
                              updated_at: date,
                          },
                      ];
            }

            if (campus) {
                props.institution = {
                    id: 99002,
                    name: 'Kampus A. Data sintetis',
                };
                const status = url.searchParams.get('status') || 'pending';
                const q = url.searchParams.get('q') || '';
                const matches =
                    contribution.status !== 'draft' &&
                    (status === 'all' || status === contribution.status) &&
                    [
                        person.name,
                        contribution.project.title,
                        contribution.current_version.claim,
                        contribution.current_version.summary,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(q.toLowerCase());
                props.filters = {
                    status,
                    sort: url.searchParams.get('sort') || 'oldest',
                    q,
                };
                props.reviewQueue = {
                    items: matches
                        ? [
                              {
                                  ...structuredClone(contribution),
                                  reference: 'CN-099040',
                                  contributor: person,
                                  submitted_at: date,
                              },
                          ]
                        : [],
                    pagination: {
                        current_page: 1,
                        last_page: 1,
                        per_page: 25,
                        total: matches ? 1 : 0,
                    },
                    summary: {
                        total: 1,
                        pending: contribution.status === 'pending' ? 1 : 0,
                        approved: contribution.status === 'approved' ? 1 : 0,
                        revision: 0,
                        rejected: 0,
                    },
                };
            }

            return {
                ...initial,
                component: campus
                    ? 'campus/contributions'
                    : listing
                      ? 'contributions/index'
                      : create
                        ? 'contributions/create'
                        : 'contributions/show',
                url: url.pathname + url.search,
                props,
                deferredProps: undefined,
            };
        }
        await context.route('**/*', async (route) => {
            const req = route.request(),
                url = new URL(req.url());

            if (url.hostname.includes('google')) {
                return route.abort();
            }

            if (url.origin !== qaOrigin) {
                if (req.method() !== 'GET') {
                    return route.abort();
                }

                return route.fallback();
            }

            if (url.pathname.includes('_boost/browser-logs')) {
                return route.fulfill({ status: 204 });
            }

            if (req.method() !== 'GET') {
                mutations.push({
                    path: url.pathname,
                    body: req.postDataJSON(),
                });

                if (delay) {
                    await new Promise((r) => setTimeout(r, delay));
                }

                if (failure === 'network') {
                    return route.abort('failed');
                }

                if (failure) {
                    return route.fulfill({
                        status: failure,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            message: 'Gangguan sintetis',
                            ...(failure === 422
                                ? {
                                      errors:
                                          selectedRole === 'campus_admin'
                                              ? {
                                                    reason: [
                                                        'Alasan perlu diperiksa.',
                                                    ],
                                                }
                                              : {
                                                    claim: [
                                                        'Judul perlu diperiksa.',
                                                    ],
                                                },
                                  }
                                : {}),
                        }),
                    });
                }

                const body = req.postDataJSON();

                if (url.pathname.endsWith('/submit')) {
                    contribution.status = 'pending';
                    contribution.revision = rev(2);
                } else if (url.pathname.endsWith('/review')) {
                    contribution.status = body.decision;
                    contribution.revision = rev(2);
                } else if (url.pathname.endsWith('/revision')) {
                    contribution.current_version = {
                        ...contribution.current_version,
                        id: 99012,
                        version_number: 2,
                        claim: body.claim,
                        summary: body.summary,
                    };
                    contribution.current_version_id = 99012;
                    contribution.revision = rev(2);
                    contribution.status = 'draft';
                }

                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: contribution,
                        permissions: {
                            can_update: contribution.status === 'draft',
                            can_submit: contribution.status === 'draft',
                        },
                    }),
                });
            }

            if (
                !req.isNavigationRequest() &&
                !req.headers()['x-inertia'] &&
                req.headers()['accept']?.includes('application/json') &&
                url.pathname.includes('/contributions/99040')
            ) {
                reads.push(url.pathname);

                if (readFailure) {
                    return readFailure === 'network'
                        ? route.abort('failed')
                        : route.fulfill({
                              status: readFailure,
                              contentType: 'application/json',
                              body: '{}',
                          });
                }

                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: contribution,
                        permissions: {
                            can_update: ['draft', 'revision'].includes(
                                contribution.status,
                            ),
                            can_submit: contribution.status === 'draft',
                        },
                    }),
                });
            }

            if (!req.isNavigationRequest() && !req.headers()['x-inertia']) {
                return route.fallback();
            }

            reads.push(url.pathname);

            if (url.pathname === '/contributions' && delay) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            if (req.headers()['x-inertia'] && readFailure) {
                return readFailure === 'network'
                    ? route.abort('failed')
                    : route.fulfill({
                          status: readFailure,
                          contentType: 'text/html',
                          body: 'Gangguan sintetis',
                      });
            }

            const data = payload(url);

            return req.headers()['x-inertia']
                ? route.fulfill({
                      status: 200,
                      contentType: 'application/json',
                      headers: { 'X-Inertia': 'true' },
                      body: JSON.stringify(data),
                  })
                : route.fulfill({
                      status: 200,
                      contentType: 'text/html',
                      body: template.replace(
                          tag,
                          (_, a, b, c) => a + JSON.stringify(data) + c,
                      ),
                  });
        });
        const page = await context.newPage();
        page.on('pageerror', (e) => {
            errors.push(e.message);
            console.error('JS ' + e.message);
        });
        page.on('dialog', (d) => (confirmChoice ? d.accept() : d.dismiss()));
        page.setDefaultTimeout(15000);
        const el = (name) => page.locator('[data-test="' + name + '"]');
        async function load(surface = 'show') {
            await page.goto(
                qaOrigin +
                    (surface === 'campus'
                        ? '/campus/99002/contributions'
                        : surface === 'create'
                          ? '/contributions/create'
                          : surface === 'index'
                            ? '/contributions'
                            : '/contributions/99040'),
                { waitUntil: 'domcontentloaded' },
            );
            await el(
                surface === 'campus'
                    ? 'campus-contribution-review-root'
                    : surface === 'create'
                      ? 'contribution-create-root'
                      : surface === 'index'
                        ? 'contributions-root'
                        : 'contribution-detail-root',
            ).waitFor();
        }
        async function layout(name) {
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                name + ' tanpa overflow horizontal.',
            );
            await page.screenshot({
                path: path.join(artifacts, name + '.png'),
                fullPage: true,
            });
        }
        reset();
        const master = fs.readFileSync(
            path.join(
                __dirname,
                '../../resources/images/mascot/mascot-contribution-notes.png',
            ),
        );
        check(
            master.readUInt32BE(16) >= 1024 && master[25] === 6,
            'Maskot Kontribusi memiliki master HD transparan.',
        );

        for (const suffix of ['-256', '-512', '']) {
            const image = fs.readFileSync(
                path.join(
                    __dirname,
                    '../../public/images/mascot-contribution-notes' +
                        suffix +
                        '.webp',
                ),
            );
            check(
                image.toString('ascii', 8, 12) === 'WEBP' &&
                    image.length < 200000,
                'Varian maskot Kontribusi ' +
                    (suffix || '1024') +
                    ' teroptimasi.',
            );
        }

        for (const width of [320, 390, 768, 1366, 1920, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await load('index');
            check(
                await page
                    .locator('.student-menu-hero__actions')
                    .evaluate(
                        (actions) =>
                            parseFloat(getComputedStyle(actions).marginTop) ===
                            (innerWidth >= 640 ? 48 : 36),
                    ),
                'Kontribusi: tombol dan catatan hero turun selaras pada ' +
                    width +
                    'px.',
            );
            const bird = page.locator('[data-pose="contribution-notes"] img');
            await bird.evaluate((img) => img.decode());
            const box = await bird.boundingBox();
            const hero = await el('contributions-header').boundingBox();
            const root = await el('contributions-root').boundingBox();
            const expectedWidth =
                width >= 1024
                    ? Math.min((hero.width - 2) * 0.36, 384)
                    : width >= 640
                      ? Math.min((hero.width - 2) * 0.39, 320)
                      : 208;
            check(
                Math.abs(box.width - expectedWidth) < 1 &&
                    Math.abs(box.y + box.height - hero.y - hero.height - 27) <
                        1 &&
                    Math.abs(
                        hero.x +
                            hero.width -
                            box.x -
                            box.width -
                            (width >= 1024 ? 29 : width >= 640 ? 9 : 1),
                    ) < 1 &&
                    (await el('contributions-header').evaluate(
                        (node) => getComputedStyle(node).overflow === 'visible',
                    )),
                width +
                    ': ukuran/posisi maskot Kontribusi mengikuti Beranda tanpa clipping.',
            );
            check(
                Math.abs(root.x - hero.x) < 1 &&
                    Math.abs(root.width - hero.width) < 1,
                width + ': hero mengikuti batas konten Beranda/Proyek.',
            );
            check(
                (await el('contributions-header').innerText()).includes(
                    'Bukti privat tetap mengikuti izin akses',
                ),
                width + ': batas bukti privat tetap terbaca.',
            );
            check(
                (await page
                    .locator('[data-pose="contribution-notes"] button')
                    .count()) === 0 &&
                    (await page
                        .locator('.student-hero-backdrop')
                        .getAttribute('aria-hidden')) === 'true',
                width + ': maskot dan motif hanya dekorasi.',
            );
            await layout('kontribusi-hero-' + width);
        }

        for (const status of [
            'draft',
            'pending',
            'revision',
            'approved',
            'rejected',
            'archived',
        ]) {
            reset(status);
            await load('index');
            check(
                (await el('contribution-row-99040').count()) === 1,
                status + ': catatan tetap dapat dibuka tanpa perubahan status.',
            );
        }

        listCanCreate = false;
        listEmpty = true;
        await load('index');
        check(
            (await el('contributions-header')
                .locator('[data-test="create-contribution-link"]')
                .count()) === 0 &&
                (await el('contributions-empty').innerText()).includes(
                    'Bergabunglah dengan proyek terlebih dahulu',
                ),
            'Tanpa izin menyusun, hero tidak menawarkan pengajuan dan pemulihan proyek tetap tersedia.',
        );
        listCanCreate = true;
        await load('index');
        check(
            (await el('contributions-header')
                .locator('[data-test="create-contribution-link"]')
                .count()) === 1,
            'Izin menyusun membuka CTA hero pada keadaan kosong.',
        );
        listEmpty = false;
        await load('index');
        delay = 450;
        await el('contributions-refresh').click();
        await el('contributions-loading').waitFor();
        check(
            await el('contributions-refresh').isDisabled(),
            'Refresh memakai skeleton regional dan mengunci hanya tombol terkait.',
        );
        await el('contributions-loading').waitFor({ state: 'hidden' });
        delay = 0;

        for (const mode of [500, 403, 'network']) {
            readFailure = mode;
            await el('contributions-refresh').click();
            await el('contributions-refresh-error').waitFor();
            check(
                (await el('contributions-ledger').count()) ===
                    (mode === 403 ? 0 : 1) &&
                    (await el('contributions-header')
                        .locator('[data-test="create-contribution-link"]')
                        .count()) === (mode === 403 ? 0 : 1),
                mode + ': state gagal mengikuti batas akses dan pemulihan.',
            );
            readFailure = null;
            await el('contributions-refresh').click();
            await el('contributions-refresh-error').waitFor({
                state: 'hidden',
            });
            await el('contributions-ledger').waitFor();
            check(
                (await el('contributions-header')
                    .locator('[data-test="create-contribution-link"]')
                    .count()) === 1,
                mode + ': GET memulihkan daftar serta tindakan sesuai izin.',
            );
        }

        await page.setViewportSize({ width: 1366, height: 900 });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await load('index');
        const bird = page.locator('[data-pose="contribution-notes"] img');
        check(
            await bird.evaluate((img) => {
                const animation = img.getAnimations()[0];

                if (!animation) {
                    return false;
                }

                window.__qaContributionAnimation = animation;
                animation.finish();

                return (
                    getComputedStyle(img).animationName ===
                        'satu-mascot-enter' &&
                    animation.effect.getTiming().duration === 420
                );
            }),
            'Animasi masuk Kontribusi memakai keyframe dan durasi Beranda/Proyek.',
        );
        const primary = el('contributions-header').locator(
            '[data-test="create-contribution-link"]',
        );
        const beforeHover = await primary.evaluate((node) =>
            [
                getComputedStyle(node).backgroundColor,
                getComputedStyle(node).boxShadow,
                getComputedStyle(node).transform,
            ].join('|'),
        );
        await primary.hover();
        check(
            beforeHover ===
                (await primary.evaluate((node) =>
                    [
                        getComputedStyle(node).backgroundColor,
                        getComputedStyle(node).boxShadow,
                        getComputedStyle(node).transform,
                    ].join('|'),
                )),
            'CTA hero tidak berubah warna, bayangan atau posisi saat hover.',
        );
        await primary.focus();
        check(
            await primary.evaluate(
                (node) =>
                    getComputedStyle(node).outlineStyle !== 'none' ||
                    getComputedStyle(node).boxShadow !== 'none',
            ),
            'CTA hero mempertahankan fokus keyboard.',
        );
        await el('contributions-refresh').click();
        await page.waitForFunction(
            () =>
                !document.querySelector('[data-test="contributions-refresh"]')
                    .disabled,
        );
        check(
            await bird.evaluate(
                (img) =>
                    img.getAnimations()[0] ===
                        window.__qaContributionAnimation &&
                    img.getAnimations()[0].playState === 'finished',
            ),
            'Refresh tidak mengulang animasi maskot.',
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        check(
            await bird.evaluate(
                (img) =>
                    getComputedStyle(img).animationName === 'none' &&
                    getComputedStyle(img).opacity === '1',
            ),
            'Reduced motion langsung menampilkan maskot akhir.',
        );
        await page.evaluate(
            () => (document.documentElement.style.fontSize = '200%'),
        );
        await layout('kontribusi-hero-text200');
        await page.evaluate(
            () => (document.documentElement.style.fontSize = ''),
        );
        check(
            mutations.length === 0,
            'Redesign hero dan refresh tidak mengirim command bisnis.',
        );
        reset();
        await load();

        for (const width of [320, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await layout('detail-' + width);
        }

        await page.setViewportSize({ width: 640, height: 900 });
        await page.evaluate(() => (document.documentElement.style.zoom = '2'));
        await layout('detail-zoom200');
        await page.evaluate(() => (document.documentElement.style.zoom = ''));
        await page.setViewportSize({ width: 1280, height: 900 });
        check(
            (await page
                .getByRole('link', { name: 'Unduh bukti privat' })
                .count()) === 1,
            'Pemilik dapat membuka unduh bukti privat berotorisasi.',
        );
        failure = 422;
        await el('contribution-submit').click();
        await el('contribution-submit-errors').waitFor();
        check(
            contribution.status === 'draft' &&
                !(await el('contribution-action-status').innerText()).includes(
                    'sudah dikirim',
                ),
            '422 pengiriman tidak mengklaim sukses.',
        );
        failure = null;
        await el('contribution-edit').click();
        await el('contribution-claim').fill('Draft lokal individual');
        failure = 409;
        await el('contribution-revision-submit').click();
        await el('contribution-action-error').waitFor();
        check(
            (await el('contribution-claim').inputValue()) ===
                'Draft lokal individual' &&
                (await el('contribution-revision-submit').isDisabled()),
            'Konflik mempertahankan draft dan menahan penyimpanan.',
        );
        contribution.current_version = {
            ...contribution.current_version,
            id: 99012,
            version_number: 2,
            claim: 'Versi server baru',
        };
        contribution.revision = rev(2);
        failure = null;
        await page
            .getByRole('button', { name: 'Periksa data terbaru', exact: true })
            .click();
        await el('contribution-use-latest').waitFor();
        check(
            (await el('contribution-claim').inputValue()) ===
                'Draft lokal individual',
            'GET tidak menimpa isian lokal atau token lama.',
        );
        confirmChoice = false;
        await el('contribution-use-latest').click();
        check(
            (await el('contribution-claim').inputValue()) ===
                'Draft lokal individual',
            'Pembatalan pemulihan tidak membuang draft.',
        );
        confirmChoice = true;
        await el('contribution-use-latest').click();
        await page.waitForFunction(
            () =>
                document.querySelector('[data-test="contribution-claim"]')
                    .value === 'Versi server baru',
        );
        check(
            !(await el('contribution-revision-submit').isDisabled()),
            'Pengambilan sumber terbaru membuka kembali editor secara eksplisit.',
        );
        failure = 422;
        await el('contribution-claim').fill('Isian 422');
        await el('contribution-revision-submit').click();
        await el('contribution-composer-errors').waitFor();
        check(
            (await el('contribution-claim').inputValue()) === 'Isian 422' &&
                (await page.evaluate(
                    () => document.activeElement?.dataset.test,
                )) === 'contribution-composer-errors',
            '422 revisi mempertahankan isian dan fokus ringkasan error.',
        );
        failure = 'network';
        await el('contribution-revision-submit').click();
        await el('contribution-action-error').waitFor();
        await page.waitForFunction(
            () =>
                document.querySelector(
                    '[data-test="contribution-revision-submit"]',
                ).disabled,
        );
        readFailure = 'network';
        await page
            .getByRole('button', { name: 'Periksa data terbaru', exact: true })
            .click();
        await page.waitForTimeout(150);
        check(
            await el('contribution-revision-submit').isDisabled(),
            'Kegagalan pembacaan setelah jaringan gagal tidak membuka retry mutasi.',
        );
        readFailure = null;
        failure = null;
        await page
            .getByRole('button', { name: 'Periksa data terbaru', exact: true })
            .click();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="contribution-revision-submit"]',
                ).disabled,
        );
        const before = mutations.length;
        delay = 180;
        await el('contribution-revision-submit').evaluate((b) => {
            b.click();
            b.click();
        });
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="contribution-revision-form"]',
                ),
        );
        check(
            mutations.length === before + 1 &&
                mutations.at(-1).body.expected_revision === rev(2),
            'Klik ganda revisi hanya satu command dengan revisi yang dibuka.',
        );
        delay = 0;
        readFailure = 403;
        await page
            .getByRole('button', { name: 'Periksa data terbaru', exact: true })
            .click();
        await el('contribution-access-denied').waitFor();
        check(
            (await el('contribution-detail-root').count()) === 0,
            '403 menyembunyikan catatan dan bukti privat lama.',
        );
        reset();
        await load('create');
        await el('contribution-task').selectOption('99010');
        await el('contribution-claim').fill('Klaim individual');
        await el('contribution-summary').fill(
            'Ringkasan yang dapat dibagikan.',
        );
        await el('contribution-evidence-guidance').locator('summary').click();
        check(
            (await el('contribution-evidence-guidance').innerText()).includes(
                'bukan standar bukti final',
            ),
            'Panduan tidak mengklaim standar atau SLA kampus yang sudah disepakati.',
        );
        await el('contribution-evidence-99020').check();
        await el('contribution-evidence-99021').check();
        await el('contribution-evidence-99020').uncheck();
        failure = 422;
        await el('contribution-create-submit').click();
        await el('contribution-composer-errors').waitFor();
        check(
            (await el('contribution-claim').inputValue()) ===
                'Klaim individual',
            '422 draft tidak bernavigasi atau menghapus isian.',
        );
        failure = 'network';
        await el('contribution-create-submit').click();
        await el('contribution-create-recovery').waitFor();
        check(
            await el('contribution-create-submit').isDisabled(),
            'Hasil create belum pasti menahan command dan meminta pemeriksaan daftar.',
        );

        for (const width of [320, 1280, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await layout('composer-' + width);
        }

        reset('pending');
        await load('campus');
        await el('campus-contribution-select-99040').click();
        check(
            (await page.evaluate(() => document.activeElement?.id)) ===
                'campus-review-decision-title',
            'Memilih berkas memindahkan fokus ke detail reviewer.',
        );

        for (const width of [320, 768, 1280, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await layout('review-' + width);
        }

        await page.setViewportSize({ width: 1280, height: 900 });
        await page
            .locator('#campus-contribution-review-reason')
            .fill('Alasan yang perlu diperiksa.');
        confirmChoice = false;
        await page
            .getByRole('button', { name: 'Hasil disetujui', exact: true })
            .click();
        check(
            new URL(page.url()).searchParams.get('status') !== 'approved' &&
                (await page
                    .locator('#campus-contribution-review-reason')
                    .inputValue()) === 'Alasan yang perlu diperiksa.',
            'Membatalkan perpindahan tampilan mempertahankan draft keputusan.',
        );
        confirmChoice = true;
        failure = 422;
        await el('campus-contribution-decision-submit').click();
        await page.waitForTimeout(250);
        check(
            (await page
                .locator('#campus-contribution-review-reason')
                .inputValue()) === 'Alasan yang perlu diperiksa.' &&
                (await el('campus-contribution-action-success').count()) === 0,
            '422 reviewer menjaga catatan tanpa sukses palsu.',
        );
        check(
            (await page.evaluate(() => document.activeElement?.id)) ===
                'campus-contribution-review-reason',
            'Fokus validasi reviewer menuju isian setelah processing selesai.',
        );
        failure = 409;
        await el('campus-contribution-decision-submit').click();
        await el('campus-contribution-recovery').waitFor();
        check(
            await el('campus-contribution-decision-submit').isDisabled(),
            '409 review menahan keputusan ganda.',
        );
        contribution.revision = rev(2);
        failure = null;
        await page
            .getByRole('button', {
                name: 'Periksa antrean terbaru',
                exact: true,
            })
            .click();
        await el('campus-contribution-use-latest').waitFor();
        check(
            (await page
                .locator('#campus-contribution-review-reason')
                .inputValue()) === 'Alasan yang perlu diperiksa.',
            'Refresh antrean mempertahankan alasan dan token keputusan lama.',
        );
        confirmChoice = false;
        await el('campus-contribution-use-latest').click();
        check(
            (await page
                .locator('#campus-contribution-review-reason')
                .inputValue()) === 'Alasan yang perlu diperiksa.',
            'Pembatalan penggunaan berkas terbaru menjaga catatan reviewer.',
        );
        confirmChoice = true;
        await el('campus-contribution-use-latest').click();
        await page.waitForFunction(
            () =>
                !document.querySelector(
                    '[data-test="campus-contribution-decision-submit"]',
                ).disabled,
        );
        const reviewBefore = mutations.length;
        delay = 180;
        await el('campus-contribution-decision-submit').evaluate((b) => {
            b.click();
            b.click();
        });
        await el('campus-contribution-action-success').waitFor();
        check(
            mutations.length === reviewBefore + 1 &&
                mutations.at(-1).body.expected_revision === rev(2),
            'Review memakai snapshot baru, dikirim sekali, dan menunggu respons server.',
        );
        reset('pending');
        await load('campus');
        await el('campus-contribution-select-99040').click();
        failure = 403;
        await el('campus-contribution-decision-submit').click();
        await page.waitForTimeout(200);
        check(
            (await el('campus-contribution-docket').count()) === 0,
            'Akses reviewer dicabut menyembunyikan berkas privat.',
        );
        reset();
        await load('create');
        check(
            (await el('contribution-task').inputValue()) === '' &&
                (await el('contribution-create-submit').isDisabled()),
            'Tugas sumber dipilih eksplisit, bukan otomatis mengambil tugas pertama.',
        );
        await el('contribution-task').selectOption('99010');
        await el('contribution-claim').fill('Klaim baru individual');
        await el('contribution-summary').fill(
            'Ringkasan karya yang dapat dibagikan.',
        );
        await el('contribution-create-submit').click();
        await el('contribution-detail-root').waitFor();
        check(
            !page.url().endsWith('/create'),
            'Simpan draft terkonfirmasi menuju detail tanpa dialog membuang isian yang sudah tersimpan.',
        );
        reset('revision');
        await load();
        await el('contribution-claim').fill('Perbaikan pekerjaan individual');
        await el('contribution-evidence-99020').uncheck();
        await el('contribution-evidence-99021').check();
        await el('contribution-revision-submit').click();
        await el('contribution-submit').waitFor();
        check(
            mutations.at(-1).body.evidence.length === 1 &&
                mutations.at(-1).body.evidence[0] === 99021,
            'Editor revisi mengirim pilihan pengganti lengkap, bukan membawa pilihan lama.',
        );
        await el('contribution-submit').click();
        await page.waitForFunction(() =>
            document
                .querySelector('[data-test="contribution-status"]')
                .textContent.includes('Menunggu'),
        );
        check(
            contribution.status === 'pending',
            'Versi perbaikan tersimpan dapat dikirim kembali tanpa memuat ulang halaman.',
        );
        reset('pending');
        await load('campus');
        await el('campus-contribution-select-99040').click();
        await page
            .locator('#campus-contribution-review-note')
            .fill('Catatan privat untuk pemilik.');
        failure = 'network';
        await el('campus-contribution-decision-submit').click();
        await el('campus-contribution-recovery').waitFor();
        const networkCount = mutations.length;
        readFailure = 'network';
        await page
            .getByRole('button', {
                name: 'Periksa antrean terbaru',
                exact: true,
            })
            .click();
        await el('campus-contribution-queue-error').waitFor();
        check(
            (await el('campus-contribution-decision-submit').isDisabled()) &&
                mutations.length === networkCount,
            'Jaringan reviewer dan refresh gagal tidak memicu pengiriman ulang otomatis.',
        );
        readFailure = null;
        failure = null;
        await el('campus-contribution-queue-error-retry').click();
        await el('campus-contribution-use-latest').waitFor();
        check(
            (await page
                .locator('#campus-contribution-review-note')
                .inputValue()) === 'Catatan privat untuk pemilik.',
            'Pemulihan antrean menjaga catatan reviewer setelah hasil belum pasti.',
        );
        await page.setViewportSize({ width: 1280, height: 320 });
        await layout('review-layar-pendek');
        await page.setViewportSize({ width: 640, height: 900 });
        await page.evaluate(() => (document.documentElement.style.zoom = '2'));
        await layout('review-zoom200');
        check(
            (await el('campus-contribution-guidance')
                .locator('summary')
                .evaluate((e) => getComputedStyle(e).cursor)) === 'pointer',
            'Bantuan reviewer memiliki cursor dan kontrol keyboard native.',
        );
        await page.evaluate(() => (document.documentElement.style.zoom = ''));
        reset();
        await load();
        await el('contribution-edit').click();
        await el('contribution-claim').fill('Draft pembatalan editor');
        confirmChoice = false;
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        check(
            (await el('contribution-claim').inputValue()) ===
                'Draft pembatalan editor',
            'Membatalkan penutupan editor menjaga draft lokal.',
        );
        confirmChoice = true;
        await page.getByRole('button', { name: 'Batal', exact: true }).click();
        check(
            await el('contribution-edit').evaluate(
                (e) => e === document.activeElement,
            ),
            'Menutup editor mengembalikan fokus ke pemicu edit.',
        );
        reset('approved');
        await load('campus');
        await page
            .getByRole('button', { name: 'Hasil disetujui', exact: true })
            .click();
        await page.waitForURL(
            (url) => url.searchParams.get('status') === 'approved',
        );
        await el('campus-contribution-result-99040').waitFor();
        check(
            (
                await el('campus-contribution-result-99040').textContent()
            ).includes(contribution.current_version.summary),
            'Hasil disetujui menampilkan ringkasan individual tanpa membuka izin berbagi baru.',
        );
        await el('campus-contribution-search').fill('tidak-ada-hasil');
        await page
            .getByRole('button', { name: 'Cari kontribusi', exact: true })
            .click();
        await page.waitForURL(
            (url) => url.searchParams.get('q') === 'tidak-ada-hasil',
        );
        await el('campus-contribution-queue-empty').waitFor();
        check(
            (
                await el('campus-contribution-queue-empty').textContent()
            ).includes('Belum ada hasil yang cocok'),
            'Pencarian kosong menjelaskan hasil sesuai filter.',
        );
        await el('campus-contribution-search').fill('');
        await page
            .getByRole('button', { name: 'Cari kontribusi', exact: true })
            .click();
        await el('campus-contribution-result-99040').waitFor();
        await el('campus-contribution-status-filter').selectOption('all');
        await page.waitForURL(
            (url) => url.searchParams.get('status') === 'all',
        );

        for (const width of [320, 1280, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await layout('hasil-disetujui-' + width);
        }

        check(
            errors.length === 0,
            'Tidak ada exception JavaScript pada alur sintetis.',
        );
        console.log(
            'PASS ' +
                checks +
                ' pemeriksaan browser. Seluruh mutasi dicegat. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e.stack);
    process.exit(1);
});
