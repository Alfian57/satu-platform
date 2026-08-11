<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\ProjectVisibility;
use App\Enums\SkillProficiency;
use App\Models\Institution;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Throwable;

final class CreateProject
{
    /**
     * Create an institution-scoped project with its role and skill requirements.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Institution $institution, array $data): Project
    {
        Gate::forUser($actor)->authorize('create', [Project::class, $institution]);

        $projectCapacity = $this->boundedInteger(
            $data['capacity'] ?? 5,
            'capacity',
            1,
            20,
        );
        $deadline = $this->futureDeadline($data['deadline'] ?? null);
        $roles = $this->normalizeRoles($data['roles'] ?? null, $projectCapacity);
        $visibility = $this->visibility($data['visibility'] ?? ProjectVisibility::Institution);

        $taxonomyIds = array_values(array_unique(array_merge(
            ...array_map(
                static fn (array $role): array => array_column($role['skills'], 'taxonomy_id'),
                $roles,
            ),
        )));
        $taxonomies = SkillTaxonomy::query()
            ->whereIn('id', $taxonomyIds)
            ->where('is_verified', true)
            ->get()
            ->keyBy(fn (SkillTaxonomy $taxonomy): int => $taxonomy->getKey());

        foreach ($roles as $roleIndex => $role) {
            foreach ($role['skills'] as $skillIndex => $skill) {
                if (! $taxonomies->has($skill['taxonomy_id'])) {
                    throw ValidationException::withMessages([
                        "roles.{$roleIndex}.skills.{$skillIndex}.taxonomy_id" => 'Skill taxonomy tidak ditemukan atau belum terverifikasi.',
                    ]);
                }
            }
        }

        return DB::transaction(function () use (
            $actor,
            $institution,
            $data,
            $deadline,
            $projectCapacity,
            $roles,
            $visibility,
        ): Project {
            $project = Project::query()->forceCreate([
                'institution_id' => $institution->getKey(),
                'owner_id' => $actor->getKey(),
                'title' => $this->requiredText($data['title'] ?? null, 'title', 160),
                'description' => $this->nullableText($data['description'] ?? null, 'description', 5000),
                'visibility' => $visibility,
                'capacity' => $projectCapacity,
                'deadline' => $deadline,
            ]);

            foreach ($roles as $roleData) {
                $role = ProjectRole::query()->forceCreate([
                    'project_id' => $project->getKey(),
                    'title' => $roleData['title'],
                    'description' => $roleData['description'],
                    'capacity' => $roleData['capacity'],
                ]);

                foreach ($roleData['skills'] as $skillData) {
                    ProjectRoleSkill::query()->forceCreate([
                        'project_role_id' => $role->getKey(),
                        'skill_taxonomy_id' => $skillData['taxonomy_id'],
                        'proficiency' => $skillData['proficiency'],
                    ]);
                }
            }

            return $project->load(['roles.skills.taxonomy']);
        }, attempts: 3);
    }

    /**
     * @return list<array{
     *     title: string,
     *     description: string|null,
     *     capacity: int,
     *     skills: list<array{taxonomy_id: int, proficiency: SkillProficiency}>
     * }>
     */
    private function normalizeRoles(mixed $value, int $projectCapacity): array
    {
        if (! is_array($value) || ! array_is_list($value) || $value === []) {
            throw ValidationException::withMessages([
                'roles' => 'Project harus memiliki setidaknya satu role.',
            ]);
        }

        if (count($value) > 20) {
            throw ValidationException::withMessages([
                'roles' => 'Project tidak dapat memiliki lebih dari 20 role.',
            ]);
        }

        $roles = [];
        $roleTitles = [];
        $totalCapacity = 0;

        foreach ($value as $index => $role) {
            if (! is_array($role)) {
                throw ValidationException::withMessages([
                    "roles.{$index}" => 'Format role tidak valid.',
                ]);
            }

            $title = $this->requiredText($role['title'] ?? null, "roles.{$index}.title", 120);
            $normalizedTitle = mb_strtolower($title);

            if (in_array($normalizedTitle, $roleTitles, true)) {
                throw ValidationException::withMessages([
                    "roles.{$index}.title" => 'Nama role dalam satu project harus unik.',
                ]);
            }

            $roleTitles[] = $normalizedTitle;
            $capacity = $this->boundedInteger(
                $role['capacity'] ?? 1,
                "roles.{$index}.capacity",
                1,
                20,
            );
            $totalCapacity += $capacity;

            if ($totalCapacity > $projectCapacity) {
                throw ValidationException::withMessages([
                    "roles.{$index}.capacity" => 'Total kapasitas role tidak boleh melebihi kapasitas project.',
                ]);
            }

            $skills = $this->normalizeSkills($role['skills'] ?? [], $index);
            $roles[] = [
                'title' => $title,
                'description' => $this->nullableText(
                    $role['description'] ?? null,
                    "roles.{$index}.description",
                    5000,
                ),
                'capacity' => $capacity,
                'skills' => $skills,
            ];
        }

        return $roles;
    }

