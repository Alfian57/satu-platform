<?php

use App\Actions\Team\AcceptTeamInvitation;
use App\Actions\Team\AcceptTeamJoinRequest;
use App\Actions\Team\InviteTeamMember;
use App\Actions\Team\LeaveTeam;
use App\Actions\Team\RemoveTeamMember;
use App\Actions\Team\RequestToJoinTeam;
use App\Actions\Team\RevokeTeamInvitation;
use App\Enums\ProjectStatus;
use App\Enums\TeamInvitationStatus;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipEventType;
use App\Enums\TeamMembershipStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use App\Notifications\TeamInvitationReceivedNotification;
use App\Notifications\TeamInvitationRespondedNotification;
use App\Notifications\TeamJoinRequestReceivedNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

/**
 * @return array{0: User, 1: Institution, 2: Project}
 */
function teamOwnerContext(int $capacity = 3): array
{
    $institution = Institution::factory()->active()->create();
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($owner, 'owner')
        ->for($institution)
        ->create(['capacity' => $capacity]);

    return [$owner, $institution, $project];
}

function verifiedTeamStudent(Institution $institution): User
{
    $student = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return $student;
}

test('team schema has explicit bounded transition tables and indexes', function () {
    expect(Schema::hasTable('team_memberships'))->toBeTrue()
        ->and(Schema::hasTable('team_membership_events'))->toBeTrue()
        ->and(Schema::hasTable('team_invitations'))->toBeTrue()
        ->and(Schema::hasTable('team_join_requests'))->toBeTrue()
        ->and(Schema::hasColumns('team_memberships', [
            'project_id',
            'user_id',
            'project_role_id',
            'status',
            'joined_at',
            'left_at',
            'removed_at',
            'removed_by_id',
            'removal_reason',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('team_invitations', [
            'project_id',
            'invitee_id',
            'status',
            'pending_key',
            'expires_at',
        ]))->toBeTrue();

    $migration = file_get_contents(database_path('migrations/2026_08_12_041305_create_team_transition_tables.php'));

    expect($migration)->toBeString()
        ->toContain("'team_memberships_project_user_unique'")
        ->toContain("'team_invitations_pending_unique'")
        ->toContain("'team_join_requests_pending_unique'")
        ->toContain("'team_membership_events_history_idx'");
});

test('owner invitation accepts atomically, synchronizes project capacity, audits, and notifies', function () {
    Notification::fake();
    [$owner, $institution, $project] = teamOwnerContext();
    $invitee = verifiedTeamStudent($institution);
    $role = ProjectRole::factory()->for($project)->create(['capacity' => 2]);

    $invitation = app(InviteTeamMember::class)->handle($owner, $project, $invitee, $role->getKey());

    expect($invitation->status)->toBe(TeamInvitationStatus::Pending);
    Notification::assertSentTo($invitee, TeamInvitationReceivedNotification::class);

    $accepted = app(AcceptTeamInvitation::class)->handle($invitee, $invitation);
    $membership = TeamMembership::query()->whereBelongsTo($project)->whereBelongsTo($invitee)->sole();

    expect($accepted->status)->toBe(TeamInvitationStatus::Accepted)
        ->and($membership->status)->toBe(TeamMembershipStatus::Active)
        ->and($membership->project_role_id)->toBe($role->getKey())
        ->and($project->fresh()->status)->toBe(ProjectStatus::Forming)
        ->and($membership->events()->sole()->event)->toBe(TeamMembershipEventType::Joined)
        ->and(AuditLog::query()->where('operation', 'team.invitation.created')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'team.invitation.accepted')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'team.membership.joined')->exists())->toBeTrue();
});

test('team command routes return a safe invitation transition payload', function () {
    Notification::fake();
    [$owner, $institution, $project] = teamOwnerContext();
    $invitee = verifiedTeamStudent($institution);

    $created = $this->actingAs($owner)->postJson(
        route('projects.invitations.store', $project),
        ['invitee_id' => $invitee->getKey()],
    );

    $created->assertCreated()
        ->assertJsonPath('data.status', TeamInvitationStatus::Pending->value)
        ->assertJsonPath('data.invitee_id', $invitee->getKey());

    $invitation = TeamInvitation::query()->latest('id')->firstOrFail();

    $this->actingAs($invitee)
        ->postJson(route('team.invitations.accept', $invitation))
        ->assertOk()
        ->assertJsonPath('data.status', TeamInvitationStatus::Accepted->value);
});

test('join request is deduplicated while pending and owner acceptance creates membership', function () {
    Notification::fake();
    [$owner, $institution, $project] = teamOwnerContext();
    $requester = verifiedTeamStudent($institution);

    $first = app(RequestToJoinTeam::class)->handle(
        requester: $requester,
        project: $project,
        message: 'Saya siap mengerjakan backend.',
    );

    expect($first->status)->toBe(TeamJoinRequestStatus::Pending);
    Notification::assertSentTo($owner, TeamJoinRequestReceivedNotification::class);

    expect(fn () => app(RequestToJoinTeam::class)->handle($requester, $project))
        ->toThrow(ValidationException::class);

    expect(TeamJoinRequest::query()->whereBelongsTo($project)->whereBelongsTo($requester, 'requester')->count())
        ->toBe(1);

    $accepted = app(AcceptTeamJoinRequest::class)->handle($owner, $first);

    expect($accepted->status)->toBe(TeamJoinRequestStatus::Accepted)
        ->and(TeamMembership::query()->whereBelongsTo($project)->whereBelongsTo($requester)->sole()->status)
        ->toBe(TeamMembershipStatus::Active);
});

