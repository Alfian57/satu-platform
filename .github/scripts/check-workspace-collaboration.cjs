const assert = require('node:assert/strict');
const { chromium } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);
const fs = require('node:fs'),
    os = require('node:os'),
    path = require('node:path');
const artifactDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'satu-t07-browser-'),
);
const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://localhost:8000',
    date = '2030-10-10T09:00:00Z';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
    'Fixture browser hanya boleh dijalankan pada server lokal.',
);
let checks = 0,
    revision = 1,
    failure = null,
    readFailure = null,
    delay = 0,
    tasks = [],
    proofs = [],
    messages = [];
const mutations = [],
    reads = [],
    errors = [];
const rev = () => String(revision % 10).repeat(64);
const person = { id: 99003, name: 'Mahasiswa. Data sintetis' };
function verify(condition, message) {
    assert.ok(condition, message);
    checks++;
    console.log('PASS ' + message);
}
function reset() {
    revision = 1;
    failure = readFailure = null;
    proofs = [];
    messages = [];
    tasks = [91011, 91012, 91013, 91014].map((id, i) => ({
        id,
        title: 'Hasil pekerjaan ' + i + '. Data sintetis',
        description: 'Susun satu lembar yang dapat diperiksa tim.',
        status: 'todo',
        priority: 'medium',
        due_at: date,
        is_overdue: false,
        created_by: person,
        assignments:
            i === 2
                ? []
                : [
                      {
                          id: 92000 + i,
                          user:
                              i === 1
                                  ? { id: 99004, name: 'Rekan. Data sintetis' }
                                  : person,
                      },
                  ],
        created_at: date,
        updated_at: date,
        revision: rev(),
    }));
}
function evidencePage(page = 1) {
    return {
        data: proofs.slice((page - 1) * 10, page * 10),
        meta: {
            current_page: page,
            last_page: Math.max(1, Math.ceil(proofs.length / 10)),
            total: proofs.length,
        },
    };
}
function discussionPage() {
    return {
        data: messages,
        links: [],
        meta: {
            current_page: 1,
            from: messages.length ? 1 : null,
            to: messages.length || null,
            last_page: 1,
            per_page: 20,
            total: messages.length,
        },
    };
}
const echoModule = `let listeners=new Map();window.__left=0;window.__emit=(name,data)=>listeners.get(name)?.(data);const channel={listen(name,cb){listeners.set(name,cb);return this},stopListening(name){listeners.delete(name);return this},subscribed(cb){setTimeout(cb,50);return this},error(){return this}};const presence={here(cb){cb([{id:'99003',name:'Mahasiswa. Data sintetis'}]);return this},joining(){return this},leaving(){return this},error(){return this}};const echo={connector:{onConnectionChange(cb){window.__connection=cb;return()=>{}}},private(){return channel},join(){return presence},leave(){window.__left++}};export function getWorkspaceEcho(){return echo}export function resetWorkspaceEcho(){}`;
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
                    `satu:feature-guide:${id}:user:99003`,
                    'seen',
                );
            }
        });
        function payload(url) {
            const scope = url.searchParams.get('scope') || 'all',
                taskId = Number(url.searchParams.get('task')) || null,
                per = Number(url.searchParams.get('per_page')) || 20,
                p = Number(url.searchParams.get('page')) || 1;
            let list = tasks.filter((t) =>
                scope === 'mine'
                    ? t.assignments.some((a) => a.user.id === person.id)
                    : scope === 'unassigned'
                      ? t.assignments.length === 0
                      : true,
            );

            if (taskId) {
                list = list.filter((t) => t.id === taskId);
            }

            return {
                ...initial,
                component: 'projects/workspace',
                url: url.pathname + url.search,
                props: {
                    ...initial.props,
                    name: 'SATU',
                    sidebarOpen: true,
                    auth: {
                        user: {
                            ...person,
                            username: 'PRIVATE_USERNAME',
                            created_at: date,
                            updated_at: date,
                            workspace: {
                                role: 'student',
                                institution: null,
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
                    onboarding: null,
                    errors: {},
                    project: {
                        id: 91001,
                        institution_id: 99002,
                        title: 'Ruang kerja kolaborasi. Data sintetis',
                        status: 'open',
                        deadline: '2035-10-10T09:00:00Z',
                        owner: { id: 99004, name: 'Pemilik. Data sintetis' },
                    },
                    tasks: {
                        data: list.slice((p - 1) * per, p * per),
                        links: [],
                        meta: {
                            current_page: p,
                            from: list.length ? 1 : null,
                            to: list.length || null,
                            per_page: per,
                            last_page: Math.max(
                                1,
                                Math.ceil(list.length / per),
                            ),
                            total: list.length,
                        },
                    },
                    discussion: discussionPage(),
                    evidence: evidencePage(
                        Number(url.searchParams.get('evidence_page')) || 1,
                    ),
                    members: [
                        person,
                        {
                            id: 99004,
                            name: 'Pemilik. Data sintetis',
                            role: 'Perancang',
                        },
                    ],
                    filters: {
                        q: '',
                        status: null,
                        priority: null,
                        per_page: per,
                        page: p,
                        scope,
                        task: taskId,
                    },
                    permissions: { can_create: true, can_manage_tasks: true },
                },
            };
        }
        await context.route('**/*', async (route) => {
            const req = route.request(),
                url = new URL(req.url());

            if (url.pathname.includes('/resources/js/lib/workspace-echo.ts')) {
                return route.fulfill({
                    contentType: 'application/javascript',
                    headers: { 'Access-Control-Allow-Origin': qaOrigin },
                    body: echoModule,
                });
            }

            if (url.hostname.includes('google')) {
                return route.abort();
            }

            if (url.origin !== qaOrigin) {
                return req.method() === 'GET'
                    ? route.fallback()
                    : route.abort('blockedbyclient');
            }

            if (url.pathname === '/_boost/browser-logs') {
                return route.fulfill({ status: 204 });
            }

            if (req.method() !== 'GET') {
                const multipart = req
                        .headers()
                        ['content-type']?.includes('multipart'),
                    data = multipart
                        ? { raw: req.postData() }
                        : req.postDataJSON();
                mutations.push({
                    path: url.pathname,
                    method: req.method(),
                    data,
                });

                if (delay) {
                    await new Promise((r) => setTimeout(r, delay));
                }

                if (failure === 'network') {
                    return route.abort('failed');
                }

                if (
                    failure &&
                    !(
                        failure === 'upload422' &&
                        !url.pathname.endsWith('/attachments')
                    )
                ) {
                    return route.fulfill({
                        status: failure === 'upload422' ? 422 : failure,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            message: 'Synthetic error',
                            ...(failure === 422 || failure === 'upload422'
                                ? {
                                      errors: url.pathname.includes(
                                          'attachments',
                                      )
                                          ? {
                                                file: [
                                                    'Berkas ditolak. Data sintetis.',
                                                ],
                                            }
                                          : url.pathname.includes('discussions')
                                            ? { body: ['Catatan wajib diisi.'] }
                                            : { title: ['Judul wajib diisi.'] },
                                  }
                                : {}),
                        }),
                    });
                }

                if (url.pathname.endsWith('/attachments')) {
                    const item = {
                        id: 93000 + proofs.length,
                        purpose: 'evidence',
                        message_id: null,
                        original_name: 'hasil.txt',
                        mime_type: 'text/plain',
                        size_bytes: 80,
                        uploaded_by: person,
                        created_at: date,
                        updated_at: date,
                    };
                    proofs.unshift(item);

                    return route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: item }),
                    });
                }

                if (url.pathname.endsWith('/discussions')) {
                    const item = {
                        id: 94000 + messages.length,
                        body: data.body,
                        author: person,
                        attachments: [],
                        is_edited: false,
                        created_at: date,
                        updated_at: date,
                    };
                    messages.unshift(item);

                    return route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: item }),
                    });
                }

                if (url.pathname.endsWith('/tasks')) {
                    revision++;
                    const item = {
                        ...tasks[0],
                        id: 91099,
                        title: data.title,
                        description: data.description,
                        assignments: [],
                        revision: rev(),
                    };
                    tasks.unshift(item);

                    return route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: item }),
                    });
                }

                const match = url.pathname.match(/tasks\/(\d+)/),
                    task = match
                        ? tasks.find((t) => t.id === Number(match[1]))
                        : null;

                if (task) {
                    if (data.expected_revision !== task.revision) {
                        return route.fulfill({
                            status: 409,
                            contentType: 'application/json',
                            body: JSON.stringify({
                                message: 'Synthetic conflict',
                            }),
                        });
                    }

                    revision++;
                    task.revision = rev();

                    if (req.method() === 'PATCH') {
                        Object.assign(task, {
                            title: data.title,
                            description: data.description,
                        });
                    }

                    if (url.pathname.endsWith('/transition')) {
                        task.status = data.status;
                    }

                    if (
                        req.method() === 'DELETE' &&
                        !url.pathname.endsWith('/assignment')
                    ) {
                        tasks = tasks.filter((t) => t.id !== task.id);
                    }

                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: task }),
                    });
                }

                return route.fulfill({
                    status: 403,
                    body: 'Synthetic mutation blocked',
                });
            }

            if (
                url.pathname.endsWith('/attachments') ||
                url.pathname.endsWith('/discussions')
            ) {
                reads.push({ path: url.pathname });

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
                    body: JSON.stringify(
                        url.pathname.endsWith('/attachments')
                            ? evidencePage(
                                  Number(
                                      url.searchParams.get('evidence_page'),
                                  ) || 1,
                              )
                            : discussionPage(),
                    ),
                });
            }

            if (!req.isNavigationRequest() && !req.headers()['x-inertia']) {
                return route.fallback();
            }

            reads.push({
                path: url.pathname,
                only: req.headers()['x-inertia-partial-data'],
                query: url.search,
            });

            if (req.headers()['x-inertia'] && readFailure) {
                return readFailure === 'network'
                    ? route.abort('failed')
                    : route.fulfill({
                          status: readFailure,
                          contentType: 'text/html',
                          body: 'Synthetic denied',
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
            console.error('JS', e.message);
        });
        page.setDefaultTimeout(60000);
        await page.setViewportSize({ width: 1440, height: 1000 });
        async function load(query = '') {
            await page.goto(qaOrigin + '/projects/91001/workspace' + query, {
                waitUntil: 'domcontentloaded',
            });
            await page.locator('[data-test="task-edit-title"]').waitFor();
            await page.waitForFunction(
                () =>
                    !document.querySelector('[data-test="task-edit-submit"]')
                        .disabled,
            );
        }
        async function emit(resource, id = 91011) {
            await page.evaluate(
                ({ resource, id }) =>
                    window.__emit('.workspace.' + resource + '.changed', {
                        resource,
                        resource_id: id,
                        institution_id: 99002,
                        project_id: 91001,
                        operation:
                            resource === 'attachment'
                                ? 'attachment.created'
                                : 'task.updated',
                        version: 'b'.repeat(64),
                        occurred_at: '2030-10-10T09:00:01Z',
                    }),
                { resource, id },
            );
        }
        async function stable() {
            await page.waitForFunction(
                () =>
                    document
                        .querySelector('[data-test="workspace-root"]')
                        ?.getAttribute('aria-busy') === 'false',
            );
        }
        reset();
        await load();

        for (const width of [320, 768, 1280, 1920, 3440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.evaluate(() => document.fonts.ready);
            verify(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                'Ruang kerja reflow ' + width + 'px.',
            );
        }

        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(() => (document.body.style.zoom = '2'));
        verify(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'Reflow zoom 200 persen.',
        );
        await page.evaluate(() => (document.body.style.zoom = ''));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.locator('[data-test="task-row-91012"]').focus();
        await page.keyboard.press('Enter');
        verify(
            await page
                .locator('#workspace-detail-title')
                .evaluate((el) => document.activeElement === el),
            'Keyboard memilih tugas dan berpindah ke judul detail.',
        );
        await page.locator('[data-test="task-row-91011"]').click();
        await page
            .locator('#task-edit-description')
            .fill('Draft individual yang belum disimpan.');
        tasks[0].description = 'Catatan terbaru dari rekan.';
        revision++;
        tasks[0].revision = rev();
        await emit('task');
        await page.locator('[data-test="task-draft-conflict"]').waitFor();
        verify(
            (await page.locator('#task-edit-description').inputValue()) ===
                'Draft individual yang belum disimpan.' &&
                (await page
                    .locator('[data-test="task-edit-submit"]')
                    .isDisabled()),
            'Delta menjaga draft/revisi lama dan menahan penimpaan.',
        );
        const deltaReads = reads.length;
        await emit('task');
        await page.waitForTimeout(200);
        verify(
            reads.length === deltaReads,
            'Delta duplikat tidak memicu pembacaan berulang.',
        );
        await page.evaluate(() =>
            window.__emit('.workspace.task.changed', {
                resource: 'task',
                resource_id: 91011,
                institution_id: 99999,
                project_id: 91001,
                operation: 'task.updated',
                version: 'c',
                occurred_at: '2030-10-10T09:00:02Z',
            }),
        );
        await page.waitForTimeout(150);
        verify(reads.length === deltaReads, 'Delta tenant lain diabaikan.');
        page.once('dialog', (d) => d.dismiss());
        await page.locator('[data-test="task-use-latest"]').click();
        verify(
            (await page.locator('#task-edit-description').inputValue()) ===
                'Draft individual yang belum disimpan.',
            'Membatalkan pergantian snapshot mempertahankan draft.',
        );
        page.once('dialog', (d) => d.accept());
        await page.locator('[data-test="task-use-latest"]').click();
        verify(
            (await page.locator('#task-edit-description').inputValue()) ===
                'Catatan terbaru dari rekan.',
            'Memakai snapshot terbaru memerlukan tindakan dan konfirmasi pengguna.',
        );
        await page
            .locator('#task-edit-title')
            .fill('Judul perubahan. Data sintetis');
        delay = 250;
        let count = mutations.length;
        await page.locator('[data-test="task-edit-submit"]').dblclick();
        await stable();
        await page.locator('[data-test="workspace-action-success"]').waitFor();
        delay = 0;
        verify(
            mutations.length === count + 1 &&
                mutations.at(-1).data.expected_revision === '2'.repeat(64),
            'Simpan memakai revisi asli dan satu command untuk klik ganda.',
        );
        await page
            .locator('#task-edit-description')
            .fill('Draft jaringan terputus.');
        failure = 'network';
        count = mutations.length;
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('[data-test="workspace-action-error"]').waitFor();
        verify(
            await page.locator('[data-test="task-edit-submit"]').isDisabled(),
            'Hasil command belum pasti menahan pengiriman berikutnya.',
        );
        failure = null;
        readFailure = 'network';
        await page.locator('[data-test="workspace-action-recovery"]').click();
        await stable();
        verify(
            await page.locator('[data-test="task-edit-submit"]').isDisabled(),
            'GET pemulihan gagal tidak membuka kunci command.',
        );
        readFailure = null;
        await page.locator('[data-test="workspace-refresh"]').click();
        await stable();
        verify(
            (await page.locator('#task-edit-description').inputValue()) ===
                'Draft jaringan terputus.' && mutations.length === count + 1,
            'Pemulihan membaca database tanpa POST ulang atau menghapus draft.',
        );
        reset();
        await load();
        failure = 422;
        await page.locator('#task-edit-title').fill('Judul draft.');
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('#task-edit-title[aria-invalid="true"]').waitFor();
        await page.waitForFunction(
            () => document.activeElement?.id === 'task-edit-title',
        );
        verify(
            (await page
                .locator('#task-edit-title')
                .evaluate((el) => el === document.activeElement)) &&
                (await page.locator('#task-edit-title').inputValue()) ===
                    'Judul draft.',
            'Validasi memfokuskan isian terkait dan mempertahankan draft.',
        );
        failure = null;
        reset();
        await load();
        await page.locator('[data-test="workspace-scope-mine"]').click();
        await stable();
        verify(
            (await page
                .locator('[data-test="workspace-task-list"] li')
                .count()) === 2 && reads.at(-1).query.includes('scope=mine'),
            'Tugas saya mengirim cakupan ke server, bukan filter lokal.',
        );
        await page.locator('[data-test="workspace-scope-unassigned"]').click();
        await stable();
        verify(
            (await page.locator('[data-test="task-row-91013"]').count()) ===
                1 &&
                (await page.locator('[data-test="task-row-91011"]').count()) ===
                    0,
            'Tugas belum dibagi terpisah dari tanggung jawab pribadi.',
        );
        await load('?task=91014');
        verify(
            (await page.locator('#workspace-detail-title').textContent()) ===
                tasks[3].title,
            'Deep link Beranda membuka tugas tertentu.',
        );
        reset();
        await load();
        const syntheticFile = {
            name: 'hasil.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('Bukti sintetis pekerjaan individual.'),
        };
        await page
            .locator('#workspace-evidence-file')
            .setInputFiles(syntheticFile);
        count = mutations.length;
        delay = 250;
        await page.locator('[data-test="evidence-submit"]').dblclick();
        await page.locator('[data-test="evidence-success"]').waitFor();
        await page
            .locator('[data-test="discussion-attachment-93000"]')
            .waitFor();
        delay = 0;
        verify(
            mutations.length === count + 1 &&
                mutations.at(-1).path.endsWith('/attachments') &&
                messages.length === 0,
            'Unggah bukti langsung tidak membuat pesan dan tidak menggandakan request.',
        );
        await page
            .locator('#workspace-evidence-file')
            .setInputFiles(syntheticFile);
        failure = 422;
        await page.locator('[data-test="evidence-submit"]').click();
        await page.locator('#evidence-file-error').waitFor();
        await page.waitForFunction(
            () => document.activeElement?.id === 'workspace-evidence-file',
        );
        verify(
            await page
                .locator('#workspace-evidence-file')
                .evaluate(
                    (el) =>
                        el === document.activeElement && el.files.length === 1,
                ),
            'Unggah gagal menjaga berkas dan fokus validasi.',
        );
        failure = null;
        await page
            .locator('#workspace-evidence-file')
            .setInputFiles(syntheticFile);
        failure = 'network';
        count = mutations.length;
        await page.locator('[data-test="evidence-submit"]').click();
        await page.locator('[data-test="evidence-error"]').waitFor();
        verify(
            await page.locator('[data-test="evidence-submit"]').isDisabled(),
            'Unggah belum pasti menahan retry sampai pemeriksaan.',
        );
        failure = null;
        readFailure = 'network';
        await page.locator('[data-test="evidence-refresh"]').click();
        await page.waitForTimeout(150);
        verify(
            await page.locator('[data-test="evidence-submit"]').isDisabled(),
            'Pemeriksaan bukti gagal tidak menganggap unggah selesai.',
        );
        readFailure = null;
        await page.locator('[data-test="evidence-refresh"]').click();
        await page.waitForFunction(
            () =>
                !document.querySelector('[data-test="evidence-submit"]')
                    .disabled,
        );
        verify(
            mutations.length === count + 1 &&
                (await page
                    .locator('#workspace-evidence-file')
                    .evaluate((el) => el.files.length === 1)),
            'Pemeriksaan unggah hanya GET, berkas masih dipilih dan tidak dikirim otomatis.',
        );
        reset();
        await load();
        await page
            .locator('#discussion-body')
            .fill('Catatan opsional. Data sintetis');
        failure = 'network';
        count = mutations.length;
        await page.locator('[data-test="discussion-submit"]').click();
        await page.locator('[data-test="discussion-action-error"]').waitFor();
        verify(
            (await page
                .locator('[data-test="discussion-submit"]')
                .isDisabled()) &&
                (await page.locator('#discussion-body').inputValue()) ===
                    'Catatan opsional. Data sintetis',
            'Catatan belum pasti mempertahankan draft dan menahan pengiriman.',
        );
        failure = null;
        await page.locator('[data-test="discussion-check-latest"]').click();
        await page.locator('[data-test="discussion-action-success"]').waitFor();
        verify(
            mutations.length === count + 1,
            'Pemeriksaan diskusi tidak mengirim pesan ulang.',
        );
        reset();
        await load();
        count = reads.length;
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page
            .getByText('Koneksi offline, menunggu pemulihan', { exact: true })
            .waitFor();
        verify(
            await page.locator('[data-test="task-edit-submit"]').isDisabled(),
            'Offline menahan mutasi tanpa memaksa percakapan.',
        );
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await stable();
        verify(
            reads.length > count && reads.at(-1).only.includes('evidence'),
            'Koneksi pulih merekonsiliasi tugas, diskusi, bukti, dan izin.',
        );
        await page.setViewportSize({ width: 320, height: 568 });
        await page.locator('[data-test="task-delete"]').click();
        await page.getByRole('dialog').waitFor();
        await page
            .locator('[data-test="task-delete-confirm"]')
            .scrollIntoViewIfNeeded();
        verify(
            (await page
                .locator('[data-test="task-delete-confirm"]')
                .isVisible()) &&
                (await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                )),
            'Dialog penghapusan bisa dioperasikan pada mobile pendek.',
        );
        await page
            .getByRole('button', { name: 'Kembali', exact: true })
            .click();
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.screenshot({
            path: path.join(artifactDirectory, 'satu-t07-workspace.png'),
            fullPage: true,
        });
        await page.locator('[data-test="workspace-evidence"]').screenshot({
            path: path.join(artifactDirectory, 'satu-t07-evidence.png'),
        });

        reset();
        await load();
        await page
            .locator('#task-edit-description')
            .fill('Draft dari tugas terhapus.');
        tasks = tasks.filter((t) => t.id !== 91011);
        await emit('task');
        await page.locator('[data-test="task-missing-draft"]').waitFor();
        verify(
            (await page.locator('#missing-task-draft').inputValue()) ===
                'Draft dari tugas terhapus.' &&
                (await page.locator('[data-test="task-edit-form"]').count()) ===
                    0,
            'Tugas terhapus tidak memindahkan draft ke tugas lain.',
        );
        page.once('dialog', (d) => d.accept());
        await page.locator('[data-test="task-row-91012"]').click();
        verify(
            (await page.locator('#task-edit-title').inputValue()) ===
                tasks[0].title,
            'Perpindahan dari tugas terhapus tetap eksplisit dan terkonfirmasi.',
        );
        reset();
        await load('?scope=mine');
        await page.locator('[data-test="workspace-new-task"]').click();
        await page
            .locator('#task-create-title')
            .fill('Pekerjaan baru. Data sintetis');
        await page
            .locator('#task-create-description')
            .fill('Hasil satu lembar.');
        await page.locator('[data-test="task-create-submit"]').click();
        await page.waitForURL('**/workspace?task=91099');
        await page.locator('#task-edit-title').waitFor();
        verify(
            (await page.locator('#task-edit-title').inputValue()) ===
                'Pekerjaan baru. Data sintetis',
            'Tugas baru dibuka walaupun belum assigned dan dibuat dari Tugas saya.',
        );
        await page.locator('#task-edit-due-at').fill('2030-10-10T15:30');
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('[data-test="workspace-action-success"]').waitFor();
        verify(
            mutations.at(-1).data.due_at === '2030-10-10T08:30:00.000Z',
            'Tenggat lokal perangkat dikirim sebagai UTC tanpa bergeser tujuh jam.',
        );
        reset();
        await load();
        await page
            .locator('[data-test="task-edit-title"]')
            .fill('Draft konflik HTTP.');
        failure = 409;
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('[data-test="workspace-action-error"]').waitFor();
        revision++;
        tasks[0].revision = rev();
        failure = null;
        await page.locator('[data-test="workspace-action-recovery"]').click();
        await page.locator('[data-test="task-draft-conflict"]').waitFor();
        verify(
            (await page.locator('#task-edit-title').inputValue()) ===
                'Draft konflik HTTP.' &&
                (await page
                    .locator('[data-test="task-edit-submit"]')
                    .isDisabled()),
            '409 menyimpan draft tetapi tidak menaikkan revisinya otomatis.',
        );
        reset();
        await load();
        failure = 500;
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('[data-test="workspace-action-error"]').waitFor();
        verify(
            (await page
                .locator('[data-test="task-edit-submit"]')
                .isDisabled()) &&
                (await page
                    .locator('[data-test="workspace-action-success"]')
                    .count()) === 0,
            'HTTP 500 tidak mengklaim perubahan berhasil atau aman untuk diulang.',
        );
        failure = null;
        reset();
        await load();
        await page
            .locator('#discussion-body')
            .fill('Catatan draft gagal validasi.');
        failure = 422;
        await page.locator('[data-test="discussion-submit"]').click();
        await page.locator('#discussion-body-error').waitFor();
        await page.waitForFunction(
            () => document.activeElement?.id === 'discussion-body',
        );
        verify(
            (await page.locator('#discussion-body').inputValue()) ===
                'Catatan draft gagal validasi.',
            '422 diskusi tidak menghapus draft atau menampilkan sukses palsu.',
        );
        failure = null;
        reset();
        await load();
        await page.locator('#discussion-body').fill('Catatan dengan bukti.');
        await page.locator('#discussion-file').setInputFiles(syntheticFile);
        failure = 'upload422';
        await page.locator('[data-test="discussion-submit"]').click();
        await page.locator('[data-test="discussion-upload-retry"]').waitFor();
        verify(
            messages.length === 1 &&
                (await page
                    .locator('[data-test="discussion-submit"]')
                    .isDisabled()),
            'Pesan yang berhasil tidak dikirim ulang saat lampiran gagal.',
        );
        failure = null;
        count = mutations.length;
        await page.locator('[data-test="discussion-upload-retry"]').click();
        await page
            .locator('[data-test="discussion-attachment-upload"]')
            .waitFor({ state: 'hidden' });
        verify(
            messages.length === 1 &&
                mutations.length === count + 1 &&
                mutations.at(-1).path.endsWith('/attachments'),
            'Retry lampiran hanya mengirim berkas, bukan pesan kedua.',
        );
        reset();
        await load();
        count = reads.length;
        await emit('task');
        await stable();
        const afterDelta = reads.length;
        await page.evaluate(() =>
            window.__emit('.workspace.task.changed', {
                resource: 'task',
                resource_id: 91011,
                institution_id: 99002,
                project_id: 91001,
                operation: 'task.updated',
                version: 'c'.repeat(64),
                occurred_at: '2029-10-10T09:00:00Z',
            }),
        );
        await page.waitForTimeout(100);
        verify(reads.length === afterDelta, 'Delta out-of-order diabaikan.');
        await page.evaluate(() =>
            window.__emit('.workspace.task.changed', {
                resource: 'task',
                resource_id: 91011,
                institution_id: 99002,
                project_id: 91001,
                operation: 'unsupported',
                version: 'c'.repeat(64),
                occurred_at: '2031-10-10T09:00:00Z',
            }),
        );
        await page.waitForTimeout(100);
        verify(
            reads.length === afterDelta,
            'Operasi delta yang tidak didukung diabaikan.',
        );
        verify(
            await page
                .locator('[data-test="task-row-91011"]')
                .evaluate(
                    (el) =>
                        getComputedStyle(el).transitionProperty === 'none' ||
                        getComputedStyle(el).transitionDuration === '0s',
                ),
            'Reduced motion meniadakan transisi nonesensial pada tugas.',
        );
        reset();
        await load();
        failure = 409;
        await page.locator('[data-test="task-delete"]').click();
        await page.locator('[data-test="task-delete-confirm"]').click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.locator('[data-test="workspace-action-error"]').waitFor();
        failure = null;
        await page.locator('[data-test="workspace-action-recovery"]').click();
        await stable();
        await page.locator('[data-test="task-delete"]').click();
        await page.locator('[data-test="task-delete-confirm"]').click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await stable();
        verify(
            !tasks.some((item) => item.id === 91011),
            'Konflik hapus keluar dari dialog dan memerlukan pemeriksaan serta konfirmasi baru.',
        );
        reset();
        await load();
        await page
            .locator('#workspace-evidence-file')
            .setInputFiles(syntheticFile);
        failure = 403;
        await page.locator('[data-test="evidence-submit"]').click();
        await page.locator('[data-test="workspace-access-denied"]').waitFor();
        verify(
            (await page
                .locator('[data-test="workspace-discussion"]')
                .count()) === 0,
            '403 saat unggah juga menyembunyikan diskusi dan tugas lama.',
        );
        failure = null;
        reset();
        await load();
        readFailure = 403;
        await page.locator('[data-test="evidence-refresh"]').click();
        await page.locator('[data-test="workspace-access-denied"]').waitFor();
        verify(
            (await page.locator('[data-test="workspace-root"]').count()) === 0,
            '403 endpoint daftar bukti menutup seluruh snapshot privat.',
        );
        readFailure = null;
        reset();
        await load();
        failure = 403;
        await page.locator('#task-edit-title').fill('Akses berubah.');
        await page.locator('[data-test="task-edit-submit"]').click();
        await page.locator('[data-test="workspace-access-denied"]').waitFor();
        verify(
            (await page.locator('[data-test="workspace-root"]').count()) ===
                0 && (await page.evaluate(() => window.__left >= 2)),
            '403 menyembunyikan data privat dan melepas kedua subscription.',
        );
        failure = null;
        reset();
        await load();
        readFailure = 403;
        await page.locator('[data-test="workspace-refresh"]').click();
        await page.locator('[data-test="workspace-access-denied"]').waitFor();
        verify(
            (await page.locator('[data-test="workspace-evidence"]').count()) ===
                0,
            '403 saat reconciliation tidak mempertahankan bukti privat lama.',
        );
        readFailure = null;
        verify(
            errors.length === 0,
            'Tidak ada error runtime JavaScript: ' + errors.join('; '),
        );
        verify(
            mutations.every((item) => item.path.includes('/workspace/')),
            'Semua mutasi fixture sintetis terintersepsi tanpa menulis database aplikasi.',
        );
        console.log('PASS ' + checks + ' browser checks.');
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
