<?php

declare(strict_types=1);

namespace App\Support\Matching;

/**
 * Normalized, non-sensitive input used by the matching scorer.
 *
 * @phpstan-type ProfileSkillInput array{taxonomy_id: int, proficiency: int}
 * @phpstan-type ProjectRequirementInput array{role_id: int, role_title: string, role_capacity: int, taxonomy_id: int, skill_name: string, required_proficiency: int}
 * @phpstan-type AvailabilityWindowInput array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}
 */
final readonly class MatchingInput
{
    /** @var list<ProfileSkillInput> */
    public array $profileSkills;

    /** @var list<int> */
    public array $profileInterests;

    /** @var list<ProjectRequirementInput> */
    public array $projectRequirements;

    /** @var list<AvailabilityWindowInput> */
    public array $availabilityWindows;

    /** @var list<AvailabilityWindowInput> */
    public array $requiredAvailabilityWindows;

    /**
     * @param  list<ProfileSkillInput>  $profileSkills
     * @param  list<int>  $profileInterests
     * @param  list<ProjectRequirementInput>  $projectRequirements
     * @param  list<AvailabilityWindowInput>  $availabilityWindows
     * @param  list<AvailabilityWindowInput>  $requiredAvailabilityWindows
     */
    public function __construct(
        public int $institutionId,
        public int $candidateId,
        public int $projectId,
        public int $projectOwnerId,
        array $profileSkills,
        array $profileInterests,
        array $projectRequirements,
        array $availabilityWindows,
        array $requiredAvailabilityWindows,
        public int $priorConnectionCount,
        public int $collaborationEventCount,
    ) {
        $this->profileSkills = $this->normalizeProfileSkills($profileSkills);
        $this->profileInterests = $this->normalizeIds($profileInterests);
        $this->projectRequirements = $this->normalizeProjectRequirements($projectRequirements);
        $this->availabilityWindows = $this->normalizeAvailabilityWindows($availabilityWindows);
        $this->requiredAvailabilityWindows = $this->normalizeAvailabilityWindows($requiredAvailabilityWindows);
    }

    /**
     * Return the minimum normalized snapshot needed to reproduce a score.
     *
     * @return array<string, mixed>
     */
    public function toSnapshot(): array
    {
        return [
            'schema_version' => 'matching-input-v1',
            'institution_id' => $this->institutionId,
            'candidate_id' => $this->candidateId,
            'project_id' => $this->projectId,
            'project_owner_id' => $this->projectOwnerId,
            'profile_skills' => $this->profileSkills,
            'profile_interests' => $this->profileInterests,
            'project_requirements' => $this->projectRequirements,
            'availability_windows' => $this->availabilityWindows,
            'required_availability_windows' => $this->requiredAvailabilityWindows,
            'prior_connection_count' => $this->priorConnectionCount,
            'collaboration_event_count' => $this->collaborationEventCount,
        ];
    }

    /**
     * @param  list<ProfileSkillInput>  $skills
     * @return list<ProfileSkillInput>
     */
    private function normalizeProfileSkills(array $skills): array
    {
        $normalized = array_map(
            static fn (array $skill): array => [
                'taxonomy_id' => (int) $skill['taxonomy_id'],
                'proficiency' => (int) $skill['proficiency'],
            ],
            $skills,
        );

        usort($normalized, static function (array $left, array $right): int {
            return [$left['taxonomy_id'], $left['proficiency']]
                <=> [$right['taxonomy_id'], $right['proficiency']];
        });

        return $normalized;
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function normalizeIds(array $ids): array
    {
        $normalized = array_values(array_unique(array_map(
            static fn (mixed $id): int => (int) $id,
            $ids,
        )));
        sort($normalized);

        return $normalized;
    }

    /**
     * @param  list<ProjectRequirementInput>  $requirements
     * @return list<ProjectRequirementInput>
     */
    private function normalizeProjectRequirements(array $requirements): array
    {
        $normalized = array_map(
            static fn (array $requirement): array => [
                'role_id' => (int) $requirement['role_id'],
                'role_title' => (string) $requirement['role_title'],
                'role_capacity' => max(1, (int) $requirement['role_capacity']),
                'taxonomy_id' => (int) $requirement['taxonomy_id'],
                'skill_name' => (string) $requirement['skill_name'],
                'required_proficiency' => max(1, (int) $requirement['required_proficiency']),
            ],
            $requirements,
        );

        usort($normalized, static function (array $left, array $right): int {
            return [
                $left['role_id'],
                $left['taxonomy_id'],
                $left['required_proficiency'],
            ] <=> [
                $right['role_id'],
                $right['taxonomy_id'],
                $right['required_proficiency'],
            ];
        });

        return $normalized;
    }

    /**
     * @param  list<AvailabilityWindowInput>  $windows
     * @return list<AvailabilityWindowInput>
     */
    private function normalizeAvailabilityWindows(array $windows): array
    {
        $normalized = array_map(
            static fn (array $window): array => [
                'day_of_week' => (int) $window['day_of_week'],
                'starts_at' => (string) $window['starts_at'],
                'ends_at' => (string) $window['ends_at'],
                'timezone' => (string) $window['timezone'],
            ],
            $windows,
        );

        usort($normalized, static function (array $left, array $right): int {
            return [
                $left['day_of_week'],
                $left['timezone'],
                $left['starts_at'],
                $left['ends_at'],
            ] <=> [
                $right['day_of_week'],
                $right['timezone'],
                $right['starts_at'],
                $right['ends_at'],
            ];
        });

        return $normalized;
    }
}
