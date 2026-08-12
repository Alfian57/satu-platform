<?php

use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;

/**
 * @return array{owner: User, member: User, institution: Institution, project: Project}
 */
function browserWorkspaceContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Workspace Browser',
    ]);
    $owner = User::factory()->create(['name' => 'Owner Workspace Browser']);
    $member = User::factory()->create(['name' => 'Member Workspace Browser']);

    foreach ([$owner, $member] as $student) {
        InstitutionMembership::factory()
            ->student()
            ->verifiedByApprovedDomain()
            ->for($student)
            ->for($institution)
            ->create();
    }

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Workspace browser project',
        ]);

    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    return compact('owner', 'member', 'institution', 'project');
}

test('team can operate the task workspace on desktop and mobile', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();
    Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task awal untuk workspace',
        ]);

    $this->actingAs($owner);

    visit(route('projects.workspace', $project))
        ->resize(1366, 900)
        ->assertSee('Workspace browser project')
        ->assertSee('Task awal untuk workspace')
        ->assertSee('Realtime')
        ->assertScript(
            "document.querySelector('[data-test=workspace-realtime-status]') !== null",
            true,
        )
        ->click('@task-status-in_progress')
        ->waitForText('Status task menjadi Sedang dikerjakan')
        ->assertSee('Sedang dikerjakan')
        ->screenshot(true, 'p33-task-workspace-desktop-1366x900')
        ->click('@workspace-new-task')
        ->fill('#task-create-title', 'Task baru dari workspace')
        ->fill('#task-create-description', 'Catatan singkat yang bisa ditindaklanjuti.')
        ->click('@task-create-submit')
        ->waitForText('Task baru berhasil ditambahkan')
        ->assertSee('Task baru dari workspace')
        ->resize(390, 844)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p33-task-workspace-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('workspace exposes a stable refresh skeleton and polite loading status', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();
    Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task untuk verifikasi loading workspace',
        ]);

    $this->actingAs($owner);

    $page = visit(route('projects.workspace', $project))
        ->resize(1366, 900)
        ->assertSee('Task untuk verifikasi loading workspace');

    $page->script(<<<JS
        (() => {
            const target = '/projects/{$project->getKey()}/workspace';
            let delayed = false;
            const originalFetch = window.fetch.bind(window);
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            window.fetch = (input, init) => {
                const url = typeof input === 'string' ? input : input?.url ?? '';

                if (!delayed && url.includes(target)) {
                    delayed = true;

                    return new Promise((resolve) => {
                        setTimeout(() => resolve(originalFetch(input, init)), 2000);
                    });
                }

                return originalFetch(input, init);
            };

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.__pestWorkspaceRequest = String(url).includes(target);

                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                if (!delayed && this.__pestWorkspaceRequest) {
                    delayed = true;

                    setTimeout(() => originalSend.apply(this, args), 2000);

                    return;
                }

                return originalSend.apply(this, args);
            };
        })();
        JS);

    $page->script("document.querySelector('[data-test=workspace-refresh]').click()");
    $page
        ->assertScript(
            "document.querySelector('[data-test=workspace-refresh-skeleton]')?.getAttribute('aria-busy') === 'true'",
            true,
        )
        ->assertScript(
            "document.querySelector('[data-test=workspace-refresh-status]')?.textContent.includes('Memuat snapshot workspace terbaru')",
            true,
        )
        ->screenshot(true, 'p41-workspace-refresh-loading-desktop-1366x900')
        ->waitForText('Snapshot workspace terbaru sudah dimuat dari database.')
        ->assertScript(
            "document.querySelector('[data-test=workspace-refresh-skeleton]') === null",
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('two browser clients converge on the database workspace snapshot', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();
    Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task yang dilihat dua client',
        ]);

    $this->actingAs($owner);

    [$primaryClient, $secondaryClient] = visit([
        route('projects.workspace', $project),
        route('projects.workspace', $project),
    ]);

    $primaryClient
        ->resize(1366, 900)
        ->assertSee('Task yang dilihat dua client')
        ->click('@task-status-in_progress')
        ->waitForText('Status task menjadi Sedang dikerjakan')
        ->assertSee('Sedang dikerjakan');

    $secondaryClient
        ->resize(1366, 900)
        ->assertSee('Task yang dilihat dua client')
        ->click('@workspace-refresh')
        ->waitForText('Snapshot workspace terbaru sudah dimuat dari database.')
        ->assertSee('Sedang dikerjakan')
        ->screenshot(true, 'p41-workspace-two-client-desktop-1366x900')
        ->resize(390, 844)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p41-workspace-two-client-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('empty workspace offers a keyboard reachable next action on mobile', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();

    $this->actingAs($owner);

    visit(route('projects.workspace', $project))
        ->resize(320, 800)
        ->assertSee('Belum ada task di workspace')
        ->click('@workspace-empty-create')
        ->fill('#task-create-title', 'Task pertama project')
        ->click('@task-create-submit')
        ->waitForText('Task baru berhasil ditambahkan')
        ->assertSee('Task pertama project')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p33-task-workspace-created-mobile-320x800')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('workspace reconciles changes missed while the browser is offline', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();
    Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task sebelum koneksi terputus',
        ]);

    $this->actingAs($owner);

    $page = visit(route('projects.workspace', $project))
        ->resize(1366, 900)
        ->assertSee('Task sebelum koneksi terputus')
        ->wait(0.3);
    $page->script("window.dispatchEvent(new Event('offline'))");
    $page
        ->waitForText('Koneksi offline, menunggu pemulihan')
        ->screenshot(true, 'p40-workspace-offline-desktop-1366x900');

    Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Task yang dibuat saat offline',
        ]);

    $page->script("window.dispatchEvent(new Event('online'))");
    $page
        ->waitForText('Koneksi kembali. Snapshot workspace terbaru sudah disinkronkan dari database.')
        ->screenshot(true, 'p40-workspace-reconnected-desktop-1366x900')
        ->assertSee('Task yang dibuat saat offline')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('workspace recovers a stale task edit from the latest database snapshot', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();
    $task = Task::factory()
        ->for($project)
        ->for($owner, 'createdBy')
        ->create([
            'title' => 'Judul task dari snapshot awal',
        ]);

    $this->actingAs($owner);

    $page = visit(route('projects.workspace', $project))
        ->assertSee('Judul task dari snapshot awal')
        ->fill('#task-edit-title', 'Draft lokal yang belum tersinkron');

    $task->forceFill([
        'title' => 'Judul task dari sesi lain',
        'updated_at' => now()->addMinute(),
    ])->save();

    $page
        ->click('@task-edit-submit')
        ->waitForText('Task berubah di sesi lain')
        ->assertSee('Muat data terbaru')
        ->resize(390, 844)
        ->screenshot(true, 'p40-workspace-stale-mobile-390x844')
        ->click('@workspace-action-recovery')
        ->waitForText('Data terbaru sudah dimuat dari database.')
        ->assertSee('Judul task dari sesi lain')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('team can add a discussion note from the workspace composer', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();

    $this->actingAs($owner);

    visit(route('projects.workspace', $project))
        ->resize(390, 844)
        ->assertSee('Diskusi dan evidence')
        ->fill('#discussion-body', 'Keputusan team: lanjutkan review evidence.')
        ->click('@discussion-submit')
        ->waitForText('Catatan berhasil ditambahkan ke diskusi.')
        ->assertSee('Keputusan team: lanjutkan review evidence.')
        ->assertSee('Catatan team')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('discussion timeline screenshots cover desktop and mobile evidence', function () {
    ['owner' => $owner, 'project' => $project] = browserWorkspaceContext();

    Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Desktop screenshot: keputusan team tercatat di ledger.',
        ]);
    Message::factory()
        ->for($project)
        ->for($owner, 'author')
        ->create([
            'body' => 'Mobile screenshot: next action tetap terbaca tanpa overflow.',
        ]);

    $this->actingAs($owner);

    $page = visit(route('projects.workspace', $project))
        ->resize(1366, 900)
        ->assertSee('Diskusi dan evidence')
        ->assertSee('keputusan team tercatat di ledger')
        ->screenshot(true, 'p36-discussion-desktop-1366x900');

    $page
        ->resize(390, 844)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p36-discussion-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