    /**
     * @return list<array{taxonomy_id: int, proficiency: SkillProficiency}>
     */
    private function normalizeSkills(mixed $value, int $roleIndex): array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            throw ValidationException::withMessages([
                "roles.{$roleIndex}.skills" => 'Format skill requirement tidak valid.',
            ]);
        }

        $skills = [];
        $taxonomyIds = [];

        foreach ($value as $index => $skill) {
            if (! is_array($skill)) {
                throw ValidationException::withMessages([
                    "roles.{$roleIndex}.skills.{$index}" => 'Format skill requirement tidak valid.',
                ]);
            }

            $taxonomyId = $this->boundedInteger(
                $skill['taxonomy_id'] ?? null,
                "roles.{$roleIndex}.skills.{$index}.taxonomy_id",
                1,
                PHP_INT_MAX,
            );

            if (in_array($taxonomyId, $taxonomyIds, true)) {
                throw ValidationException::withMessages([
                    "roles.{$roleIndex}.skills.{$index}.taxonomy_id" => 'Skill taxonomy dalam satu role harus unik.',
                ]);
            }

            $taxonomyIds[] = $taxonomyId;
            $skills[] = [
                'taxonomy_id' => $taxonomyId,
                'proficiency' => $this->proficiency(
                    $skill['proficiency'] ?? SkillProficiency::Intermediate,
                    "roles.{$roleIndex}.skills.{$index}.proficiency",
                ),
            ];
        }

        return $skills;
    }

    private function futureDeadline(mixed $value): CarbonImmutable
    {
        if ($value === null) {
            return CarbonImmutable::now()->addWeeks(4);
        }

        try {
            $deadline = $value instanceof CarbonInterface
                ? CarbonImmutable::instance($value)
                : CarbonImmutable::parse((string) $value);
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'deadline' => 'Deadline harus berupa tanggal dan waktu yang valid.',
            ]);
        }

        if (! $deadline->isFuture()) {
            throw ValidationException::withMessages([
                'deadline' => 'Deadline project harus berada di masa depan.',
            ]);
        }

        return $deadline;
    }

    private function visibility(mixed $value): ProjectVisibility
    {
        if ($value instanceof ProjectVisibility) {
            return $value;
        }

        $visibility = ProjectVisibility::tryFrom((string) $value);

        if ($visibility === null) {
            throw ValidationException::withMessages([
                'visibility' => 'Visibility project tidak valid.',
            ]);
        }

        return $visibility;
    }

    private function proficiency(mixed $value, string $field): SkillProficiency
    {
        if ($value instanceof SkillProficiency) {
            return $value;
        }

        $proficiency = SkillProficiency::tryFrom((string) $value);

        if ($proficiency === null) {
            throw ValidationException::withMessages([
                $field => 'Tingkat proficiency skill tidak valid.',
            ]);
        }

        return $proficiency;
    }

    private function requiredText(mixed $value, string $field, int $maxLength): string
    {
        if (! is_string($value)) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa teks.',
            ]);
        }

        $text = trim($value);

        if ($text === '' || mb_strlen($text) > $maxLength) {
            throw ValidationException::withMessages([
                $field => 'Teks wajib diisi dan tidak boleh melebihi batas karakter.',
            ]);
        }

        return $text;
    }

    private function nullableText(mixed $value, string $field, int $maxLength): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa teks.',
            ]);
        }

        $text = trim($value);

        if (mb_strlen($text) > $maxLength) {
            throw ValidationException::withMessages([
                $field => 'Teks melebihi batas karakter.',
            ]);
        }

        return $text === '' ? null : $text;
    }

    private function boundedInteger(mixed $value, string $field, int $minimum, int $maximum): int
    {
        $isInteger = is_int($value)
            || (is_string($value) && preg_match('/^\d+$/D', $value) === 1);

        if (! $isInteger) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa bilangan bulat.',
            ]);
        }

        $integer = (int) $value;

        if ($integer < $minimum || $integer > $maximum) {
            throw ValidationException::withMessages([
                $field => "Nilai harus berada di antara {$minimum} dan {$maximum}.",
            ]);
        }

        return $integer;
    }
}
