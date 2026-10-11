<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Models\AvailabilityWindow;
use App\Models\CollaborationEvent;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use App\Support\Matching\MatchingInput;
use App\Support\Matching\MatchingScorer;
use App\Support\Matching\MatchingSource;
use App\Support\Project\ProjectOpportunityCapacity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class GenerateRecommendation
{
    public function __construct(
        private readonly MatchingScorer $scorer,
        private readonly MatchingSource $source,
        private readonly MatchingAvailability $availability,
    ) {}

    /**
     * Calculate and persist one explainable recommendation.
     *
     * @param  list<array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>|null  $requiredAvailabilityWindows
     */
    public function execute(
        User $actor,
        StudentProfile $studentProfile,
        Project $project,
        MatchScoreVersion $version,
        ?array $requiredAvailabilityWindows = null,
    ): Recommendation {
        if (($version->parameters['policy'] ?? null) === MatchingAvailability::POLICY) {
            if ($requiredAvailabilityWindows !== null) {
                throw new InvalidArgumentException('Jadwal proyek tidak dapat diisi asumsi oleh pemanggil.');
            }

            return $this->executeOpportunity($actor, $studentProfile, $project, $version)
                ?? throw new InvalidArgumentException('Peluang tidak tersedia untuk rekomendasi.');
        }
        Gate::forUser($actor)->authorize('view', $studentProfile);
        Gate::forUser($actor)->authorize('view', $project);

        if (
            ! $version->exists
            || $version->isDirty([
                $version->getKeyName(),
                'version',
                'weights',
                'dimensions',
                'parameters',
            ])
        ) {
            throw new AuthorizationException('Versi matching harus tersimpan dan immutable sebelum digunakan.');
        }

        if ($studentProfile->institution_id !== $project->institution_id) {
            throw new AuthorizationException('Profile dan project harus berada pada institution yang sama.');
        }

        $profile = StudentProfile::query()
            ->with(['skills', 'interests', 'availabilityWindows'])
            ->whereKey($studentProfile->getKey())
            ->firstOrFail();
        $project = Project::query()
            ->with(['roles.skills.taxonomy'])
            ->whereKey($project->getKey())
            ->firstOrFail();

        if ($profile->institution_id !== $project->institution_id) {
            throw new AuthorizationException('Profile dan project harus berada pada institution yang sama.');
        }

        $input = $this->buildInput($profile, $project, $requiredAvailabilityWindows ?? []);
        $result = $this->scorer->score($input, $version->weights, $version->parameters);

        return DB::transaction(function () use ($actor, $input, $version, $result): Recommendation {
            $run = MatchRun::query()->create([
                'institution_id' => $input->institutionId,
                'actor_id' => $actor->getKey(),
                'project_id' => $input->projectId,
                'version_id' => $version->getKey(),
                'input_snapshot' => $input->toSnapshot(),
                'computed_at' => now(),
            ]);

            return Recommendation::query()->create([
                'match_run_id' => $run->getKey(),
                'institution_id' => $input->institutionId,
                'project_id' => $input->projectId,
                'candidate_id' => $input->candidateId,
                'component_scores' => $result->components,
                'total_score' => $result->totalScore,
                'reason_candidates' => $result->reasonCandidates,
                'expires_at' => null,
            ]);
        }, attempts: 3);
    }

    public function executeOpportunity(User $actor, StudentProfile $profile, Project $project, MatchScoreVersion $version, ?string $refreshRevision = null): ?Recommendation
    {
        if (! $this->availability->enabled() || ! $this->availability->candidateAllowed($profile->institution_id, $actor->getKey())
            || $actor->getKey() !== $profile->user_id || $profile->institution_id !== $project->institution_id
            || ! $version->exists || $version->isDirty() || ($version->parameters['policy'] ?? null) !== MatchingAvailability::POLICY) {
            throw new AuthorizationException('Konteks pencocokan tidak sesuai.');
        }

        return DB::transaction(function () use ($actor, $profile, $project, $version, $refreshRevision): ?Recommendation {
            $profile = StudentProfile::query()->whereKey($profile->getKey())->where('user_id', $actor->getKey())
                ->where('institution_id', $project->institution_id)->lockForUpdate()->firstOrFail();
            $project = Project::query()->whereKey($project->getKey())->where('institution_id', $profile->institution_id)->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize('view', $profile);
            if (Gate::forUser($actor)->denies('view', $project)) {
                return null;
            }
            $this->source->loadProfile($profile);
            $this->source->loadProject($project);
            if (! $this->source->eligible($project, $actor->getKey()) || $profile->skills->isEmpty() || $profile->availabilityWindows->isEmpty()) {
                return null;
            }
            $best = null;
            $selectedRole = null;
            $selectedInput = null;
            foreach ($project->roles->sortBy('id') as $role) {
                if (! ProjectOpportunityCapacity::role($role, $project)['accepting']) {
                    continue;
                }
                $input = $this->source->input($profile, $project, $role);
                $result = $this->scorer->score($input, $version->weights, $version->parameters);
                if ($best === null || $result->totalScore > $best->totalScore) {
                    $best = $result;
                    $selectedRole = $role;
                    $selectedInput = $input;
                }
            }
            if ($best === null || $selectedRole === null || $selectedInput === null) {
                return null;
            }
            $run = MatchRun::query()->create([
                'institution_id' => $project->institution_id, 'actor_id' => $actor->getKey(),
                'project_id' => $project->getKey(), 'version_id' => $version->getKey(), 'computed_at' => now(),
                'input_snapshot' => [...$selectedInput->toSnapshot(),
                    'schema_version' => 'matching-input-v2', 'policy' => MatchingAvailability::POLICY,
                    'refresh_revision' => $refreshRevision, 'source_digest' => $this->source->digest($profile, $project),
                    'selected_role' => ['id' => $selectedRole->getKey(), 'title' => $selectedRole->title, 'accepts_beginners' => $selectedRole->accepts_beginners],
                    'limitations' => ['Keahlian berasal dari pernyataan mahasiswa, bukan penilaian bukti.', 'Kebutuhan waktu proyek belum tersedia. Jadwal perlu disepakati dengan tim.', 'Hasil pencocokan tidak menjamin penerimaan.'],
                ],
            ]);

            return Recommendation::query()->create([
                'match_run_id' => $run->getKey(), 'institution_id' => $project->institution_id,
                'project_id' => $project->getKey(), 'candidate_id' => $actor->getKey(),
                'component_scores' => $best->components, 'total_score' => $best->totalScore,
                'reason_candidates' => $best->reasonCandidates,
                'expires_at' => now()->addMinutes((int) config('matching.ttl_minutes', 360))->min($project->deadline),
            ]);
        }, attempts: 3);
    }

    /**
     * @param  list<array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>  $requiredAvailabilityWindows
     */
    private function buildInput(
        StudentProfile $studentProfile,
        Project $project,
        array $requiredAvailabilityWindows,
    ): MatchingInput {
        $profileSkills = array_values($studentProfile->skills
            ->map(static fn (ProfileSkill $skill): array => [
                'taxonomy_id' => $skill->skill_taxonomy_id,
                'proficiency' => $skill->proficiency->rank(),
            ])
            ->all());

        $projectRequirements = [];

        foreach ($project->roles as $role) {
            foreach ($role->skills as $skill) {
                $projectRequirements[] = [
                    'role_id' => $role->getKey(),
                    'role_title' => $role->title,
                    'role_capacity' => $role->capacity,
                    'taxonomy_id' => $skill->skill_taxonomy_id,
                    'skill_name' => $skill->taxonomy->name,
                    'required_proficiency' => $skill->proficiency->rank(),
                ];
            }
        }

        $collaborationEvents = CollaborationEvent::query()
            ->forInstitution($project->institution_id);
        $collaborationEventCount = (clone $collaborationEvents)->count();
        $priorConnectionCount = (clone $collaborationEvents)
            ->where(function (Builder $query) use ($studentProfile, $project): void {
                $query
                    ->where(function (Builder $pair) use ($studentProfile, $project): void {
                        $pair
                            ->where('actor_id', $studentProfile->user_id)
                            ->where('target_id', $project->owner_id);
                    })
                    ->orWhere(function (Builder $pair) use ($studentProfile, $project): void {
                        $pair
                            ->where('actor_id', $project->owner_id)
                            ->where('target_id', $studentProfile->user_id);
                    });
            })
            ->count();

        return new MatchingInput(
            institutionId: $project->institution_id,
            candidateId: $studentProfile->user_id,
            projectId: $project->getKey(),
            projectOwnerId: $project->owner_id,
            profileSkills: $profileSkills,
            profileInterests: array_values($studentProfile->interests
                ->pluck('skill_taxonomy_id')
                ->map(static fn (mixed $id): int => (int) $id)
                ->all()),
            projectRequirements: $projectRequirements,
            availabilityWindows: array_values($studentProfile->availabilityWindows
                ->map(static fn (AvailabilityWindow $window): array => [
                    'day_of_week' => $window->day_of_week,
                    'starts_at' => $window->starts_at,
                    'ends_at' => $window->ends_at,
                    'timezone' => $window->timezone,
                ])
                ->all()),
            requiredAvailabilityWindows: $requiredAvailabilityWindows,
            priorConnectionCount: $priorConnectionCount,
            collaborationEventCount: $collaborationEventCount,
        );
    }
}
