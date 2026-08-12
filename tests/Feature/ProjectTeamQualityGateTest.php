<?php

declare(strict_types=1);

use App\Actions\Team\AcceptTeamJoinRequest;
use App\Enums\MatchingDimension;
use App\Enums\ProjectStatus;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipStatus;
use App\Models\AvailabilityWindow;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Recommendation;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array{candidate: User, owner: User, institution: Institution, project: Project, recommendation: Recommendation}
 */
function projectTeamQualityGateContext(): array
{
    $institution = Institution::factory()->active()->create();
    $candidate = projectTeamQualityGateVerifiedStudent($institution, 'Quality Gate Candidate');
    $owner = projectTeamQualityGateVerifiedStudent($institution, 'Quality Gate Owner');
    $profile = StudentProfile::factory()
        ->for($candidate)
        ->for($institution)
        ->create();
    $skill = SkillTaxonomy::factory()->create([
        'name' => 'Quality gate engineering',
    ]);

    ProfileSkill::factory()
        ->for($profile, 'studentProfile')
        ->for($skill, 'taxonomy')
        ->create(['proficiency' => 'advanced']);
    AvailabilityWindow::factory()
        ->for($profile, 'studentProfile')
        ->create();

    $version = MatchScoreVersion::factory()
        ->version('1.0.0')
        ->create(['activated_at' => now()]);
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project quality gate discovery',
            'capacity' => 50,
        ]);
    $role = ProjectRole::factory()
        ->for($project)
        ->create([
            'title' => 'Backend engineer',
            'capacity' => 50,
        ]);
    $run = MatchRun::factory()
        ->for($institution)
        ->for($candidate, 'actor')
        ->for($project)
        ->for($version, 'version')
        ->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $candidate->getKey(),
            'project_id' => $project->getKey(),
            'version_id' => $version->getKey(),
        ]);
    $recommendation = Recommendation::factory()
        ->for($run, 'matchRun')
        ->for($institution)
        ->for($project)
        ->for($candidate, 'candidate')
        ->create([
            'match_run_id' => $run->getKey(),
            'institution_id' => $institution->getKey(),
            'project_id' => $project->getKey(),
            'candidate_id' => $candidate->getKey(),
            'component_scores' => [
                MatchingDimension::SkillFit->value => 0.8,
                MatchingDimension::ProjectNeed->value => 0.9,
                MatchingDimension::Availability->value => 0.7,
                MatchingDimension::ConnectivityOpportunity->value => 0.95,
            ],
            'reason_candidates' => [
                [
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => 0.9,
                    'type' => 'positive',
                    'reason' => 'Kebutuhan project cocok dengan profilmu.',
                ],
                [
                    'dimension' => MatchingDimension::SkillFit->value,
                    'score' => 0.8,
                    'type' => 'positive',
                    'reason' => 'Skill engineering dibutuhkan team.',
                ],
                [
                    'dimension' => MatchingDimension::Availability->value,
                    'score' => 0.7,
                    'type' => 'positive',
                    'reason' => 'Ketersediaanmu sesuai kebutuhan project.',
                ],
                [
                    'dimension' => MatchingDimension::ConnectivityOpportunity->value,
                    'score' => 0.95,
                    'type' => 'positive',
                    'reason' => 'Internal connectivity detail.',
                ],
            ],
        ]);

    return compact('candidate', 'owner', 'institution', 'project', 'recommendation');
}

function projectTeamQualityGateVerifiedStudent(Institution $institution, string $name): User
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

function populateProjectTeamQualityGateQueue(
    Project $project,
    Institution $institution,
    User $owner,
    int $count,
): void {
    $role = $project->roles()->firstOrFail();

    for ($index = 1; $index <= $count; $index++) {
        $requester = projectTeamQualityGateVerifiedStudent(
            $institution,
            "Quality Gate Requester {$index}",
        );
        TeamJoinRequest::factory()
            ->for($project)
            ->for($requester, 'requester')
            ->forRole($role)
            ->create();

        $invitee = projectTeamQualityGateVerifiedStudent(
            $institution,
            "Quality Gate Invitee {$index}",
        );
        TeamInvitation::factory()
            ->for($project)
            ->for($owner, 'inviter')
            ->for($invitee, 'invitee')
            ->forRole($role)
            ->create();

        $member = projectTeamQualityGateVerifiedStudent(
            $institution,
            "Quality Gate Member {$index}",
        );
        TeamMembership::factory()
            ->active()
            ->for($project)
            ->for($member)
            ->forRole($role)
            ->create();
    }
}

