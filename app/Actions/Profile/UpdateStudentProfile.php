<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Models\Institution;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class UpdateStudentProfile
{
    public function __construct(
        private readonly SyncStudentProfileTaxonomies $syncTaxonomies,
        private readonly AuditRecorder $audit,
        private readonly EnsureStudentProfileIsFresh $ensureFresh,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
    ) {}

    /**
     * Update profile-owned fields and replace any supplied taxonomy selections.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, StudentProfile $studentProfile, array $data): StudentProfile
    {
        Gate::forUser($actor)->authorize('update', $studentProfile);

        return DB::transaction(function () use ($actor, $studentProfile, $data): StudentProfile {
            $profile = StudentProfile::query()
                ->lockForUpdate()
                ->whereKey($studentProfile->getKey())
                ->firstOrFail();
            $this->ensureFresh->handle($profile, $data['expected_updated_at'] ?? null);
            $before = $this->summary($profile);
            $changedFields = [];

            foreach (['bio', 'study_program', 'study_year'] as $field) {
                if (! array_key_exists($field, $data)) {
                    continue;
                }

                $value = $data[$field];
                $profile->{$field} = is_string($value)
                    ? ($value === '' ? null : trim($value))
                    : $value;
                $changedFields[] = $field;
            }

            if ($profile->isDirty()) {
                $profile->save();
            }

            if (array_key_exists('skills', $data)) {
                $this->syncTaxonomies->handle(
                    $profile,
                    skills: is_array($data['skills']) ? $data['skills'] : [],
                );
                $changedFields[] = 'skills';
            }

            if (array_key_exists('interests', $data)) {
                $this->syncTaxonomies->handle(
                    $profile,
                    interests: is_array($data['interests']) ? $data['interests'] : [],
                );
                $changedFields[] = 'interests';
            }

            $changedFields = array_values(array_unique($changedFields));

            if ($changedFields !== []) {
                $after = $this->summary($profile);
                $institution = Institution::query()->findOrFail($profile->institution_id);
                $this->audit->record(
                    operation: 'profile.updated',
                    auditable: $profile,
                    actor: $actor,
                    institution: $institution,
                    before: [
                        'profile_id' => $profile->getKey(),
                        'fields' => $changedFields,
                        'skills_count' => $before['skills_count'],
                        'interests_count' => $before['interests_count'],
                    ],
                    after: [
                        'profile_id' => $profile->getKey(),
                        'fields' => $changedFields,
                        'skills_count' => $after['skills_count'],
                        'interests_count' => $after['interests_count'],
                    ],
                );

                $this->rebuildProjection->handle($actor, $institution);
            }

            return $profile->refresh();
        }, attempts: 3);
    }

    /**
     * @return array{skills_count: int, interests_count: int}
     */
    private function summary(StudentProfile $profile): array
    {
        return [
            'skills_count' => ProfileSkill::query()
                ->whereBelongsTo($profile, 'studentProfile')
                ->count(),
            'interests_count' => ProfileInterest::query()
                ->whereBelongsTo($profile, 'studentProfile')
                ->count(),
        ];
    }
}
