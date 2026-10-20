<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Enums\TeamMembershipStatus;
use App\Models\AvailabilityWindow;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\StudentProfile;
use App\Support\Project\ProjectOpportunityCapacity;

final class MatchingSource
{
    public function loadProfile(StudentProfile $profile): StudentProfile
    {
        return $profile->loadMissing(['skills:id,student_profile_id,skill_taxonomy_id,proficiency', 'interests:id,student_profile_id,skill_taxonomy_id', 'availabilityWindows:id,student_profile_id,day_of_week,starts_at,ends_at,timezone']);
    }

    public function loadProject(Project $project): Project
    {
        $project->loadMissing(['roles.skills.taxonomy', 'teamMemberships:id,project_id,user_id,project_role_id,status']);
        if (! array_key_exists('occupied_count', $project->getAttributes())) {
            $project->loadCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeMembers(...)]);
        }
        if ($project->roles->contains(fn (ProjectRole $role): bool => ! array_key_exists('occupied_count', $role->getAttributes()))) {
            $project->roles->loadCount(['teamMemberships as occupied_count' => fn ($memberships) => $memberships->where('status', TeamMembershipStatus::Active)->whereColumn('team_memberships.project_id', 'project_roles.project_id')]);
        }

        return $project;
    }

    public function eligible(Project $project, int $candidateId): bool
    {
        return $project->owner_id !== $candidateId
            && in_array($project->visibility->value, ['institution', 'public'], true)
            && ProjectOpportunityCapacity::project($project)['accepting']
            && ! $project->teamMemberships->contains(fn ($membership): bool => $membership->user_id === $candidateId && $membership->status === TeamMembershipStatus::Active);
    }

    public function input(StudentProfile $profile, Project $project, ProjectRole $role): MatchingInput
    {
        return new MatchingInput(
            institutionId: $project->institution_id,
            candidateId: $profile->user_id,
            projectId: $project->getKey(),
            projectOwnerId: $project->owner_id,
            profileSkills: array_values($profile->skills->map(fn (ProfileSkill $skill): array => ['taxonomy_id' => $skill->skill_taxonomy_id, 'proficiency' => $skill->proficiency->rank()])->all()),
            profileInterests: array_values($profile->interests->pluck('skill_taxonomy_id')->map(fn (mixed $id): int => (int) $id)->all()),
            projectRequirements: array_values($role->skills->map(fn (ProjectRoleSkill $skill): array => [
                'role_id' => $role->id, 'role_title' => $role->title,
                'role_capacity' => ProjectOpportunityCapacity::role($role, $project)['remaining'],
                'taxonomy_id' => $skill->skill_taxonomy_id, 'skill_name' => $skill->taxonomy->name,
                'required_proficiency' => $skill->proficiency->rank(),
            ])->all()),
            availabilityWindows: array_values($profile->availabilityWindows->map(fn (AvailabilityWindow $window): array => [
                'day_of_week' => $window->day_of_week, 'starts_at' => $window->starts_at,
                'ends_at' => $window->ends_at, 'timezone' => $window->timezone,
            ])->all()),
            requiredAvailabilityWindows: [],
            priorConnectionCount: 0,
            collaborationEventCount: 0,
        );
    }

    public function digest(StudentProfile $profile, Project $project): string
    {
        $roles = $project->roles->sortBy('id')->map(fn (ProjectRole $role): array => [
            'id' => $role->getKey(), 'title' => $role->title, 'description' => $role->description,
            'criteria' => $role->selection_criteria, 'beginners' => $role->accepts_beginners,
            'capacity' => ProjectOpportunityCapacity::role($role, $project),
            'skills' => $role->skills->sortBy('skill_taxonomy_id')->map(fn (ProjectRoleSkill $skill): array => [$skill->skill_taxonomy_id, $skill->proficiency->value, $skill->taxonomy->name])->values()->all(),
        ])->values()->all();
        $baseRole = $project->roles->first();
        $profileInput = $baseRole === null ? null : $this->input($profile, $project, $baseRole)->toSnapshot();

        return hash('sha256', json_encode([
            'policy' => MatchingAvailability::POLICY,
            'profile' => $profileInput === null ? null : array_intersect_key($profileInput, array_flip(['institution_id', 'candidate_id', 'profile_skills', 'profile_interests', 'availability_windows'])),
            'project' => [$project->getKey(), $project->institution_id, $project->owner_id, $project->title, $project->description, $project->status->value, $project->visibility->value, $project->deadline->toIso8601String(), ProjectOpportunityCapacity::project($project)],
            'roles' => $roles,
            'participant' => $project->teamMemberships->contains(fn ($membership): bool => $membership->user_id === $profile->user_id && $membership->status === TeamMembershipStatus::Active),
        ], JSON_THROW_ON_ERROR));
    }
}
