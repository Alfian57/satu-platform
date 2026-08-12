<?php

use App\Enums\MatchingDimension;
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
use App\Models\TeamJoinRequest;
use App\Models\User;

/**
 * @return array{candidate: User, owner: User, institution: Institution, project: Project}
 */
function projectToTeamQualityGateBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Quality Gate',
    ]);
    $candidate = projectToTeamQualityGateBrowserStudent(
        $institution,
        'Quality Gate Browser Candidate',
    );
    $owner = projectToTeamQualityGateBrowserStudent(
        $institution,
        'Quality Gate Browser Owner',
    );
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
            'capacity' => 2,
        ]);
    $role = ProjectRole::factory()
        ->for($project)
        ->create([
            'title' => 'Backend engineer',
            'capacity' => 1,
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
    Recommendation::factory()
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

    return compact('candidate', 'owner', 'institution', 'project');
}

function projectToTeamQualityGateBrowserStudent(Institution $institution, string $name): User
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

test('student can move from a safe recommendation to an active team', function () {
    $context = projectToTeamQualityGateBrowserContext();
    $this->actingAs($context['candidate']);

    $candidatePage = visit(route('dashboard'))
        ->resize(390, 844)
        ->assertSee('Project quality gate discovery')
        ->assertSee('Kebutuhan project cocok dengan profilmu.')
        ->assertDontSee('Internal connectivity detail.')
        ->assertScript(
            'document.querySelector(\'[data-test="dashboard-recommendation-reasons"]\')?.getAttribute("aria-label") === "Alasan kecocokan project"',
            true,
        )
        ->click('Lihat detail project')
        ->waitForText('Bentuk team dengan keputusan yang dapat dipulihkan')
        ->assertSee('Backend engineer')
        ->assertScript(
            'document.querySelector("#team-request-message")?.getAttribute("aria-describedby") === "team-request-message-hint"',
            true,
        )
        ->fill(
            '#team-request-message',
            'Saya siap membantu menyusun API dan dokumentasi teknis.',
        )
        ->click('@submit-team-join-request')
        ->waitForText('Join request terkirim')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p31-project-team-quality-gate-student-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    $request = TeamJoinRequest::query()
        ->whereBelongsTo($context['project'])
        ->whereBelongsTo($context['candidate'], 'requester')
        ->sole();

    $this->actingAs($context['owner']);

    visit(route('projects.show', $context['project']))
        ->resize(1366, 900)
        ->assertSee('Permintaan yang perlu ditinjau')
        ->assertSee('Quality Gate Browser Candidate')
        ->click("@accept-join-request-{$request->id}")
        ->waitForText('Join request diterima')
        ->assertSee('Anggota yang sudah bergabung')
        ->assertSee('Quality Gate Browser Candidate')
        ->screenshot(true, 'p31-project-team-quality-gate-owner-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    $this->actingAs($context['candidate']);

    $candidatePage
        ->navigate(route('projects.show', $context['project']))
        ->waitForText('Kamu sudah bergabung')
        ->assertSee('Kamu sudah bergabung')
        ->assertSee('1/2 TERISI')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
