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
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-u05-browser-'));
let passed = 0;
function check(ok, message) {
    assert.ok(ok, message);
    passed++;
    console.log('PASS ' + message);
}

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
    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const campus = {
        id: 99002,
        name: 'Universitas Teknologi Yogyakarta. Data synthetic',
    };
    const prefix = '/campus/' + campus.id;
    const mutations = [],
        errors = [],
        reads = [];
    let failure = null;
    const fresh = () => ({
        institution: campus,
        data: [
            {
                id: 10,
                user_id: 99001,
                name: 'Admin pertama. Data synthetic',
                status: 'verified',
                revision: 'a'.repeat(64),
            },
            {
                id: 11,
                user_id: 99003,
                name: 'Admin kedua. Data synthetic',
                status: 'verified',
                revision: 'b'.repeat(64),
            },
        ],
        invitations: {
            data: [
                {
                    id: 20,
                    phone_masked: '+62*******77',
                    status: 'issued',
                    delivery_status: 'queued',
                    expires_at: '2026-10-20T10:00:00Z',
                    can_revoke: true,
                },
                {
                    id: 21,
                    phone_masked: '+62*******88',
                    status: 'expired',
                    delivery_status: 'failed',
                    expires_at: '2026-10-01T10:00:00Z',
                    can_revoke: false,
                },
            ],
            current_page: 1,
            last_page: 2,
            total: 14,
        },
    });
    let accounts = fresh();
    const reviewNim = '2023994001'.repeat(5);
    const reviewPhone = '+6281399400088';
    function payload(url) {
        const pathname = new URL(url).pathname;
        let component = 'university/admins',
            props = accounts;

        if (pathname.endsWith('/students')) {
            component = 'university/students';
            props = {
                institution: campus,
                filters: {
                    q: new URL(url).searchParams.get('q') || '',
                    status: new URL(url).searchParams.get('status') || 'all',
                },
                students: {
                    data: [
                        {
                            id: 30,
                            name: 'Mahasiswa tanpa karya. Data synthetic',
                            status: 'pending',
                            study_program: null,
                        },
                    ],
                    current_page: 1,
                    last_page: 1,
                    total: 1,
                },
            };
        } else if (pathname.endsWith('/affiliations')) {
            component = 'campus/affiliations';
            props = {
                institution: campus,
                filters: { match: null, stale: null, sort: 'oldest' },
                reviewOutcome: null,
                reviewIssue: null,
                reviewQueue: {
                    items: [
                        {
                            id: 61,
                            nim: reviewNim,
                            phone: reviewPhone,
                            matchResult: 'no_match',
                            status: 'pending_review',
                            version: 1,
                            submittedAt: '2026-10-17T10:00:00Z',
                            isStale: false,
                            rosterSemester: null,
                            lock: {
                                ownedByCurrentUser: true,
                                expiresAt: '2030-10-17T10:05:00Z',
                            },
                        },
                        {
                            id: 62,
                            nim: '2023994002',
                            phone: null,
                            matchResult: 'no_match',
                            status: 'pending_review',
                            version: 1,
                            submittedAt: '2026-10-17T10:00:00Z',
                            isStale: false,
                            rosterSemester: null,
                            lock: null,
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        lastPage: 1,
                        perPage: 25,
                        total: 2,
                    },
                    summary: { total: 2, stale: 0, exact: 0, mismatch: 2 },
                    activeRoster: null,
                },
            };
        } else if (pathname.endsWith('/settings/skills')) {
            component = 'platform/skills';
            props = {
                institution: campus,
                filters: { q: '', category: 'all', status: 'all' },
                summary: {
                    totalSkills: 1,
                    verifiedSkills: 1,
                    unverifiedSkills: 0,
                    categoriesCount: 1,
                },
                categories: ['software'],
                skills: [
                    {
                        id: 40,
                        name: 'Keahlian. Data synthetic',
                        category: 'software',
                        description: 'Pernyataan mahasiswa bukan sertifikasi.',
                        isVerified: true,
                        profileSkillsCount: 1,
                        projectRoleSkillsCount: 2,
                        updatedAt: '2026-10-14T10:00:00Z',
                    },
                ],
            };
        } else if (pathname.endsWith('/settings')) {
            component = 'university/settings';
            props = {
                institution: {
                    ...campus,
                    timezone: 'Asia/Jakarta',
                    locale: 'id',
                },
                rosters: {
                    data: [
                        {
                            id: 50,
                            semester: '2026-ganjil. Data synthetic',
                            status: 'active',
                            activated_at: '2026-10-14',
                            superseded_at: null,
                        },
                    ],
                    current_page: 1,
                    last_page: 1,
                    total: 1,
                },
            };
        }

        return {
            ...initial,
            component,
            url: pathname + new URL(url).search,
            props: {
                ...initial.props,
                ...props,
                errors: {},
                onboarding: null,
                shell: { institutionMembership: null },
                sidebarOpen: true,
                auth: {
                    user: {
                        id: 99001,
                        name: 'Admin pertama. Data synthetic',
                        workspace: {
                            role: 'campus_admin',
                            institution: campus,
                            recruiterOrganization: null,
                        },
                    },
                },
            },
        };
    }

    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
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

            if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method())) {
                mutations.push({
                    path: url.pathname,
                    body: req.postDataJSON(),
                });

                if (url.pathname === '/user/confirm-password') {
                    if (req.postDataJSON().password !== 'Synthetic!2026') {
                        return route.fulfill({
                            status: 422,
                            json: {
                                message: 'Sandi salah.',
                                errors: { password: ['Sandi salah.'] },
                            },
                        });
                    }

                    return route.fulfill({ status: 201, json: {} });
                }

                if (failure === 'network') {
                    failure = null;

                    return route.abort('failed');
                }

                if (failure) {
                    const code = failure;
                    failure = null;

                    return route.fulfill({
                        status: code,
                        json:
                            code === 422
                                ? {
                                      message: 'Validasi synthetic.',
                                      errors: {
                                          reason: [
                                              'Alasan perlu diperbaiki. Data synthetic.',
                                          ],
                                      },
                                  }
                                : { message: 'Gangguan synthetic.' },
                    });
                }

                if (url.pathname.includes('/status')) {
                    const target = accounts.data.find(
                        (item) =>
                            item.id === Number(url.pathname.split('/').at(-2)),
                    );
                    target.status = req.postDataJSON().status;
                    target.revision = 'c'.repeat(64);
                }

                if (url.pathname.includes('/revoke')) {
                    accounts.invitations.data[0].can_revoke = false;
                }

                return route.fulfill({
                    status: 201,
                    json: { data: { id: 11 } },
                });
            }

            if (url.pathname.startsWith(prefix)) {
                reads.push(url.pathname + url.search);

                if (failure === 'read403') {
                    failure = null;

                    return route.fulfill({
                        status: 403,
                        json: { message: 'Akses synthetic dicabut.' },
                    });
                }

                const page = payload(req.url());

                if (req.resourceType() === 'document') {
                    return route.fulfill({
                        contentType: 'text/html',
                        body: template.replace(
                            tag,
                            (_, start, _body, end) =>
                                start +
                                JSON.stringify(page).replace(/</g, '\\u003c') +
                                end,
                        ),
                    });
                }

                if (
                    !req.headers()['x-inertia'] &&
                    url.pathname.endsWith('/admins')
                ) {
                    return route.fulfill({ json: accounts });
                }

                return route.fulfill({
                    headers: { 'X-Inertia': 'true' },
                    json: page,
                });
            }

            if (
                /^\/(images|fonts|build|@|resources|storage|favicon)/.test(
                    url.pathname,
                )
            ) {
                return route.fallback();
            }

            return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        async function load(suffix) {
            await page.goto(qaOrigin + prefix + suffix);
            await page.locator('h1').waitFor();
        }

        for (const [suffix, id] of [
            ['/students', 'university-students'],
            ['/settings', 'university-settings'],
            ['/settings/skills', 'university-skills'],
            ['/admins', 'university-admins'],
            ['/affiliations', 'affiliation-review-root'],
        ]) {
            for (const width of [320, 768, 1280, 1920, 3440]) {
                await page.setViewportSize({
                    width,
                    height: width < 768 ? 740 : 1080,
                });
                await load(suffix);
                await page.getByTestId(id).waitFor();
                const hero = page
                    .getByTestId(id)
                    .locator('.campus-operation-header');
                check(
                    (await hero.count()) === 1 &&
                        (await hero.locator('.satu-mascot, img').count()) ===
                            0 &&
                        (await hero
                            .locator(
                                '.campus-header-backdrop[aria-hidden="true"]',
                            )
                            .count()) === 1,
                    id + ': hero formal bertema tanpa maskot ' + width + 'px.',
                );
                await page.waitForFunction(() =>
                    [...document.images].every(
                        (image) => image.complete && image.naturalWidth > 0,
                    ),
                );
                check(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    ),
                    id + ' reflow ' + width + 'px.',
                );
                check(
                    await page.getByTestId(id).locator('h1').isVisible(),
                    id + ' heading terlihat ' + width + 'px.',
                );

                if ([320, 1280].includes(width)) {
                    await page.screenshot({
                        path: path.join(artifacts, id + '-' + width + '.png'),
                        fullPage: true,
                    });
                }
            }
        }

        await page.setViewportSize({ width: 1280, height: 1080 });
        accounts = fresh();
        await load('/admins');
        const navigation = page.getByRole('navigation', {
            name: 'Navigasi Admin Universitas',
            exact: true,
        });
        check(
            (await navigation.getByRole('link').allTextContents())
                .map((item) => item.trim())
                .join('|') ===
                'Ringkasan|Mahasiswa|Roster mahasiswa|Validasi kontribusi|Peringkat|Bantuan kesempatan|Pengaturan',
            'Navigasi admin mempertahankan menu inti serta Peringkat.',
        );
        check(
            (await navigation
                .getByRole('link', { name: 'Pengaturan', exact: true })
                .getAttribute('aria-current')) === 'page',
            'Akun admin menandai Pengaturan sebagai menu aktif.',
        );
        const business = () =>
            mutations.filter((item) => item.path !== '/user/confirm-password');
        await page
            .getByRole('button', { name: 'Undang admin', exact: true })
            .click();
        const dialog = page.getByRole('dialog');
        check(
            (await dialog.innerText()).includes(
                'Penerima diundang sebagai Admin Universitas untuk ' +
                    campus.name,
            ),
            'Undangan menyebut universitas dari server, bukan pilihan kampus.',
        );
        await dialog
            .getByLabel('Nomor WhatsApp', { exact: true })
            .fill('+6281399400077');
        await dialog
            .getByLabel('Sandi saat ini', { exact: true })
            .fill('wrong');
        await dialog
            .getByRole('button', { name: 'Konfirmasi sandi', exact: true })
            .click();
        await dialog.getByText('Sandi salah.', { exact: true }).waitFor();
        check(business().length === 0, 'Sandi salah tidak mengirim undangan.');
        await page.waitForFunction(
            () => document.activeElement?.getAttribute('role') === 'alert',
        );
        check(true, 'Error sandi menerima fokus dalam dialog.');
        await dialog
            .getByLabel('Sandi saat ini', { exact: true })
            .fill('Synthetic!2026');
        await dialog
            .getByRole('button', { name: 'Konfirmasi sandi', exact: true })
            .click();
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan', exact: true })
            .waitFor();
        check(
            business().length === 0,
            'Konfirmasi sandi tidak langsung menjalankan command.',
        );
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan', exact: true })
            .dblclick();
        await dialog.waitFor({ state: 'hidden' });
        check(
            business().length === 1 && !('intended_role' in business()[0].body),
            'Satu command undangan tanpa role kiriman browser.',
        );
        check(
            await page
                .getByRole('button', { name: 'Undang admin', exact: true })
                .isDisabled(),
            'Sukses command menahan mutasi sampai GET terbaru.',
        );
        await page
            .getByRole('button', {
                name: 'Periksa daftar terbaru',
                exact: true,
            })
            .click();
        await page
            .getByRole('button', { name: 'Undang admin', exact: true })
            .waitFor({ state: 'visible' });
        check(
            await page
                .getByRole('button', { name: 'Undang admin', exact: true })
                .isEnabled(),
            'GET sukses membuka tindakan lagi.',
        );
        async function statusDialog() {
            await page
                .getByRole('button', { name: 'Tangguhkan akses', exact: true })
                .last()
                .click();
            await dialog
                .getByLabel('Alasan tindakan', { exact: true })
                .fill('Alasan synthetic untuk pengujian.');
            await dialog
                .getByLabel('Sandi saat ini', { exact: true })
                .fill('Synthetic!2026');
            await dialog
                .getByRole('button', { name: 'Konfirmasi sandi', exact: true })
                .click();
            await dialog
                .getByRole('button', {
                    name: 'Konfirmasi tindakan',
                    exact: true,
                })
                .waitFor();
        }
        await statusDialog();
        failure = 'network';
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan', exact: true })
            .click();
        await dialog.getByText(/Hasil tindakan belum pasti/).waitFor();
        check(
            await dialog
                .getByRole('button', { name: 'Konfirmasi tindakan' })
                .isDisabled(),
            'Jaringan belum pasti memblokir pengiriman ulang.',
        );
        check(
            (await dialog
                .getByLabel('Alasan tindakan', { exact: true })
                .inputValue()) === 'Alasan synthetic untuk pengujian.',
            'Alasan bertahan pada jaringan gagal.',
        );
        accounts.data[1].revision = 'd'.repeat(64);
        await dialog
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await dialog.getByText(/Data admin berubah/).waitFor();
        check(
            await dialog
                .getByRole('button', { name: 'Konfirmasi tindakan' })
                .isDisabled(),
            'Refresh tidak mengganti revision keputusan lama diam-diam.',
        );
        await dialog
            .getByRole('button', { name: 'Batal', exact: true })
            .click();
        await statusDialog();
        failure = 409;
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan' })
            .click();
        await dialog.getByText(/Keputusan memakai data lama/).waitFor();
        check(
            await dialog
                .getByRole('button', { name: 'Konfirmasi tindakan' })
                .isDisabled(),
            '409 mempunyai pemulihan, tanpa retry mutasi otomatis.',
        );
        await dialog
            .getByRole('button', { name: 'Batal', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await statusDialog();
        failure = 423;
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan' })
            .click();
        await dialog.getByLabel('Sandi saat ini', { exact: true }).waitFor();
        check(
            await dialog
                .getByRole('button', { name: 'Konfirmasi sandi' })
                .isVisible(),
            'Konfirmasi expired meminta sandi lagi.',
        );
        await dialog
            .getByRole('button', { name: 'Batal', exact: true })
            .click();
        await statusDialog();
        failure = 422;
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan' })
            .click();
        await dialog
            .getByText('Alasan perlu diperbaiki. Data synthetic.', {
                exact: true,
            })
            .waitFor();
        check(
            await dialog
                .getByLabel('Alasan tindakan', { exact: true })
                .isEnabled(),
            'Validasi command membuka isian untuk diperbaiki, bukan form terkunci.',
        );
        check(
            (await dialog
                .getByLabel('Alasan tindakan', { exact: true })
                .inputValue()) === 'Alasan synthetic untuk pengujian.',
            'Validasi mempertahankan alasan sebelumnya.',
        );
        await dialog
            .getByRole('button', { name: 'Batal', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Cabut undangan', exact: true })
            .click();
        await dialog
            .getByLabel('Alasan tindakan', { exact: true })
            .fill('Pencabutan undangan. Data synthetic.');
        await dialog
            .getByLabel('Sandi saat ini', { exact: true })
            .fill('Synthetic!2026');
        await dialog.getByRole('button', { name: 'Konfirmasi sandi' }).click();
        await dialog
            .getByRole('button', { name: 'Konfirmasi tindakan' })
            .click();
        await dialog.waitFor({ state: 'hidden' });
        await page
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await page.waitForFunction(
            () =>
                [...document.querySelectorAll('button')].filter(
                    (item) => item.textContent.trim() === 'Cabut undangan',
                ).length === 0,
        );
        check(
            true,
            'Pencabutan memakai alasan dan status hasil GET tanpa menghapus riwayat.',
        );
        failure = 'read403';
        await page
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await page.getByText(/Data sebelumnya disembunyikan/).waitFor();
        check(
            (await page
                .getByRole('heading', { name: 'Admin kedua. Data synthetic' })
                .count()) === 0,
            '403 menyembunyikan snapshot pengelola sebelumnya.',
        );
        await page
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await page
            .getByRole('heading', { name: 'Pengelola universitas' })
            .waitFor();
        accounts.data = accounts.data.slice(0, 1);
        await page
            .getByRole('button', { name: 'Periksa daftar terbaru' })
            .click();
        await page
            .getByRole('button', { name: 'Admin aktif terakhir' })
            .waitFor();
        check(
            await page
                .getByRole('button', { name: 'Admin aktif terakhir' })
                .isDisabled(),
            'Admin terakhir dijelaskan dengan target disabled.',
        );
        await load('/students');
        await page.getByLabel('Cari nama', { exact: true }).fill('Pemula');
        await page.getByRole('button', { name: 'Terapkan filter' }).click();
        await page.waitForURL(/q=Pemula/);
        check(
            reads.some((url) => url.includes('q=Pemula')),
            'Filter mahasiswa tersimpan pada URL server.',
        );
        await load('/affiliations');
        check(
            (await page.getByText(reviewNim, { exact: true }).isVisible()) &&
                (await page
                    .getByText(reviewPhone, { exact: true })
                    .isVisible()),
            'Antrean afiliasi memperlihatkan NIM dan WhatsApp lengkap dari server.',
        );
        check(
            await page.getByText('Belum tersedia', { exact: true }).isVisible(),
            'Nomor yang kosong memiliki keterangan, bukan nomor contoh.',
        );
        const beforeReview = mutations.length;
        await page
            .getByRole('button', { name: 'Lanjutkan tinjauan', exact: true })
            .click();
        const reviewForm = page.getByRole('form', {
            name: 'Tinjau berkas AF-61',
            exact: true,
        });
        check(
            (await reviewForm
                .getByText(reviewNim, { exact: true })
                .isVisible()) &&
                (await reviewForm
                    .getByText(reviewPhone, { exact: true })
                    .isVisible()),
            'Panel keputusan menampilkan identitas lengkap yang sama untuk pencocokan.',
        );
        check(
            mutations.length === beforeReview,
            'Membuka kunci sendiri tidak mengirim keputusan atau pengajuan baru.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'affiliation-full-review.png'),
            fullPage: true,
        });
        failure = 'read403';
        await page
            .getByRole('button', { name: 'Muat ulang', exact: true })
            .click();
        await page
            .getByRole('heading', {
                name: 'Akses antrean tidak tersedia',
                exact: true,
            })
            .waitFor();
        check(
            (await page.getByText(reviewNim, { exact: true }).count()) === 0 &&
                (await page.getByText(reviewPhone, { exact: true }).count()) ===
                    0 &&
                (await page
                    .getByRole('form', {
                        name: 'Tinjau berkas AF-61',
                        exact: true,
                    })
                    .count()) === 0,
            'Izin dicabut menyembunyikan identitas lengkap pada daftar dan panel keputusan.',
        );
        await load('/settings/skills');
        await page
            .getByRole('button', { name: 'Tambah keahlian', exact: true })
            .click();
        await dialog.waitFor();
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(
            () => document.activeElement?.tagName === 'H2',
        );
        check(true, 'Dialog katalog mendukung Escape dan pemulihan fokus.');
        await page.evaluate(() => {
            document.body.style.zoom = '2';
        });
        check(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Katalog tetap reflow pada zoom 200 persen.',
        );
        check(errors.length === 0, 'Tidak ada exception React/browser.');
        check(
            mutations.every((item) =>
                [
                    '/user/confirm-password',
                    '/platform/institutions/99002/invitations',
                    '/university/admins/11/status',
                    '/platform/invitations/20/revoke',
                ].includes(item.path),
            ),
            'Seluruh command hanya fixture yang dicegat, tanpa mutasi akun lokal.',
        );
        console.log(
            passed + ' pemeriksaan browser U05 lulus. Artefak: ' + artifacts,
        );
        await context.close();
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