test('expired invitation is transitioned to expired and cannot create membership', function () {
    [$owner, $institution, $project] = teamOwnerContext();
    $invitee = verifiedTeamStudent($institution);
    $invitation = TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($invitee, 'invitee')
        ->expired()
        ->create();

    expect(fn () => app(AcceptTeamInvitation::class)->handle($invitee, $invitation))
        ->toThrow(ValidationException::class);

    expect($invitation->fresh()->status)->toBe(TeamInvitationStatus::Expired)
        ->and(TeamMembership::query()->count())->toBe(0)
        ->and(AuditLog::query()->where('operation', 'team.invitation.expired')->exists())->toBeTrue();
});

test('capacity is enforced when two pending invitations race for the last slot', function () {
    [$owner, $institution, $project] = teamOwnerContext(capacity: 1);
    $first = verifiedTeamStudent($institution);
    $second = verifiedTeamStudent($institution);
    $firstInvitation = TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($first, 'invitee')
        ->create();
    $secondInvitation = TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($second, 'invitee')
        ->create();

    app(AcceptTeamInvitation::class)->handle($first, $firstInvitation);

    expect(fn () => app(AcceptTeamInvitation::class)->handle($second, $secondInvitation))
        ->toThrow(ValidationException::class);

    expect(TeamMembership::query()->whereBelongsTo($project)->where('status', TeamMembershipStatus::Active)->count())
        ->toBe(1)
        ->and($secondInvitation->fresh()->status)->toBe(TeamInvitationStatus::Pending);
});

test('invalid invitation transition is rejected by policy', function () {
    [$owner, $institution, $project] = teamOwnerContext();
    $invitee = verifiedTeamStudent($institution);
    $invitation = TeamInvitation::factory()
        ->accepted()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($invitee, 'invitee')
        ->create();

    expect(fn () => app(AcceptTeamInvitation::class)->handle($invitee, $invitation))
        ->toThrow(AuthorizationException::class);
});

test('owner can revoke a pending invitation and the invitee is notified', function () {
    Notification::fake();
    [$owner, $institution, $project] = teamOwnerContext();
    $invitee = verifiedTeamStudent($institution);
    $invitation = TeamInvitation::factory()
        ->for($project)
        ->for($owner, 'inviter')
        ->for($invitee, 'invitee')
        ->create();

    $revoked = app(RevokeTeamInvitation::class)->handle(
        $owner,
        $invitation,
        'Kebutuhan role berubah.',
    );

    expect($revoked->status)->toBe(TeamInvitationStatus::Revoked)
        ->and($revoked->response_reason)->toBe('Kebutuhan role berubah.')
        ->and(AuditLog::query()->where('operation', 'team.invitation.revoked')->exists())->toBeTrue();

    Notification::assertSentTo($invitee, TeamInvitationRespondedNotification::class);
});

test('removal requires a reason, records unambiguous history, and frees capacity', function () {
    [$owner, $institution, $project] = teamOwnerContext(capacity: 1);
    $member = verifiedTeamStudent($institution);
    $membership = TeamMembership::factory()->for($project)->for($member)->create();

    expect(fn () => app(RemoveTeamMember::class)->handle($owner, $membership, '   '))
        ->toThrow(ValidationException::class);

    $removed = app(RemoveTeamMember::class)->handle($owner, $membership, 'Kontribusi tidak lagi sesuai scope project.');

    expect($removed->status)->toBe(TeamMembershipStatus::Removed)
        ->and($removed->removal_reason)->toBe('Kontribusi tidak lagi sesuai scope project.')
        ->and($removed->removed_by_id)->toBe($owner->getKey())
        ->and($project->fresh()->status)->toBe(ProjectStatus::Open)
        ->and($membership->events()->latest('id')->sole()->event)->toBe(TeamMembershipEventType::Removed)
        ->and($membership->events()->latest('id')->sole()->reason)
        ->toBe('Kontribusi tidak lagi sesuai scope project.')
        ->and(AuditLog::query()->where('operation', 'team.membership.removed')->sole()->reason)
        ->toBe('Kontribusi tidak lagi sesuai scope project.');
});

test('member can leave and project reopens without allowing a foreign tenant', function () {
    [$owner, $institution, $project] = teamOwnerContext(capacity: 1);
    $member = verifiedTeamStudent($institution);
    $membership = TeamMembership::factory()->for($project)->for($member)->create();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignUser = verifiedTeamStudent($foreignInstitution);

    expect(fn () => app(LeaveTeam::class)->handle($foreignUser, $membership))
        ->toThrow(AuthorizationException::class);

    $left = app(LeaveTeam::class)->handle($member, $membership, 'Fokus kontribusi berubah.');

    expect($left->status)->toBe(TeamMembershipStatus::Left)
        ->and($project->fresh()->status)->toBe(ProjectStatus::Open)
        ->and($membership->events()->latest('id')->sole()->event)->toBe(TeamMembershipEventType::Left);
});

test('foreign student cannot receive a team invitation through the tenant boundary', function () {
    [$owner, $institution, $project] = teamOwnerContext();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = verifiedTeamStudent($foreignInstitution);

    expect(fn () => app(InviteTeamMember::class)->handle($owner, $project, $foreignStudent))
        ->toThrow(AuthorizationException::class);

    expect(TeamInvitation::query()->count())->toBe(0);
});