test('project to team quality gate keeps matching explanations safe and versioned', function () {
    $context = projectTeamQualityGateContext();

    $this->withoutVite()
        ->actingAs($context['candidate'])
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('nextAction.category', 'Recommendation project')
            ->where('nextAction.primaryAction.projectId', $context['project']->getKey())
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('recommendations.state', 'ready')
                ->where('recommendations.recommendation.id', $context['recommendation']->getKey())
                ->where('recommendations.recommendation.scoreVersion', '1.0.0')
                ->has('recommendations.recommendation.reasons', 3)
                ->where(
                    'recommendations.recommendation.reasons.0',
                    'Kebutuhan project cocok dengan profilmu.',
                )
                ->where(
                    'recommendations.recommendation.reasons.1',
                    'Skill engineering dibutuhkan team.',
                )
                ->where(
                    'recommendations.recommendation.reasons.2',
                    'Ketersediaanmu sesuai kebutuhan project.',
                )
                ->missing('recommendations.recommendation.connectivityOpportunity'),
            ),
        );
});

test('project detail query count stays bounded as team queues grow', function () {
    $context = projectTeamQualityGateContext();
    populateProjectTeamQualityGateQueue(
        $context['project'],
        $context['institution'],
        $context['owner'],
        1,
    );

    $queryCount = 0;
    $tableQueries = [
        'team_join_requests' => 0,
        'team_invitations' => 0,
        'team_memberships' => 0,
    ];
    DB::listen(function (QueryExecuted $query) use (&$queryCount, &$tableQueries): void {
        $queryCount++;
        $sql = strtolower($query->sql);

        foreach (array_keys($tableQueries) as $table) {
            if (str_contains($sql, $table)) {
                $tableQueries[$table]++;
            }
        }
    });

    $this->withoutVite()
        ->actingAs($context['owner'])
        ->get(route('projects.show', $context['project']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('team.join_requests', 1)
            ->has('team.sent_invitations', 1)
            ->has('team.active_members', 1)
        );

    $baselineQueryCount = $queryCount;
    $baselineTableQueries = $tableQueries;

    populateProjectTeamQualityGateQueue(
        $context['project'],
        $context['institution'],
        $context['owner'],
        5,
    );
    $queryCount = 0;
    $tableQueries = array_fill_keys(array_keys($tableQueries), 0);

    $this->withoutVite()
        ->actingAs($context['owner'])
        ->get(route('projects.show', $context['project']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('team.join_requests', 6)
            ->has('team.sent_invitations', 6)
            ->has('team.active_members', 6)
        );

    expect($queryCount)->toBe($baselineQueryCount)
        ->and($tableQueries)->toBe($baselineTableQueries);
});

test('competing join requests cannot exceed the final team capacity', function () {
    Notification::fake();
    $institution = Institution::factory()->active()->create();
    $owner = projectTeamQualityGateVerifiedStudent($institution, 'Capacity Gate Owner');
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['capacity' => 1]);
    $firstRequester = projectTeamQualityGateVerifiedStudent($institution, 'First Capacity Requester');
    $secondRequester = projectTeamQualityGateVerifiedStudent($institution, 'Second Capacity Requester');
    $firstRequest = TeamJoinRequest::factory()
        ->for($project)
        ->for($firstRequester, 'requester')
        ->create();
    $secondRequest = TeamJoinRequest::factory()
        ->for($project)
        ->for($secondRequester, 'requester')
        ->create();

    $accepted = app(AcceptTeamJoinRequest::class)->handle($owner, $firstRequest);

    expect($accepted->status)->toBe(TeamJoinRequestStatus::Accepted)
        ->and(fn () => app(AcceptTeamJoinRequest::class)->handle($owner, $secondRequest))
        ->toThrow(ValidationException::class);

    expect(TeamMembership::query()
        ->whereBelongsTo($project)
        ->where('status', TeamMembershipStatus::Active)
        ->count())->toBe(1)
        ->and($project->fresh()->status)->toBe(ProjectStatus::Full)
        ->and($secondRequest->fresh()->status)->toBe(TeamJoinRequestStatus::Pending);
});

test('foreign students cannot enter the project to team flow', function () {
    $context = projectTeamQualityGateContext();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignStudent = projectTeamQualityGateVerifiedStudent($foreignInstitution, 'Foreign Quality Gate Student');

    $this->actingAs($foreignStudent)
        ->get(route('projects.show', $context['project']))
        ->assertForbidden();

    expect(TeamJoinRequest::query()->count())->toBe(0);
});
