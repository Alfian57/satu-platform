<?php

use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;

/**
 * @return array{0: User, 1: Institution}
 */
function teamFormationBrowserOwnerContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Team Browser',
    ]);
    $owner = User::factory()->create([
        'name' => 'Owner Team Browser',
    ]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    return [$owner, $institution];
}

function teamFormationBrowserStudent(Institution $institution, string $name): User
{
    $student = User::factory()->create(['name' => $name]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

test('student can send a join request from the responsive team formation surface', function () {
    [$owner, $institution] = teamFormationBrowserOwnerContext();
    $student = teamFormationBrowserStudent($institution, 'Student Team Browser');
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project join request browser',
            'capacity' => 2,
        ]);
    ProjectRole::factory()->for($project)->create([
        'title' => 'Frontend engineer',
        'capacity' => 1,
    ]);

    $this->actingAs($student);

    visit(route('projects.show', $project))
        ->resize(390, 844)
        ->assertSee('Ajukan diri ke project ini')
        ->fill('#team-request-message', 'Saya dapat membantu menyusun antarmuka dan dokumentasi.')
        ->click('@submit-team-join-request')
        ->waitForText('Join request terkirim')
        ->assertSee('Join request terkirim')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p30-team-formation-student-request-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('owner can review and accept a join request from the queue', function () {
    [$owner, $institution] = teamFormationBrowserOwnerContext();
    $student = teamFormationBrowserStudent($institution, 'Student Queue Browser');
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project request queue browser',
            'capacity' => 2,
        ]);
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Backend engineer',
        'capacity' => 1,
    ]);
    $request = TeamJoinRequest::factory()
        ->for($project)
        ->for($student, 'requester')
        ->forRole($role)
        ->create([
            'message' => 'Saya siap membantu API project.',
        ]);

    $this->actingAs($owner);

    visit(route('projects.show', $project))
        ->resize(1366, 900)
        ->assertSee('Permintaan yang perlu ditinjau')
        ->assertSee('Student Queue Browser')
        ->assertSee('Saya siap membantu API project.')
        ->click("@accept-join-request-{$request->id}")
        ->waitForText('Join request diterima')
        ->assertSee('Join request diterima')
        ->assertSee('Student Queue Browser')
        ->assertSee('Anggota yang sudah bergabung')
        ->screenshot(true, 'p30-team-formation-owner-queue-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('student can accept a pending invitation with an explicit capacity state', function () {
    [$owner, $institution] = teamFormationBrowserOwnerContext();
    $student = teamFormationBrowserStudent($institution, 'Student Invitation Browser');
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project invitation browser',
            'capacity' => 2,
        ]);
    $role = ProjectRole::factory()->for($project)->create([
        'title' => 'Product designer',
        'capacity' => 1,
    ]);
    $invitation = TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($student, 'invitee')
        ->forRole($role)
        ->create();

    $this->actingAs($student);

    visit(route('projects.show', $project))
        ->resize(320, 800)
        ->assertSee('Peluang bergabung ke team')
        ->assertSee('Owner Team Browser mengundangmu')
        ->assertSee('0/2 TERISI')
        ->click("@accept-invitation-{$invitation->id}")
        ->waitForText('Invitation diterima')
        ->assertSee('Invitation diterima')
        ->assertSee('Kamu sudah bergabung')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p30-team-formation-invitation-mobile-320x800')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('student sees a full team as read-only on mobile', function () {
    [$owner, $institution] = teamFormationBrowserOwnerContext();
    $member = teamFormationBrowserStudent($institution, 'Student Full Browser');
    $student = teamFormationBrowserStudent($institution, 'Student Waiting Browser');
    $project = Project::factory()
        ->full()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project full capacity browser',
            'capacity' => 1,
        ]);
    TeamMembership::factory()
        ->active()
        ->for($project)
        ->for($member)
        ->create();

    $this->actingAs($student);

    visit(route('projects.show', $project))
        ->resize(320, 800)
        ->assertSee('Kapasitas penuh untuk saat ini')
        ->assertSee('Tidak ada permintaan baru yang dapat diproses sampai slot tersedia kembali.')
        ->assertDontSee('Ajukan diri ke project ini')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p30-team-formation-full-mobile-320x800')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
