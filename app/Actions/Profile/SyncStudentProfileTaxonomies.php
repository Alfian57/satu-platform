<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Enums\SkillProficiency;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use Illuminate\Validation\ValidationException;

final class SyncStudentProfileTaxonomies
{
    /**
     * Replace the supplied skill and interest selections for a profile.
     *
     * A null argument leaves that taxonomy unchanged, while an empty array
     * intentionally clears the corresponding selection.
     *
     * @param  array<int, mixed>|null  $skills
     * @param  array<int, mixed>|null  $interests
     */
    public function handle(
        StudentProfile $profile,
        ?array $skills = null,
        ?array $interests = null,
    ): void {
        if ($skills !== null) {
            $this->syncSkills($profile, $skills);
        }

        if ($interests !== null) {
            $this->syncInterests($profile, $interests);
        }
    }

    /** @param  array<int, mixed>  $skills */
    private function syncSkills(StudentProfile $profile, array $skills): void
    {
        $rows = [];
        $ids = [];

        foreach ($skills as $index => $skill) {
            if (! is_array($skill)) {
                $this->invalid('skills.'.$index, 'Format skill tidak valid.');
            }

            $taxonomyId = $this->normalizeId($skill['taxonomy_id'] ?? null, 'skills.'.$index.'.taxonomy_id');
            $proficiency = SkillProficiency::tryFrom((string) ($skill['proficiency'] ?? ''));

            if ($proficiency === null) {
                $this->invalid('skills.'.$index.'.proficiency', 'Tingkat kemahiran tidak valid.');
            }

            $metadata = $skill['evidence_metadata'] ?? null;

            if ($metadata !== null && ! is_array($metadata)) {
                $this->invalid('skills.'.$index.'.evidence_metadata', 'Metadata evidence harus berupa object.');
            }

            $ids[] = $taxonomyId;
            $rows[$taxonomyId] = [
                'proficiency' => $proficiency->value,
                'evidence_metadata' => $metadata,
            ];
        }

        $this->assertVerifiedTaxonomies($ids, 'skills', requireInterest: false);

        $query = ProfileSkill::query()->whereBelongsTo($profile, 'studentProfile');

        if ($ids === []) {
            $query->delete();
        } else {
            $query->whereNotIn('skill_taxonomy_id', $ids)->delete();
        }

        foreach ($rows as $taxonomyId => $attributes) {
            $profileSkill = ProfileSkill::query()->firstOrNew([
                'student_profile_id' => $profile->getKey(),
                'skill_taxonomy_id' => $taxonomyId,
            ]);
            $profileSkill->forceFill([
                'student_profile_id' => $profile->getKey(),
                'skill_taxonomy_id' => $taxonomyId,
                ...$attributes,
            ])->save();
        }
    }

    /**
     * @param  array<int, int|string>  $interests
     */
    private function syncInterests(StudentProfile $profile, array $interests): void
    {
        $ids = array_map(
            fn (mixed $id): int => $this->normalizeId($id, 'interests'),
            $interests,
        );

        $this->assertVerifiedTaxonomies($ids, 'interests', requireInterest: true);

        $query = ProfileInterest::query()->whereBelongsTo($profile, 'studentProfile');

        if ($ids === []) {
            $query->delete();
        } else {
            $query->whereNotIn('skill_taxonomy_id', $ids)->delete();
        }

        foreach ($ids as $taxonomyId) {
            $profileInterest = ProfileInterest::query()->firstOrNew([
                'student_profile_id' => $profile->getKey(),
                'skill_taxonomy_id' => $taxonomyId,
            ]);
            $profileInterest->forceFill([
                'student_profile_id' => $profile->getKey(),
                'skill_taxonomy_id' => $taxonomyId,
            ]);
            $profileInterest->save();
        }
    }

    /**
     * @param  array<int, int>  $ids
     */
    private function assertVerifiedTaxonomies(array $ids, string $field, bool $requireInterest): void
    {
        if (count($ids) !== count(array_unique($ids))) {
            $this->invalid($field, 'Taxonomy tidak boleh duplikat.');
        }

        if ($ids === []) {
            return;
        }

        $query = SkillTaxonomy::query()
            ->whereIn('id', $ids)
            ->where('is_verified', true);

        if ($requireInterest) {
            $query->where('category', 'interest');
        } else {
            $query->where('category', '!=', 'interest');
        }

        if ($query->count() !== count($ids)) {
            $this->invalid($field, 'Gunakan taxonomy yang terverifikasi dan sesuai kategorinya.');
        }
    }

    private function normalizeId(mixed $id, string $field): int
    {
        if (
            (is_string($id) && ! ctype_digit($id))
            || (! is_int($id) && ! is_string($id))
            || (int) $id < 1
        ) {
            $this->invalid($field, 'Taxonomy tidak valid.');
        }

        return (int) $id;
    }

    private function invalid(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
