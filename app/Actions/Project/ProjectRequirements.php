<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\ProjectVisibility;
use App\Enums\SkillProficiency;
use App\Enums\TeamMembershipStatus;
use App\Models\OpportunitySupportEvent;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Throwable;

final class ProjectRequirements
{
    /**
     * @return list<array{
     *     title: string,
     *     id?: int,
     *     accepts_beginners?: bool|null,
     *     selection_criteria?: string|null,
     *     description: string|null,
     *     capacity: int,
     *     skills: list<array{taxonomy_id: int, proficiency: SkillProficiency}>
     * }>
     */
    public function normalizeAndValidate(mixed $value, int $projectCapacity): array
    {
        $roles = $this->normalizeRoles($value, $projectCapacity);
        $this->verifyTaxonomies($roles);

        return $roles;
    }

    /**
     * @param  list<array{
     *     title: string,
     *     description: string|null,
     *     id?: int,
     *     accepts_beginners?: bool|null,
     *     selection_criteria?: string|null,
     *     capacity: int,
     *     skills: list<array{taxonomy_id: int, proficiency: SkillProficiency}>
     * }>  $roles
     */
    public function persist(Project $project, array $roles): void
    {
        $existing = $project->roles()->get();
        $retained = [];
        $resolved = [];
        foreach ($roles as $index => $roleData) {
            $role = isset($roleData['id'])
                ? $existing->firstWhere('id', $roleData['id'])
                : $existing->first(fn (ProjectRole $candidate): bool => mb_strtolower($candidate->title) === mb_strtolower($roleData['title']));
            if (isset($roleData['id']) && $role === null) {
                throw ValidationException::withMessages(["roles.{$index}.id" => 'Peran bukan milik proyek ini. Muat ulang data peran.']);
            }
            if ($role !== null && in_array($role->getKey(), $retained, true)) {
                throw ValidationException::withMessages(["roles.{$index}.id" => 'Peran yang sama tidak boleh dikirim dua kali.']);
            }
            if ($role !== null) {
                $occupied = TeamMembership::query()->whereBelongsTo($project)->where('project_role_id', $role->getKey())->where('status', TeamMembershipStatus::Active)->count();
                if ($roleData['capacity'] < $occupied) {
                    throw ValidationException::withMessages(["roles.{$index}.capacity" => 'Kapasitas peran tidak boleh lebih kecil dari anggota aktifnya.']);
                }
                $retained[] = $role->getKey();
            }
            $resolved[] = $role;
        }
        foreach ($existing as $role) {
            if (in_array($role->getKey(), $retained, true)) {
                continue;
            }
            $referenced = TeamMembership::query()->where('project_role_id', $role->getKey())->exists()
                || TeamInvitation::query()->where('project_role_id', $role->getKey())->exists()
                || TeamJoinRequest::query()->where('project_role_id', $role->getKey())->exists()
                || (Schema::hasTable((new OpportunitySupportEvent)->getTable())
                    && OpportunitySupportEvent::query()->where('project_role_id', $role->getKey())->exists());
            if ($referenced) {
                throw ValidationException::withMessages(['roles' => 'Peran yang sudah dirujuk tim, undangan, pengajuan atau riwayat bantuan tidak dapat dihapus. Ubah informasi peran tersebut.']);
            }
            $role->delete();
        }

        /** Pergantian nama sementara hanya dalam transaksi untuk mendukung pertukaran nama peran unik. */
        foreach ($resolved as $role) {
            if ($role !== null) {
                $role->forceFill(['title' => '__t04_'.bin2hex(random_bytes(12))])->save();
            }
        }

        foreach ($roles as $index => $roleData) {
            $role = $resolved[$index] ?? new ProjectRole;
            $role->forceFill([
                'project_id' => $project->getKey(),
                'title' => $roleData['title'],
                'description' => $roleData['description'],
                'capacity' => $roleData['capacity'],
                ...(array_key_exists('accepts_beginners', $roleData) ? ['accepts_beginners' => $roleData['accepts_beginners']] : []),
                ...(array_key_exists('selection_criteria', $roleData) ? ['selection_criteria' => $roleData['selection_criteria']] : []),
            ])->save();
            $role->skills()->delete();

            foreach ($roleData['skills'] as $skillData) {
                ProjectRoleSkill::query()->forceCreate([
                    'project_role_id' => $role->getKey(),
                    'skill_taxonomy_id' => $skillData['taxonomy_id'],
                    'proficiency' => $skillData['proficiency'],
                ]);
            }
        }
    }

    public function boundedInteger(
        mixed $value,
        string $field,
        int $minimum,
        int $maximum,
    ): int {
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

    public function futureDeadline(mixed $value): CarbonImmutable
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

    public function visibility(mixed $value): ProjectVisibility
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

    public function requiredText(mixed $value, string $field, int $maxLength): string
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

    public function nullableText(mixed $value, string $field, int $maxLength): ?string
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

    /**
     * @return list<array{
     *     title: string,
     *     description: string|null,
     *     id?: int,
     *     accepts_beginners?: bool|null,
     *     selection_criteria?: string|null,
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

            $normalized = [
                'title' => $title,
                'description' => $this->nullableText(
                    $role['description'] ?? null,
                    "roles.{$index}.description",
                    5000,
                ),
                'capacity' => $capacity,
                'skills' => $this->normalizeSkills($role['skills'] ?? [], $index),
            ];
            if (isset($role['id'])) {
                $normalized['id'] = $this->boundedInteger($role['id'], "roles.{$index}.id", 1, PHP_INT_MAX);
            }
            if (array_key_exists('accepts_beginners', $role)) {
                $normalized['accepts_beginners'] = $this->beginnerAcceptance($role['accepts_beginners'], "roles.{$index}.accepts_beginners");
            }
            if (array_key_exists('selection_criteria', $role)) {
                $normalized['selection_criteria'] = $this->nullableText($role['selection_criteria'], "roles.{$index}.selection_criteria", 2000);
            }
            $roles[] = $normalized;
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

    /**
     * @param  list<array{
     *     title: string,
     *     description: string|null,
     *     id?: int,
     *     accepts_beginners?: bool|null,
     *     selection_criteria?: string|null,
     *     capacity: int,
     *     skills: list<array{taxonomy_id: int, proficiency: SkillProficiency}>
     * }>  $roles
     */
    private function verifyTaxonomies(array $roles): void
    {
        $taxonomyIds = array_values(array_unique(array_merge(
            ...array_map(
                static fn (array $role): array => array_column($role['skills'], 'taxonomy_id'),
                $roles,
            ),
        )));
        $taxonomies = SkillTaxonomy::query()
            ->whereIn('id', $taxonomyIds)
            ->where('is_verified', true)
            ->where('category', '!=', 'interest')
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

    private function beginnerAcceptance(mixed $value, string $field): ?bool
    {
        if ($value === null) {
            return null;
        }
        if (! in_array($value, [true, false, 0, 1, '0', '1'], true)) {
            throw ValidationException::withMessages([$field => 'Pilih menerima pemula, membutuhkan pengalaman, atau belum dinyatakan.']);
        }

        return (bool) $value;
    }
}
