const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium, selectors } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
selectors.setTestIdAttribute('data-test');
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://localhost:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
);
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-u04-browser-'));
let checks = 0;
function check(value, message) {
    assert.ok(value, message);
    checks++;
    console.log('PASS ' + message);
}

(async () => {
    const workspace = path.resolve(__dirname, '../..');
    const master = fs.readFileSync(
        path.join(
            workspace,
            'resources/images/mascot/mascot-affiliation-check.png',
        ),
    );
    check(
        master.readUInt32BE(16) >= 1024 &&
            master.readUInt32BE(16) === master.readUInt32BE(20) &&
            master[25] === 6,
        'Maskot afiliasi mempunyai master HD transparan.',
    );

    for (const suffix of ['-256', '-512', '']) {
        const image = fs.readFileSync(
            path.join(
                workspace,
                'public/images/mascot-affiliation-check' + suffix + '.webp',
            ),
        );
        check(
            image.toString('ascii', 0, 4) === 'RIFF' &&
                image.toString('ascii', 8, 12) === 'WEBP' &&
                image.length < 200000,
            'Asset afiliasi ' + (suffix || '1024') + ': WebP nyata dan ringan.',
        );
    }

    for (const suffix of ['-768', '-1280', '']) {
        const image = fs.readFileSync(
            path.join(
                workspace,
                'public/images/dashboard-affiliation-campus' + suffix + '.webp',
            ),
        );
        check(
            image.toString('ascii', 0, 4) === 'RIFF' &&
                image.toString('ascii', 8, 12) === 'WEBP' &&
                image.length < 200000,
            'Panorama kampus ' +
                (suffix || '2560') +
                ': WebP nyata dan ringan.',
        );
    }

    const waitingMaster = fs.readFileSync(
        path.join(workspace, 'resources/images/mascot/mascot-waiting-lap.png'),
    );
    check(
        waitingMaster.readUInt32BE(20) >= 1024 &&
            waitingMaster.readUInt32BE(16) === waitingMaster.readUInt32BE(20) &&
            waitingMaster[25] === 6,
        'Maskot menunggu dengan buku di pangkuan mempunyai master HD transparan.',
    );
    const waitingProvenance = JSON.parse(
        fs.readFileSync(
            path.join(
                workspace,
                'resources/images/mascot/waiting-lap-mascot.provenance.json',
            ),
            'utf8',
        ),
    );

    for (const suffix of ['-256', '-512', '']) {
        const image = fs.readFileSync(
            path.join(
                workspace,
                'public/images/mascot-waiting-lap' + suffix + '.webp',
            ),
        );
        check(
            image.toString('ascii', 0, 4) === 'RIFF' &&
                image.toString('ascii', 8, 12) === 'WEBP' &&
                image.length < 200000,
            'Asset menunggu ' + (suffix || '1024') + ': WebP nyata dan ringan.',
        );
    }

    for (const [name, variants] of [
        ['dashboard-review-document', ['-256', '']],
        ['dashboard-project-folder', ['-128', '']],
    ]) {
        const master = fs.readFileSync(
            path.join(workspace, 'resources/images/mascot/' + name + '.png'),
        );
        check(
            master.readUInt32BE(16) >= 1024 && master[25] === 6,
            name + ': master HD dengan alpha.',
        );

        for (const suffix of variants) {
            const image = fs.readFileSync(
                path.join(
                    workspace,
                    'public/images/' + name + suffix + '.webp',
                ),
            );
            check(
                image.toString('ascii', 8, 12) === 'WEBP' &&
                    image.length < 30000,
                name + suffix + ': WebP dekoratif teroptimasi.',
            );
        }
    }

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
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const errors = [],
        assetErrors = [],
        mutations = [];
    let state,
        failure,
        profileWrites = 0;
    const fresh = () => ({
        required: false,
        universityState: 'ready',
        institutionId: 99002,
        institutionName: 'Universitas Teknologi Yogyakarta. Data synthetic',
        membershipStatus: 'unverified',
        affiliationStatus: null,
        matchResult: null,
        phoneVerified: true,
        canSubmitAffiliation: true,
        hasLegacyAffiliation: false,
        needsRosterRefresh: false,
        profileId: null,
        nim: '',
        studyProgram: '',
        faculty: '',
        admissionYear: null,
        academicOptions: {
            'Fakultas Sains & Teknologi': [
                'Informatika (S1)',
                'Sistem Informasi (S1)',
                'Teknik Sipil (S1)',
                'Teknik Elektro (S1)',
                'Teknik Komputer (S1)',
                'Teknik Industri (S1)',
                'Perencanaan Wilayah Kota (S1)',
                'Arsitektur (S1)',
                'Informatika Medis (S1)',
                'Data Sains (S1)',
            ],
            'Fakultas Bisnis & Humaniora': [
                'Akuntansi (S1)',
                'Akuntansi (D3)',
                'Manajemen (S1)',
                'Ilmu Komunikasi (S1)',
                'Ilmu Hubungan Internasional (S1)',
                'Bimbingan dan Konseling (S1)',
                'Pendidikan Bahasa Inggris (S1)',
                'Pendidikan Teknologi Informasi (S1)',
                'Pariwisata (S1)',
            ],
        },
        bio: '',
        skillsCount: 0,
        availabilityCount: 0,
    });
    function payload(url) {
        const props = {
            ...initial.props,
            errors: {},
            sidebarOpen: state.qaSidebarOpen ?? false,
            auth: {
                user: {
                    id: 99001,
                    name: state.qaUserName ?? 'Mahasiswa. Data synthetic',
                    created_at: '2026-10-14T10:00:00Z',
                    updated_at: '2026-10-14T10:00:00Z',
                    workspace: {
                        role: 'student',
                        institution: null,
                        recruiterOrganization: null,
                    },
                },
            },
            onboarding: state,
            academicOptions: state.academicOptions,
            shell: {
                institutionMembership:
                    state.institutionId &&
                    state.membershipStatus !== 'unverified'
                        ? {
                              institutionName: state.institutionName,
                              status: state.membershipStatus,
                          }
                        : null,
            },
            institution: state.institutionId
                ? {
                      id: state.institutionId,
                      name: state.institutionName,
                      timezone: 'Asia/Jakarta',
                  }
                : null,
            access: state.membershipStatus,
            profile: null,
            taxonomies: [],
            approvedSources: [],
        };

        const destination =
            url.pathname === '/institution-memberships'
                ? '/dashboard'
                : url.pathname + url.search;

        if (destination === '/dashboard') {
            Object.assign(props, {
                nextAction: {
                    reference: 'SYNTHETIC',
                    category: 'Afiliasi kampus',
                    recordedAt: 'Data synthetic',
                    recordedAtIso: '2026-10-14T10:00:00Z',
                    statusLabel: state.qaFullDashboardFacts
                        ? 'Menunggu tinjauan'
                        : 'Perlu diperiksa',
                    statusTone: 'pending',
                    title: state.qaFullDashboardFacts
                        ? 'Periksa afiliasi yang sedang ditinjau kampus'
                        : 'Periksa afiliasi. Data synthetic',
                    facts: state.qaFullDashboardFacts
                        ? [
                              {
                                  icon: 'building',
                                  label: 'Afiliasi',
                                  value: state.institutionName,
                              },
                              {
                                  icon: 'profile',
                                  label: 'Status saat ini',
                                  value: 'Draft onboarding tetap tersedia; penyimpanan profil menunggu verifikasi.',
                              },
                              {
                                  icon: 'user',
                                  label: 'Menunggu verifikasi',
                                  value: 'Penyimpanan profil dan menu kolaborasi',
                              },
                          ]
                        : [],
                    primaryAction: {
                        key: 'onboarding',
                        label: 'Periksa afiliasi',
                    },
                    secondaryAction: null,
                },
                reviewQueue: {
                    state: 'unavailable',
                    title: 'Belum tersedia',
                    description: 'Data synthetic.',
                },
                dashboardNotice:
                    state.membershipStatus === 'pending'
                        ? {
                              tone: 'pending',
                              title: 'Afiliasi kampus sedang ditinjau',
                              description:
                                  'Draft onboarding tetap tersedia. Penyimpanan profil dan akses menu kolaborasi menunggu afiliasi terverifikasi.',
                              action: {
                                  key: 'onboarding',
                                  label: 'Periksa afiliasi',
                              },
                          }
                        : null,
                profileReadiness: {
                    state: 'unavailable',
                    profileId: null,
                    skillsCount: 0,
                    availabilityCount: 0,
                },
                activeProjects: {
                    state: state.qaFullDashboardFacts ? 'forbidden' : 'empty',
                    title: state.qaFullDashboardFacts
                        ? 'Proyek aktif belum dapat ditampilkan'
                        : 'Belum ada proyek. Data synthetic',
                    description: state.qaFullDashboardFacts
                        ? 'Verifikasi afiliasi kampus untuk melihat proyek yang kamu kelola atau ikuti.'
                        : 'Fixture pengujian.',
                    action: state.qaFullDashboardFacts
                        ? { key: 'onboarding', label: 'Periksa afiliasi' }
                        : undefined,
                },
                recommendations: {
                    state: state.qaFullDashboardFacts
                        ? 'forbidden'
                        : 'unavailable',
                    title: state.qaFullDashboardFacts
                        ? 'Rekomendasi menunggu afiliasi terverifikasi'
                        : 'Belum tersedia. Data synthetic',
                    description: state.qaFullDashboardFacts
                        ? 'Periksa afiliasi kampus untuk membuka pencocokan proyek.'
                        : 'Fixture pengujian.',
                    action: state.qaFullDashboardFacts
                        ? { key: 'onboarding', label: 'Periksa afiliasi' }
                        : undefined,
                },
                refreshedAt: '2026-10-14T10:00:00Z',
            });

            if (state.qaVerifiedDashboard) {
                Object.assign(props, state.qaVerifiedDashboard);
            }
        }

        return {
            ...initial,
            component:
                destination === '/dashboard' ? 'dashboard' : 'student/profile',
            props,
            url: destination,
        };
    }

    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
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

            if (url.origin !== qaOrigin) {
                return route.fallback();
            }

            if (
                req.method() === 'POST' &&
                url.pathname === '/institution-memberships'
            ) {
                const body = req.postDataJSON();
                mutations.push({ path: url.pathname, body });

                if (failure === 'network') {
                    return route.abort('connectionfailed');
                }

                if (failure === 'validation') {
                    return route.fulfill({
                        status: 200,
                        headers: {
                            'X-Inertia': 'true',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...payload(url),
                            props: {
                                ...payload(url).props,
                                errors: {
                                    nim: 'NIM synthetic perlu diperiksa.',
                                },
                            },
                        }),
                    });
                }

                state.nim = body.nim.trim().toLowerCase();
                state.membershipStatus =
                    failure === 'pending' ? 'pending' : 'verified';
                state.required = state.membershipStatus === 'verified';
                state.affiliationStatus =
                    failure === 'pending' ? 'pending_review' : 'verified';
                state.matchResult =
                    failure === 'pending' ? 'roster_unavailable' : 'exact';
                state.needsRosterRefresh = false;

                return route.fulfill({
                    status: 200,
                    headers: {
                        'X-Inertia': 'true',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload(url)),
                });
            }

            if (
                req.method() === 'POST' &&
                url.pathname === '/student-profiles'
            ) {
                profileWrites++;
                const body = req.postDataJSON();
                mutations.push({ path: url.pathname, body });
                state.profileId = 99003;
                state.required = false;

                return route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: { id: 99003 } }),
                });
            }

            if (req.method() !== 'GET') {
                throw new Error(
                    'Mutasi QA yang tidak diizinkan: ' + url.pathname,
                );
            }

            if (
                url.pathname === '/student-profiles/edit' ||
                url.pathname === '/dashboard'
            ) {
                const data = payload(url);

                if (req.headers()['x-inertia']) {
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

            if (
                /^\/(images|fonts|build)\//.test(url.pathname) ||
                /^\/favicon\./.test(url.pathname)
            ) {
                return route.fallback();
            }

            return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('response', (response) => {
            if (
                response.status() >= 400 &&
                /\.(webp|png)(\?|$)/.test(response.url())
            ) {
                assetErrors.push(response.status() + ': ' + response.url());
            }
        });
        page.on('console', (message) => {
            if (message.type() === 'error') {
                console.error('BROWSER ' + message.text());
            }
        });
        async function open(overrides = {}) {
            state = { ...fresh(), ...overrides };
            state.required =
                overrides.required ??
                (state.universityState === 'ready' &&
                    (state.membershipStatus === 'unverified' ||
                        state.affiliationStatus === 'revision_required' ||
                        (state.membershipStatus === 'verified' &&
                            !state.profileId)));
            failure = null;
            await page.goto(qaOrigin + '/student-profiles/edit');
            await page
                .getByTestId('capability-profile-root')
                .waitFor({ timeout: 10000 });

            if (!(await page.getByRole('dialog').count())) {
                await page
                    .getByRole('button', {
                        name: 'Periksa afiliasi',
                        exact: true,
                    })
                    .click();
            }

            await page.getByRole('dialog').waitFor();
            await page.waitForFunction(
                () =>
                    (document.querySelector('.satu-affiliation-dialog') &&
                        matchMedia('(max-height: 540px)').matches) ||
                    [
                        ...document.querySelectorAll(
                            '[role="dialog"] .satu-mascot img',
                        ),
                    ].some(
                        (img) =>
                            img.offsetParent !== null &&
                            img.complete &&
                            img.naturalWidth > 0,
                    ),
            );
        }

        for (const [width, height] of [
            [320, 640],
            [390, 844],
            [768, 1024],
            [1280, 720],
            [1366, 768],
            [1920, 1080],
            [3440, 1440],
        ]) {
            await page.setViewportSize({ width, height });
            await open();
            check(
                (await page
                    .getByTestId('onboarding-university')
                    .innerText()) === state.institutionName,
                width + 'px: nama UTY read-only terlihat.',
            );
            check(
                (await page.locator('#institution_id').count()) === 0,
                width + 'px: tidak ada pilihan kampus.',
            );
            check(
                !(await page.getByRole('dialog').innerText()).includes(
                    'Universitas tujuan',
                ),
                width + 'px: nama universitas bukan tujuan yang dapat dipilih.',
            );
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                width + 'px: halaman tanpa overflow horizontal.',
            );
            const dialog = page.getByRole('dialog');
            check(
                await dialog.evaluate((element) => {
                    const bubble = getComputedStyle(
                        element.querySelector('.affiliation-intro-message'),
                    );
                    const kicker = getComputedStyle(
                        element.querySelector('.affiliation-intro-kicker'),
                    );
                    const heading = getComputedStyle(
                        element.querySelector(
                            '.affiliation-intro-copy h2 > span',
                        ),
                    );

                    return (
                        bubble.backgroundColor === 'rgb(255, 244, 229)' &&
                        bubble.borderColor === 'rgb(242, 211, 169)' &&
                        (innerWidth < 1024 ||
                            (kicker.color === 'rgb(194, 65, 12)' &&
                                heading.textDecorationColor ===
                                    'rgb(255, 184, 92)'))
                    );
                }),
                width +
                    'px: oranye sekunder terlihat tanpa mengubah biru utama.',
            );
            check(
                await dialog
                    .getByRole('heading', {
                        name: 'Pengajuan afiliasi kampus',
                        exact: true,
                    })
                    .evaluate((element) => element === document.activeElement),
                width + 'px: fokus awal berada pada judul form wajib.',
            );
            check(
                (await dialog.locator('label').allTextContents()).every(
                    (label) => !/opsional/i.test(label),
                ),
                width + 'px: label pop-up tidak memuat teks opsional.',
            );
            check(
                await dialog
                    .locator(
                        '#admission_year, #onboarding-faculty, #onboarding-program',
                    )
                    .evaluateAll((inputs) =>
                        inputs.every((input) => input.required),
                    ),
                'Isian akademik pengajuan wajib dilengkapi.',
            );
            check(
                await dialog.evaluate(
                    (element) =>
                        element.querySelectorAll('.affiliation-required-marker')
                            .length === 4 &&
                        [
                            'nim',
                            'admission_year',
                            'onboarding-faculty',
                            'onboarding-program',
                        ].every((id) => {
                            const marker = element.querySelector(
                                'label[for="' +
                                    id +
                                    '"] .affiliation-required-marker',
                            );

                            return (
                                marker?.textContent.trim() === '*' &&
                                marker.getAttribute('aria-hidden') === 'true' &&
                                getComputedStyle(marker).color ===
                                    'rgb(194, 65, 12)' &&
                                document.getElementById(id).required
                            );
                        }),
                ),
                width +
                    'px: empat isian wajib memiliki bintang jingga aksesibel.',
            );
            check(
                !(await dialog.innerText()).includes('Bekal kemampuan') &&
                    !(await dialog.innerText()).includes(
                        'Cara berkolaborasi',
                    ) &&
                    !(await dialog
                        .getByRole('list', { name: 'Tahapan profil' })
                        .count()),
                width +
                    'px: sebelum verifikasi hanya tahap pengajuan afiliasi ditampilkan.',
            );
            check(
                (await dialog
                    .getByRole('spinbutton', {
                        name: 'Angkatan masuk',
                        exact: true,
                    })
                    .count()) === 1 &&
                    (await dialog
                        .getByRole('combobox', {
                            name: 'Fakultas',
                            exact: true,
                        })
                        .count()) === 1 &&
                    (await dialog
                        .getByRole('combobox', {
                            name: 'Program studi',
                            exact: true,
                        })
                        .count()) === 1,
                width + 'px: bintang tidak mengubah nama aksesibel field.',
            );
            const facultyBounds = await page
                .locator('#onboarding-faculty')
                .boundingBox();
            const programBounds = await page
                .locator('#onboarding-program')
                .boundingBox();
            check(
                width < 640
                    ? programBounds.y > facultyBounds.y
                    : Math.abs(programBounds.y - facultyBounds.y) < 2,
                width + 'px: susunan fakultas/program sesuai layar.',
            );
            check(
                await page.locator('#onboarding-program').isDisabled(),
                'Program menunggu pilihan fakultas, bukan input bebas.',
            );
            check(
                await dialog
                    .locator('.affiliation-intro-mascot')
                    .evaluate((element) => {
                        const image = element.querySelector('img');

                        return (
                            element.dataset.pose === 'affiliation-check' &&
                            !element.querySelector('button') &&
                            image.currentSrc.includes(
                                'mascot-affiliation-check',
                            ) &&
                            image.alt === '' &&
                            image.getAttribute('aria-hidden') === 'true'
                        );
                    }),
                width + 'px: pose afiliasi khusus termuat dan dekoratif.',
            );
            check(
                await dialog.evaluate((element) => {
                    const rect = element.getBoundingClientRect();
                    const main = element.querySelector('.onboarding-main');

                    return (
                        rect.top >= -1 &&
                        rect.bottom <= innerHeight + 1 &&
                        rect.width <= 1153 &&
                        Math.abs(
                            (rect.left + rect.right) / 2 - innerWidth / 2,
                        ) < 2 &&
                        Math.abs(
                            (rect.top + rect.bottom) / 2 - innerHeight / 2,
                        ) < 2 &&
                        main.scrollWidth <= main.clientWidth + 1 &&
                        getComputedStyle(main).overflowY === 'auto'
                    );
                }),
                width + 'px: dialog tengah dan kolom form dapat digulir.',
            );
            const submit = dialog.getByRole('button', {
                name: 'Ajukan afiliasi',
                exact: true,
            });
            await submit.scrollIntoViewIfNeeded();
            check(
                await submit.evaluate((element) => {
                    const rect = element.getBoundingClientRect();
                    const dialog = element
                        .closest('[role="dialog"]')
                        .getBoundingClientRect();

                    return (
                        rect.top >= dialog.top && rect.bottom <= dialog.bottom
                    );
                }),
                width + 'px: aksi pengajuan dapat dicapai tanpa terpotong.',
            );
            await page.locator('.onboarding-main').evaluate((element) => {
                element.scrollTop = 0;
            });
            check(
                await dialog
                    .locator('#nim, #admission_year, select')
                    .evaluateAll((elements) =>
                        elements.every((element) => {
                            const style = getComputedStyle(element);

                            return (
                                element.getBoundingClientRect().height >= 48 &&
                                parseFloat(style.fontSize) >= 16 &&
                                (element.disabled
                                    ? style.cursor === 'not-allowed'
                                    : element.tagName !== 'SELECT' ||
                                      style.cursor === 'pointer')
                            );
                        }),
                    ),
                width + 'px: isian nyaman 48px/16px dan cursor sesuai status.',
            );
            check(
                await dialog.evaluate(
                    (el) =>
                        el.getBoundingClientRect().left >= 0 &&
                        el.getBoundingClientRect().right <= innerWidth,
                ),
                width + 'px: dialog berada dalam viewport.',
            );
            await page.screenshot({
                path: path.join(artifacts, 'activation-' + width + '.png'),
            });
        }

        await open({
            faculty: 'Fakultas Sains & Teknologi',
            studyProgram: 'Informatika (S1)',
            admissionYear: 2023,
        });
        check(
            (await page.locator('.affiliation-required-marker').count()) ===
                1 &&
                (await page
                    .locator('label[for="nim"] .affiliation-required-marker')
                    .count()) === 1 &&
                (await page
                    .locator(
                        '#admission_year, #onboarding-faculty, #onboarding-program',
                    )
                    .evaluateAll((inputs) =>
                        inputs.every((input) => input.readOnly),
                    )),
            'Nilai akademik yang sudah terkunci tidak diberi bintang isian wajib.',
        );

        await page.setViewportSize({ width: 640, height: 500 });
        await open();
        await page.evaluate(() => {
            document.documentElement.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Zoom 200%: halaman tidak overflow dan dialog dapat digulir.',
        );
        await page.getByLabel('Nomor Induk Mahasiswa').focus();
        await page.keyboard.press('Escape');
        check(
            (await page.getByRole('dialog').isVisible()) &&
                !(await page
                    .getByRole('button', { name: 'Tutup pelengkapan afiliasi' })
                    .count()),
            'Escape tidak melewati form wajib dan tombol tutup tidak tersedia.',
        );
        await page.mouse.click(2, 2);
        check(
            await page.getByRole('dialog').isVisible(),
            'Klik luar tidak menutup form wajib.',
        );
        check(
            await page
                .getByRole('button', { name: 'Keluar akun', exact: true })
                .isVisible(),
            'Keluar akun tetap tersedia sebagai jalan keluar.',
        );
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });

        await page.setViewportSize({ width: 320, height: 640 });
        await open({ hasLegacyAffiliation: true });
        check(
            await page.getByTestId('onboarding-legacy').isVisible(),
            'Akun lama mendapat penjelasan tanpa data kampus lain.',
        );
        check(
            (await page.getByTestId('onboarding-legacy').innerText()).includes(
                'Afiliasi akunmu perlu ditinjau.',
            ),
            'Data lama memiliki arahan peninjauan, bukan ajakan berpindah kampus.',
        );
        await page.getByLabel('Nomor Induk Mahasiswa').fill('UTY-DRAFT');
        await page
            .getByRole('spinbutton', { name: 'Angkatan masuk', exact: true })
            .fill('2023');
        await page
            .getByRole('combobox', { name: 'Fakultas', exact: true })
            .selectOption('Fakultas Sains & Teknologi');
        check(
            (await page.locator('#onboarding-program option').count()) === 11,
            'Fakultas sains memuat sepuluh program beserta placeholder.',
        );
        await page
            .getByRole('combobox', { name: 'Program studi', exact: true })
            .selectOption('Informatika (S1)');
        await page
            .getByRole('combobox', { name: 'Fakultas', exact: true })
            .selectOption('Fakultas Bisnis & Humaniora');
        check(
            (await page
                .getByRole('combobox', { name: 'Program studi', exact: true })
                .inputValue()) === '',
            'Mengganti fakultas mengosongkan program sebelumnya.',
        );
        check(
            (await page.locator('#onboarding-program option').count()) === 10,
            'Fakultas bisnis memuat sembilan program/jenjang beserta placeholder.',
        );
        await page
            .getByRole('combobox', { name: 'Program studi', exact: true })
            .selectOption('Akuntansi (D3)');
        failure = 'pending';
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForURL((url) => url.pathname === '/dashboard');
        check(
            await page
                .getByText(
                    'Pengajuan afiliasi berhasil dikirim. Menunggu verifikasi Admin Universitas.',
                    { exact: true },
                )
                .isVisible(),
            'Pengajuan pending tersimpan, menutup form dan menampilkan notifikasi di Beranda.',
        );
        check(profileWrites === 0, 'Pending berhenti sebelum membuat profil.');
        await page
            .getByRole('button', { name: 'Periksa afiliasi', exact: true })
            .first()
            .click();
        const count = mutations.length;
        await page
            .getByRole('button', {
                name: 'Periksa status afiliasi',
                exact: true,
            })
            .click();
        await page
            .getByRole('button', { name: 'Periksa kembali isian' })
            .waitFor();
        check(mutations.length === count, 'Periksa status pending hanya GET.');
        await page
            .getByRole('button', { name: 'Periksa kembali isian' })
            .click();
        check(
            (await page
                .getByRole('combobox', { name: 'Program studi', exact: true })
                .inputValue()) === 'Akuntansi (D3)',
            'Pending mempertahankan draft profil dalam sesi.',
        );
        await page.keyboard.press('Escape');
        check(
            (await page.getByRole('dialog').isVisible()) &&
                (await page
                    .getByLabel('Nomor Induk Mahasiswa')
                    .inputValue()) === 'UTY-DRAFT',
            'Form perbaikan tidak ditutup Escape dan mempertahankan NIM draft.',
        );
        state.needsRosterRefresh = true;
        failure = 'pending';
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page
            .getByRole('button', { name: 'Periksa afiliasi', exact: true })
            .first()
            .click();
        await page
            .getByRole('button', { name: 'Periksa kembali isian' })
            .waitFor();
        check(
            mutations.length === count + 1,
            'Roster berubah memerlukan pengajuan eksplisit, tidak terjebak pemeriksaan GET saja.',
        );

        await open();
        await page
            .getByLabel('Nomor Induk Mahasiswa')
            .fill('UTY-CONTEXT-DRAFT');
        await page
            .getByRole('spinbutton', { name: 'Angkatan masuk', exact: true })
            .fill('2023');
        await page
            .getByRole('combobox', { name: 'Fakultas', exact: true })
            .selectOption('Fakultas Sains & Teknologi');
        await page
            .getByRole('combobox', { name: 'Program studi', exact: true })
            .selectOption('Informatika (S1)');
        state.institutionId = 99009;
        state.institutionName = 'Universitas berubah. Data synthetic';
        failure = 'pending';
        const beforeContext = mutations.length;
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page.getByTestId('onboarding-locked').waitFor();
        check(
            mutations.length === beforeContext,
            'Universitas berubah menahan draft lama sebelum POST.',
        );

        await open({
            membershipStatus: 'pending',
            affiliationStatus: 'revision_required',
            nim: 'UTY-REVISION',
        });
        check(
            (await page.getByLabel('Nomor Induk Mahasiswa').isVisible()) &&
                (await page
                    .getByRole('button', { name: 'Periksa kembali isian' })
                    .count()) === 0,
            'Revisi afiliasi langsung membuka isian, bukan status menunggu tanpa jalan keluar.',
        );

        for (const scenario of [
            'missing',
            'invalid',
            'unavailable',
            'suspended',
            'phone',
        ]) {
            const override =
                scenario === 'suspended'
                    ? {
                          membershipStatus: 'suspended',
                          canSubmitAffiliation: false,
                      }
                    : scenario === 'phone'
                      ? { phoneVerified: false, canSubmitAffiliation: false }
                      : {
                            universityState: scenario,
                            institutionId: null,
                            institutionName: null,
                            canSubmitAffiliation: false,
                        };
            await open(override);
            check(
                await page.getByTestId('onboarding-locked').isVisible(),
                scenario + ': penjelasan terkunci terlihat.',
            );
            check(
                (await page.getByRole('dialog').locator('#nim').count()) === 0,
                scenario + ': tidak menawarkan pengajuan ulang.',
            );
            const before = mutations.length;
            await page
                .getByRole('button', {
                    name: 'Periksa status afiliasi',
                    exact: true,
                })
                .click();
            await page
                .getByRole('button', {
                    name: 'Periksa status afiliasi',
                    exact: true,
                })
                .waitFor({ state: 'visible' });
            check(
                mutations.length === before,
                scenario + ': pemulihan hanya membaca status.',
            );
            await page.screenshot({
                path: path.join(artifacts, 'locked-' + scenario + '.png'),
            });
        }

        await open();
        await page.getByLabel('Nomor Induk Mahasiswa').fill('UTY-NETWORK');
        await page
            .getByRole('spinbutton', { name: 'Angkatan masuk', exact: true })
            .fill('2023');
        await page
            .getByRole('combobox', { name: 'Fakultas', exact: true })
            .selectOption('Fakultas Bisnis & Humaniora');
        await page
            .getByRole('combobox', { name: 'Program studi', exact: true })
            .selectOption('Akuntansi (S1)');
        failure = 'network';
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page.getByTestId('onboarding-locked').waitFor();
        check(
            await page
                .getByText('Hasil pengiriman perlu diperiksa')
                .isVisible(),
            'Jaringan gagal tidak mengklaim pengiriman pasti gagal atau berhasil.',
        );
        const networkCount = mutations.length;
        failure = null;
        await page
            .getByRole('button', {
                name: 'Periksa status afiliasi',
                exact: true,
            })
            .click();
        await page.getByLabel('Nomor Induk Mahasiswa').waitFor();
        check(
            mutations.length === networkCount &&
                (await page
                    .getByRole('combobox', {
                        name: 'Program studi',
                        exact: true,
                    })
                    .inputValue()) === 'Akuntansi (S1)',
            'Reconciliation memakai GET dan mempertahankan draft tanpa retry POST otomatis.',
        );
        failure = 'validation';
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page
            .getByRole('alert')
            .filter({ hasText: 'NIM synthetic perlu diperiksa.' })
            .waitFor();
        check(
            (await page.getByLabel('Nomor Induk Mahasiswa').inputValue()) ===
                'UTY-NETWORK',
            'Error validasi mempertahankan NIM serta memberi ringkasan error.',
        );
        failure = null;
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Ajukan afiliasi', exact: true })
            .click();
        await page.getByLabel('Tentang dirimu', { exact: true }).waitFor();
        check(
            (
                await page
                    .getByRole('dialog')
                    .locator('label')
                    .allTextContents()
            ).every((label) => !/opsional/i.test(label)),
            'Langkah kemampuan juga memakai label tanpa teks opsional.',
        );
        check(
            profileWrites === 0,
            'Exact afiliasi belum menyimpan profil sebelum konfirmasi.',
        );
        await page
            .getByRole('button', { name: 'Lanjutkan', exact: true })
            .click();
        check(
            await page
                .getByRole('dialog')
                .getByRole('button', { name: 'Senin', exact: true })
                .evaluate((el) => el.getBoundingClientRect().width >= 44),
            'Pilihan jadwal mobile memiliki target minimal 44px.',
        );
        await page
            .getByRole('button', { name: 'Simpan profil', exact: true })
            .click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForURL((url) => url.pathname === '/dashboard');
        check(
            await page
                .getByText('Data profil berhasil tersimpan.', { exact: true })
                .isVisible(),
            'Simpan pada pop-up menampilkan notifikasi sukses dan kembali ke Beranda.',
        );
        check(
            profileWrites === 1 &&
                mutations.at(-1).body.skills.length === 0 &&
                mutations.at(-1).body.availability_windows.length === 0,
            'Pemula menyimpan sekali tanpa karya, keahlian atau jadwal wajib.',
        );
        check(
            mutations.at(-1).body.admission_year === 2023 &&
                mutations.at(-1).body.faculty ===
                    'Fakultas Bisnis & Humaniora' &&
                mutations.at(-1).body.study_program === 'Akuntansi (S1)' &&
                !('study_year' in mutations.at(-1).body),
            'Popup menyimpan angkatan empat digit serta fakultas/program, bukan tingkat studi.',
        );
        check(
            mutations.at(-1).body.portfolio_visibility === 'private' &&
                !mutations.at(-1).body.recruiter_discoverable,
            'Izin berbagi default privat, bukan publikasi otomatis.',
        );
        check(
            await page.evaluate(
                () =>
                    !Object.keys(localStorage).some((key) =>
                        /draft|onboarding/.test(key),
                    ),
            ),
            'Draft afiliasi tidak ditulis ke persistent storage.',
        );
        const pendingMutations = mutations.length;

        const pendingDashboardState = {
            ...fresh(),
            qaFullDashboardFacts: true,
            membershipStatus: 'pending',
            affiliationStatus: 'pending_review',
            matchResult: 'no_match',
            canSubmitAffiliation: false,
        };

        for (const [width, height] of [
            [320, 640],
            [390, 844],
            [768, 1024],
            [1280, 720],
            [1366, 768],
            [1672, 941],
            [1920, 1080],
            [3440, 1440],
        ]) {
            state = { ...pendingDashboardState, qaSidebarOpen: width === 1672 };
            failure = null;
            await page.setViewportSize({ width, height });
            await page.goto(qaOrigin + '/dashboard');
            const hero = page.getByTestId('dashboard-hero');
            await hero.getByRole('heading', { level: 1 }).waitFor();
            await hero
                .locator('[data-pose="waiting-review"] img')
                .evaluate((img) => img.decode());
            await hero
                .locator('.dashboard-pending-hero__background img')
                .evaluate((img) => img.decode());

            for (const decoration of await page
                .locator(
                    '.dashboard-docket__art img, .dashboard-project-state__folder',
                )
                .all()) {
                if (await decoration.isVisible()) {
                    await decoration.scrollIntoViewIfNeeded();
                    await decoration.evaluate((img) => img.decode());
                }
            }

            await page.evaluate(() => window.scrollTo(0, 0));
            check(
                await page
                    .locator('.dashboard-affiliation-pending')
                    .evaluate(
                        (card) =>
                            !card.querySelector('img, picture') &&
                            getComputedStyle(card).backgroundImage === 'none' &&
                            getComputedStyle(card).backgroundColor ===
                                'rgb(255, 255, 255)',
                    ),
                width +
                    'px: kartu afiliasi memakai bidang putih tanpa gambar latar.',
            );
            check(
                (await page
                    .locator('.dashboard-support-card > section')
                    .count()) === 2 &&
                    (
                        await page
                            .locator('.student-journey-summary__icon')
                            .allTextContents()
                    ).join('') === '1234',
                width +
                    'px: panel pendukung menyatu dan strip menunjukkan empat urutan produk.',
            );
            check(
                (await hero.innerText()).includes(
                    'Pengajuanmu sudah tercatat.',
                ) &&
                    (await hero
                        .locator('[data-pose="waiting-review"]')
                        .count()) === 1 &&
                    !(await hero.locator('[data-interactive], button').count()),
                width + 'px: hero pending memakai pose menunggu yang statis.',
            );
            check(
                (await page
                    .locator('[data-dashboard-affiliation-review]')
                    .count()) === 1 &&
                    (await page
                        .locator('.dashboard-affiliation-pending')
                        .count()) === 1 &&
                    (
                        await page
                            .getByTestId('dashboard-affiliation-explanation')
                            .innerText()
                    ).includes(state.institutionName) &&
                    !(await page
                        .getByTestId('dashboard-explore-projects')
                        .count()),
                width +
                    'px: dua kartu pending selaras dan akses proyek tetap terkunci.',
            );
            const layout = await page.evaluate((seatAnchor) => {
                const hero = document
                    .querySelector('.dashboard-pending-hero')
                    .getBoundingClientRect();
                const art = document
                    .querySelector('.dashboard-pending-hero__mascot')
                    .getBoundingClientRect();
                const cards = [
                    ...document.querySelector('.dashboard-affiliation-board')
                        .children,
                ].map((card) => card.getBoundingClientRect());
                const link = document.querySelector(
                    '.dashboard-pending-hero__link',
                );
                const img = document.querySelector(
                    '.dashboard-pending-hero__mascot img',
                );
                const style = getComputedStyle(img);
                const scene = document
                    .querySelector('.dashboard-pending-hero__scene')
                    .getBoundingClientRect();
                const halo = document
                    .querySelector('.dashboard-pending-hero__halo')
                    .getBoundingClientRect();
                const imageBox = img.getBoundingClientRect();
                const seat = imageBox.top + imageBox.height * seatAnchor;
                const ground = document.querySelector(
                    '.dashboard-pending-hero__ground',
                );
                const groundBox = ground.getBoundingClientRect();

                return {
                    heroHeight: hero.height,
                    heroWidth: hero.width,
                    sceneCenter:
                        (scene.left + scene.width / 2 - hero.left) / hero.width,
                    haloCentered:
                        Math.abs(
                            scene.left +
                                scene.width / 2 -
                                halo.left -
                                halo.width / 2,
                        ) < 1,
                    haloRound: Math.abs(halo.width - halo.height) < 1,
                    stoneInside:
                        groundBox.top > hero.top &&
                        groundBox.bottom <= hero.bottom,
                    seatContact:
                        seat >= groundBox.top - 2 &&
                        seat <= groundBox.top + groundBox.height * 0.35,
                    domeWidth: groundBox.width / scene.width,
                    surface: getComputedStyle(ground).backgroundImage,
                    stoneAsset: img.currentSrc.includes(
                        '/images/mascot-waiting-lap',
                    ),
                    imageRatio: imageBox.width / imageBox.height,
                    overflow:
                        document.documentElement.scrollWidth > innerWidth + 1,
                    artInside:
                        art.left >= hero.left &&
                        art.right <= hero.right &&
                        art.top >= hero.top &&
                        art.bottom <= hero.bottom,
                    noOverlap: (() => {
                        const art = document
                            .querySelector('.dashboard-pending-hero__mascot')
                            .getBoundingClientRect();
                        const copy = document.querySelector(
                            '.dashboard-pending-hero__copy',
                        );
                        const walker = document.createTreeWalker(
                            copy,
                            NodeFilter.SHOW_TEXT,
                        );

                        while (walker.nextNode()) {
                            if (!walker.currentNode.textContent.trim()) {
                                continue;
                            }

                            const range = document.createRange();
                            range.selectNodeContents(walker.currentNode);

                            for (const box of range.getClientRects()) {
                                if (
                                    box.left < art.right &&
                                    box.right > art.left &&
                                    box.top < art.bottom &&
                                    box.bottom > art.top
                                ) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    })(),
                    paired: Math.abs(cards[0].top - cards[1].top) < 2,
                    stacked: cards[1].top >= cards[0].bottom,
                    target: link.getBoundingClientRect().height,
                    cursor: getComputedStyle(link).cursor,
                    animation: style.animationName,
                    alt: img.alt,
                };
            }, waitingProvenance.layout.seat_anchor.y);
            check(
                !layout.overflow &&
                    layout.artInside &&
                    layout.target >= 44 &&
                    layout.cursor === 'pointer',
                width + 'px: reflow, ilustrasi dan target sentuh aman.',
            );
            check(
                layout.noOverlap,
                width + 'px: ilustrasi tidak menimpa teks atau label tindakan.',
            );
            check(
                layout.stoneAsset &&
                    layout.stoneInside &&
                    layout.seatContact &&
                    layout.domeWidth >= 1.35 &&
                    layout.domeWidth <= 1.45 &&
                    layout.surface.includes('rgb(134, 175, 217)') &&
                    Math.abs(layout.imageRatio - 1) < 0.01,
                width +
                    'px: pose buku di pangkuan menempel pada dudukan putih-biru sebelumnya, tanpa batu bertekstur.',
            );
            check(
                await hero
                    .locator('.dashboard-pending-hero__background img')
                    .evaluate(
                        (img) =>
                            img.complete &&
                            img.naturalWidth > 0 &&
                            img.alt === '',
                    ),
                width +
                    'px: panorama kampus termuat sebagai dekorasi, bukan UI gambar.',
            );
            check(
                layout.heroHeight <= (width >= 768 ? 300 : 380),
                width + 'px: hero ringkas tanpa panel ilustrasi yang tinggi.',
            );

            if (layout.heroWidth >= 1026) {
                check(
                    layout.heroHeight >= 190 &&
                        layout.heroHeight <= 200 &&
                        layout.sceneCenter >= 0.825 &&
                        layout.sceneCenter <= 0.84 &&
                        layout.haloCentered &&
                        layout.haloRound &&
                        layout.stoneInside,
                    width +
                        'px: hero mempertahankan maskot pada 83% lebar dengan lengkung bulat dan batu di dalam banner.',
                );
            }

            check(
                width >= 1280 ? layout.paired : layout.stacked,
                width +
                    'px: kartu mengikuti ruang konten, bukan lebar layar saja.',
            );
            check(
                layout.animation === 'none' && layout.alt === '',
                width +
                    'px: maskot dekoratif tidak bergerak pada reduced motion.',
            );
            await page.screenshot({
                path: path.join(
                    artifacts,
                    'dashboard-pending-' + width + '.png',
                ),
                fullPage: width === 1366,
            });

            if (width === 1672) {
                await hero.screenshot({
                    path: path.join(artifacts, 'hero-reference-1672.png'),
                });
            }
        }

        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const waitingImage = page.locator(
            '.dashboard-pending-hero__mascot img',
        );
        const restingTransform = await waitingImage.evaluate(
            (img) => getComputedStyle(img).transform,
        );
        const waitingImageBox = await waitingImage.boundingBox();
        assert.ok(waitingImageBox);
        await page.mouse.move(
            waitingImageBox.x + waitingImageBox.width / 2,
            waitingImageBox.y + waitingImageBox.height / 2,
        );
        check(
            await waitingImage.evaluate(
                (img, resting) =>
                    getComputedStyle(img).transform === resting &&
                    getComputedStyle(img).animationName === 'none',
                restingTransform,
            ),
            'Maskot tetap diam saat disentuh kursor tanpa reduced motion.',
        );
        const pendingAccents = await page
            .locator('.dashboard-pending-hero__greeting > svg')
            .evaluate((badge) => ({
                color: getComputedStyle(badge).color,
                fill: getComputedStyle(badge).fill,
            }));
        check(
            pendingAccents.color === 'rgb(194, 65, 12)' &&
                pendingAccents.fill === 'rgb(255, 244, 229)',
            'Hero memakai token oranye sekunder, bukan identitas warna baru.',
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const statusLink = page.getByRole('link', {
            name: 'Lihat status afiliasi',
            exact: true,
        });
        await statusLink.focus();
        await page.keyboard.press('Enter');
        check(
            await page
                .locator('#dashboard-affiliation-heading')
                .evaluate((heading) => document.activeElement === heading),
            'Tautan status memindahkan fokus keyboard ke judul afiliasi.',
        );
        const reviewCard = page.getByTestId('dashboard-state-notice');
        const reviewButton = reviewCard.getByRole('button', {
            name: 'Periksa afiliasi',
            exact: true,
        });
        await reviewButton.click();
        await page.getByRole('dialog').waitFor();
        await page
            .getByRole('button', {
                name: 'Periksa status afiliasi',
                exact: true,
            })
            .click();
        await page
            .getByRole('button', { name: 'Periksa kembali isian' })
            .waitFor();
        await page
            .getByRole('button', { name: 'Tutup pelengkapan afiliasi' })
            .click();
        check(
            mutations.length === pendingMutations,
            'Hero, kartu dan pemeriksaan status tidak mengirim ulang afiliasi.',
        );
        await page.waitForFunction(
            () =>
                document.activeElement?.matches(
                    '[data-test="dashboard-state-notice"] button',
                ),
            undefined,
            { timeout: 3000 },
        );
        check(
            await reviewButton.evaluate(
                (button) => document.activeElement === button,
            ),
            'Menutup status mengembalikan fokus ke tombol pemicu.',
        );

        for (const overrides of [
            { affiliationStatus: 'revision_required' },
            { affiliationStatus: 'rejected' },
            { needsRosterRefresh: true },
            { phoneVerified: false },
            { universityState: 'missing' },
            { membershipStatus: 'suspended' },
            {
                membershipStatus: 'verified',
                affiliationStatus: 'verified',
                profileId: 99003,
            },
        ]) {
            state = { ...pendingDashboardState, ...overrides };
            await page.goto(qaOrigin + '/dashboard');
            await page.getByTestId('dashboard-hero').waitFor();
            check(
                !(await page
                    .locator(
                        '.dashboard-pending-hero, .dashboard-affiliation-pending, [data-dashboard-affiliation-review]',
                    )
                    .count()),
                'Status khusus tidak disamarkan sebagai pengajuan biasa: ' +
                    JSON.stringify(overrides),
            );
        }

        const verifiedDashboard = {
            nextAction: {
                reference: 'VERIFIED-SYNTHETIC',
                category: 'Peluang kolaborasi',
                recordedAt: 'Data synthetic',
                recordedAtIso: '2026-10-19T08:00:00Z',
                statusLabel: 'Temukan peran',
                statusTone: 'neutral',
                title: 'Temukan peran untuk mulai berkarya bersama',
                facts: [
                    {
                        icon: 'building',
                        label: 'Universitas',
                        value: 'Universitas Teknologi Yogyakarta. Data synthetic',
                    },
                    {
                        icon: 'profile',
                        label: 'Bekal kolaborasi',
                        value: '3 keahlian dan 2 waktu tersedia. Data synthetic',
                    },
                    {
                        icon: 'file',
                        label: 'Langkah berikutnya',
                        value: 'Baca kebutuhan peran sebelum mengajukan minat. Data synthetic',
                    },
                ],
                primaryAction: {
                    key: 'projects',
                    view: 'opportunities',
                    label: 'Temukan peluang',
                },
                secondaryAction: { key: 'profile', label: 'Perbarui profil' },
            },
            reviewQueue: {
                state: 'unavailable',
                title: 'Ringkasan validasi belum tersedia',
                description:
                    'Baca keputusan aktual pada Kontribusi. Data synthetic',
            },
            profileReadiness: {
                state: 'ready',
                profileId: 99003,
                skillsCount: 3,
                availabilityCount: 2,
            },
            activeProjects: {
                state: 'empty',
                title: 'Belum ada proyek aktif',
                description:
                    'Temukan peran yang sesuai untuk mulai bekerja bersama. Data synthetic',
                action: {
                    key: 'projects',
                    view: 'opportunities',
                    label: 'Jelajahi peluang',
                },
            },
            recommendations: {
                state: 'empty',
                title: 'Belum ada rekomendasi',
                description:
                    'Penelusuran peluang tetap tersedia. Data synthetic',
                action: {
                    key: 'projects',
                    view: 'opportunities',
                    label: 'Jelajahi peluang',
                },
            },
        };
        const verifiedState = {
            ...fresh(),
            membershipStatus: 'verified',
            affiliationStatus: 'verified',
            profileId: 99003,
            skillsCount: 3,
            availabilityCount: 2,
            canSubmitAffiliation: false,
            qaVerifiedDashboard: verifiedDashboard,
        };
        const verifiedMutations = mutations.length;
        await page.emulateMedia({ reducedMotion: 'reduce' });

        for (const [width, height] of [
            [320, 640],
            [390, 844],
            [768, 1024],
            [1024, 768],
            [1280, 720],
            [1366, 768],
            [1672, 941],
            [1920, 1080],
            [3440, 1440],
        ]) {
            state = { ...verifiedState, qaSidebarOpen: width === 1672 };
            await page.setViewportSize({ width, height });
            await page.goto(qaOrigin + '/dashboard');
            const hero = page.getByTestId('dashboard-hero');
            await hero
                .locator('[data-pose="welcome"] img')
                .evaluate((img) => img.decode());

            for (const decoration of await page
                .locator(
                    '.dashboard-docket__art img, .dashboard-project-state__folder',
                )
                .all()) {
                if (await decoration.isVisible()) {
                    await decoration.scrollIntoViewIfNeeded();
                    await decoration.evaluate((img) => img.decode());
                }
            }

            await page.evaluate(() => scrollTo(0, 0));
            check(
                (await page
                    .locator('.dashboard-verified-view.dashboard-ledger-view')
                    .count()) === 1 &&
                    !(await page
                        .locator(
                            '.dashboard-affiliation-pending, [data-dashboard-affiliation-review], .dashboard-pending-hero',
                        )
                        .count()),
                width +
                    'px verified: kartu referensi tanpa status pending palsu.',
            );
            check(
                (await hero.innerText()).includes('Halo,') &&
                    (await hero
                        .locator(
                            '[data-pose="welcome"][data-interactive="true"]',
                        )
                        .count()) === 1,
                width + 'px verified: desain dan pose hero welcome tetap.',
            );
            const layout = await page.evaluate(() => {
                const hero = document.querySelector(
                    '[data-test="dashboard-hero"]',
                );
                const heroBox = hero.getBoundingClientRect();
                const art = hero
                    .querySelector('.satu-mascot')
                    .getBoundingClientRect();
                const navbar = document.querySelector(
                    'header:not([data-test="dashboard-hero"])',
                );
                const docket = document.querySelector(
                    '[data-test="dashboard-docket"]',
                );
                const decoration = document.querySelector(
                    '.dashboard-docket__art',
                );
                const decorationBox = decoration.getBoundingClientRect();
                const docketCopy = [
                    ...docket.querySelectorAll(
                        'h2, dt, dd, .dashboard-docket__footer a, .dashboard-docket__footer button',
                    ),
                ];

                return {
                    overflow:
                        document.documentElement.scrollWidth > innerWidth + 1,
                    heroMargin: parseFloat(getComputedStyle(hero).marginTop),
                    mascotSafe:
                        art.top >=
                            (navbar?.getBoundingClientRect().bottom ?? 0) &&
                        art.right <= innerWidth + 1 &&
                        heroBox.top >= 0,
                    radius: getComputedStyle(docket).borderTopLeftRadius,
                    noArtOverlap:
                        !decorationBox.width ||
                        docketCopy.every((node) => {
                            const box = node.getBoundingClientRect();

                            return (
                                box.right <= decorationBox.left ||
                                box.left >= decorationBox.right ||
                                box.bottom <= decorationBox.top ||
                                box.top >= decorationBox.bottom
                            );
                        }),
                    targets: [...docket.querySelectorAll('a,button')].every(
                        (node) =>
                            node.getBoundingClientRect().height >= 44 &&
                            getComputedStyle(node).cursor === 'pointer',
                    ),
                };
            });
            check(
                !layout.overflow && layout.mascotSafe && layout.targets,
                width + 'px verified: reflow, navbar dan tindakan aman.',
            );
            check(
                layout.heroMargin ===
                    (width >= 1024 ? 24 : width >= 640 ? 16 : 0),
                width +
                    'px verified: hero hanya dinaikkan sedikit sesuai breakpoint.',
            );
            check(
                layout.radius === '18px' && layout.noArtOverlap,
                width +
                    'px verified: kartu mengikuti referensi dan ilustrasi tidak menutupi fakta atau kedua tindakan.',
            );
            check(
                (await page
                    .locator('.dashboard-support-card > section')
                    .count()) === 2 &&
                    (
                        await page
                            .locator('.student-journey-summary__icon')
                            .allTextContents()
                    ).join('') === '1234',
                width +
                    'px verified: panel pendukung menyatu dan alur empat nomor tersedia.',
            );
            check(
                (
                    await page
                        .getByTestId('dashboard-primary-action')
                        .getAttribute('href')
                ).includes('/projects') &&
                    (await page
                        .getByTestId('dashboard-project-count')
                        .innerText()) === '0 proyek',
                width +
                    'px verified: tautan peluang dan hitungan kosong tetap aktual.',
            );
            await page.screenshot({
                path: path.join(
                    artifacts,
                    'dashboard-verified-' + width + '.png',
                ),
                fullPage: width === 1366 || width === 1672,
            });
        }

        const readyProjects = {
            state: 'ready',
            totalCount: 2,
            projects: [
                {
                    id: 99111,
                    index: '01',
                    name: 'Ruang Belajar UTY. Data synthetic',
                    nextTask:
                        'Susun wireframe bersama rekan satu tim. Data synthetic',
                    deadline: '25 Oktober 2026',
                    deadlineIso: '2026-10-25T10:00:00Z',
                    deadlineTone: 'neutral',
                },
                {
                    id: 99112,
                    index: '02',
                    name: 'Arsip Kegiatan Mahasiswa. Data synthetic',
                    nextTask:
                        'Periksa kembali bukti pekerjaan individual. Data synthetic',
                    deadline: '12 Oktober 2026',
                    deadlineIso: '2026-10-12T10:00:00Z',
                    deadlineTone: 'correction',
                },
            ],
        };
        const readyRecommendation = {
            state: 'ready',
            recommendation: {
                id: 99121,
                projectId: 99111,
                title: 'Ruang Belajar UTY. Data synthetic',
                role: 'Desainer antarmuka. Data synthetic',
                reasons: [
                    'Keahlian desain sesuai kebutuhan peran. Data synthetic',
                    'Jadwal proyek belum dinyatakan. Data synthetic',
                ],
                reasonTypes: ['positive', 'attention'],
                limitations: [
                    'Pencocokan bukan jaminan diterima. Data synthetic',
                ],
                scoreVersion: 'opportunity-v2-neutral',
                isStale: false,
                createdAt: '2026-10-19T08:00:00Z',
                expiresAt: '2026-10-21T08:00:00Z',
            },
        };

        for (const width of [390, 1366, 1920]) {
            state = {
                ...verifiedState,
                qaVerifiedDashboard: {
                    ...verifiedDashboard,
                    activeProjects: readyProjects,
                    recommendations: readyRecommendation,
                },
            };
            await page.setViewportSize({ width, height: 900 });
            await page.goto(qaOrigin + '/dashboard');
            await page.getByTestId('dashboard-project-row').first().waitFor();
            check(
                (await page.getByTestId('dashboard-project-row').count()) ===
                    2 &&
                    (await page
                        .getByTestId('dashboard-project-count')
                        .innerText()) === '2 proyek' &&
                    (
                        await page.getByTestId('dashboard-ledger').innerText()
                    ).includes('Lewat batas waktu'),
                width +
                    'px verified: proyek berisi mempertahankan tugas, deadline dan hitungan server.',
            );
            check(
                (await page
                    .getByTestId('dashboard-recommendation-reason')
                    .count()) === 2 &&
                    (
                        await page
                            .getByTestId('dashboard-recommendation-limitations')
                            .innerText()
                    ).includes('bukan jaminan') &&
                    (
                        await page
                            .locator('.dashboard-recommendation-card')
                            .innerText()
                    ).includes('opportunity-v2-neutral'),
                width +
                    'px verified: alasan, keterbatasan dan versi rekomendasi tidak disembunyikan.',
            );
            check(
                (await page
                    .getByTestId('dashboard-recommendation-reason')
                    .first()
                    .evaluate(
                        (node) =>
                            getComputedStyle(node).borderTopWidth === '0px',
                    )) &&
                    (await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    )),
                width +
                    'px verified: alasan bukan tumpukan kartu dan data berisi tidak meluap.',
            );
            await page.screenshot({
                path: path.join(
                    artifacts,
                    'dashboard-verified-ready-' + width + '.png',
                ),
                fullPage: true,
            });
        }

        for (const scenario of [
            'loading',
            'error',
            'forbidden',
            'processing',
            'stale',
        ]) {
            state = {
                ...verifiedState,
                qaVerifiedDashboard: {
                    ...verifiedDashboard,
                    activeProjects:
                        scenario === 'loading'
                            ? {
                                  state: 'loading',
                                  announcement: 'Memuat proyek. Data synthetic',
                              }
                            : {
                                  state:
                                      scenario === 'forbidden'
                                          ? 'forbidden'
                                          : 'error',
                                  title: 'Proyek belum dapat dibaca. Data synthetic',
                                  description:
                                      'Periksa status dan akses terbaru. Data synthetic',
                                  action: {
                                      key: 'refresh',
                                      label: 'Periksa status',
                                  },
                              },
                    recommendations:
                        scenario === 'loading'
                            ? {
                                  state: 'loading',
                                  announcement:
                                      'Memuat rekomendasi. Data synthetic',
                              }
                            : {
                                  state: scenario,
                                  title:
                                      'Keadaan ' +
                                      scenario +
                                      '. Data synthetic',
                                  description:
                                      'Peluang tetap dapat ditelusuri sesuai akses. Data synthetic',
                                  action: {
                                      key: 'refresh',
                                      label: 'Periksa status',
                                  },
                              },
                },
            };
            await page.goto(qaOrigin + '/dashboard');
            await page
                .getByTestId('dashboard-recommendation-' + scenario)
                .waitFor();
            check(
                (await page
                    .getByTestId('dashboard-recommendation-' + scenario)
                    .count()) === 1 &&
                    !(await page.getByTestId('dashboard-project-row').count()),
                'Verified ' +
                    scenario +
                    ': status nyata tidak disamarkan sebagai proyek atau rekomendasi berisi.',
            );

            if (scenario === 'loading') {
                check(
                    (await page.locator('[aria-busy="true"]').count()) >= 2,
                    'Verified loading: skeleton proyek dan rekomendasi tetap aksesibel.',
                );
            }
        }

        state = {
            ...verifiedState,
            qaVerifiedDashboard: {
                ...verifiedDashboard,
                activeProjects: readyProjects,
                recommendations: {
                    ...readyRecommendation,
                    recommendation: {
                        ...readyRecommendation.recommendation,
                        isStale: true,
                    },
                },
            },
        };
        await page.goto(qaOrigin + '/dashboard');
        check(
            (await page
                .getByTestId('dashboard-recommendation-hide')
                .isDisabled()) &&
                (await page
                    .getByTestId('dashboard-recommendation-not-relevant')
                    .isDisabled()),
            'Verified rekomendasi kedaluwarsa: masukan tetap terkunci sampai refresh.',
        );
        await page.setViewportSize({ width: 640, height: 480 });
        await page.evaluate(() => {
            document.documentElement.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Verified zoom 200 persen: kartu dan data berisi tidak overflow.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'dashboard-verified-zoom-200.png'),
            fullPage: true,
        });
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });
        check(
            mutations.length === verifiedMutations,
            'Redesign verified hanya membaca, tidak mengirim command otomatis.',
        );

        state = {
            ...pendingDashboardState,
            qaUserName:
                'MahasiswaDenganNamaSangatPanjangTanpaSpasiUntukUjiPemenggalan',
            institutionName:
                'Universitas Teknologi Yogyakarta. Nama panjang untuk data synthetic pengujian tata letak',
        };
        await page.setViewportSize({ width: 640, height: 480 });
        await page.goto(qaOrigin + '/dashboard');
        await page.getByTestId('dashboard-hero').waitFor();
        await page.evaluate(() => {
            document.documentElement.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Pembesaran 200 persen dan nama panjang tidak membuat overflow horizontal.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'dashboard-pending-zoom-200.png'),
        });
        await page.evaluate(() => {
            document.documentElement.style.zoom = '';
        });

        for (const width of [320, 1280]) {
            await page.setViewportSize({ width, height: 800 });

            for (const matchResult of [
                'no_match',
                'ambiguous',
                'inactive',
                'roster_unavailable',
            ]) {
                await open({
                    membershipStatus: 'pending',
                    affiliationStatus: 'pending_review',
                    matchResult,
                    canSubmitAffiliation: false,
                });
                const dialog = page.getByRole('dialog');
                check(
                    await dialog
                        .getByRole('heading', {
                            name: 'Menunggu verifikasi afiliasi',
                            exact: true,
                        })
                        .isVisible(),
                    matchResult +
                        ': status menunggu tidak mengklaim admin sudah meninjau.',
                );
                const text = (await dialog.innerText()).replace(/\s+/g, ' ');
                check(
                    text.includes('Kamu tidak perlu mengajukan ulang.') &&
                        text.includes(
                            'Fakultas, program studi, dan angkatan masuk akan terisi otomatis di Profil kemampuan setelah afiliasi disetujui.',
                        ) &&
                        !/roster|impostor/i.test(text),
                    width +
                        'px ' +
                        matchResult +
                        ': status dan langkah berikutnya tanpa jargon atau tuduhan.',
                );
                check(
                    text.includes(
                        'Fakultas, program studi, dan angkatan masuk tersimpan sebagai draft pribadi',
                    ) &&
                        text.includes(
                            'Isian profil lainnya masih sementara dan dapat hilang jika halaman dimuat ulang atau ditutup.',
                        ),
                    'Status menunggu membedakan draft akademik tersimpan dan isian profil sementara.',
                );
                check(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    ),
                    width + 'px: pesan pending tidak meluap horizontal.',
                );

                if (matchResult === 'no_match') {
                    await page.screenshot({
                        path: path.join(artifacts, 'pending-' + width + '.png'),
                    });
                }
            }
        }

        check(
            mutations.length === pendingMutations && profileWrites === 1,
            'Membaca status pending tidak mengirim ulang afiliasi atau menyimpan profil.',
        );
        state = {
            ...state,
            membershipStatus: 'verified',
            affiliationStatus: 'verified',
            required: true,
            profileId: null,
            canSubmitAffiliation: true,
            faculty: 'Fakultas Sains & Teknologi',
            studyProgram: 'Informatika (S1)',
            admissionYear: 2023,
        };
        const beforeApprovalRead = mutations.length;
        await page
            .getByRole('button', {
                name: 'Periksa status afiliasi',
                exact: true,
            })
            .click();
        await page.getByLabel('Tentang dirimu', { exact: true }).waitFor();
        check(
            mutations.length === beforeApprovalRead,
            'Persetujuan dibaca melalui GET sebelum membuka kemampuan.',
        );
        check(
            !(await page.getByLabel('Nomor Induk Mahasiswa').count()) &&
                !(await page.locator('#onboarding-faculty').count()),
            'Sesudah persetujuan, data afiliasi tidak diminta ulang.',
        );
        check(
            (await page
                .getByRole('list', { name: 'Tahapan profil' })
                .getByRole('listitem')
                .count()) === 2 &&
                (await page.getByRole('dialog').innerText()).includes(
                    'Bekal kemampuan',
                ) &&
                (await page.getByRole('dialog').innerText()).includes(
                    'Cara berkolaborasi',
                ),
            'Pelengkapan sesudah verifikasi hanya memiliki dua langkah kemampuan dan kolaborasi.',
        );
        await page
            .getByRole('button', { name: 'Lanjutkan', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Simpan profil', exact: true })
            .click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        check(
            mutations.at(-1).body.faculty === 'Fakultas Sains & Teknologi' &&
                mutations.at(-1).body.study_program === 'Informatika (S1)' &&
                mutations.at(-1).body.admission_year === 2023,
            'Data akademik dari pemeriksaan status ikut tersimpan tanpa input ulang.',
        );
        state = {
            ...fresh(),
            membershipStatus: 'verified',
            profileId: 99003,
        };
        let existingProfile = {
            id: 99003,
            updated_at: '2026-10-14T10:00:00Z',
            revision: 'a'.repeat(64),
            bio: 'Profil dari onboarding. Data synthetic.',
            faculty: 'Fakultas Sains & Teknologi',
            study_program: 'Informatika (S1)',
            admission_year: 2023,
            skills: [],
            interests: [],
            availability_windows: [],
        };
        let profileUpdate = null;
        await context.route('**/student-profiles/**', async (route) => {
            const request = route.request();
            const url = new URL(request.url());

            if (
                request.method() === 'GET' &&
                url.pathname === '/student-profiles/edit'
            ) {
                const data = payload(url);
                data.props.profile = existingProfile;

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

            if (
                request.method() === 'PATCH' &&
                url.pathname === '/student-profiles/99003'
            ) {
                profileUpdate = request.postDataJSON();
                existingProfile = { ...existingProfile, ...profileUpdate };

                return route.fulfill({
                    contentType: 'application/json',
                    body: JSON.stringify({ data: existingProfile }),
                });
            }

            return route.fallback();
        });
        await page.goto(qaOrigin + '/student-profiles/edit');
        await page
            .getByLabel('Cerita singkat', { exact: true })
            .fill('Kemampuan diperbarui. Data synthetic.');
        await page.getByTestId('capability-save').click();
        await page.waitForURL((url) => url.pathname === '/dashboard');
        check(
            profileUpdate?.bio === 'Kemampuan diperbarui. Data synthetic.' &&
                profileUpdate?.expected_profile_revision === 'a'.repeat(64),
            'Profil dari onboarding disimpan lewat PATCH dengan revisi tersimpan.',
        );
        check(
            await page
                .getByText('Data profil berhasil tersimpan.', { exact: true })
                .isVisible(),
            'Simpan pada editor profil existing juga memberi notifikasi dan kembali ke Beranda.',
        );
        check(
            assetErrors.length === 0,
            'Seluruh asset gambar termuat tanpa HTTP error: ' +
                assetErrors.join(', '),
        );
        check(
            errors.length === 0,
            'Tidak ada exception JavaScript: ' + errors.join(', '),
        );
        await context.close();
        console.log(
            checks +
                ' pemeriksaan browser aktivasi U04 lulus. Data synthetic dengan command dicegat. Artefak: ' +
                artifacts,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
