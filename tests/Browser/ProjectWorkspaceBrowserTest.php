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
