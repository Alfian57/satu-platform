<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Audit\AuditRecorder;
use App\Events\MatchingInputsChanged;
use App\Models\AffiliationProfileDraft;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Portfolio\PortfolioPrivacyRevision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class CreateStudentProfile
{
    public function __construct(
        private readonly SyncStudentProfileTaxonomies $syncTaxonomies,
        private readonly UpdateStudentProfileVisibility $updateVisibility,
        private readonly ReplaceStudentProfileAvailability $replaceAvailability,
        private readonly AuditRecorder $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Institution $institution, array $data): StudentProfile
    {
        Gate::forUser($actor)->authorize('create', [StudentProfile::class, $institution]);

        return DB::transaction(function () use ($actor, $institution, $data): StudentProfile {
            $institution = Institution::query()->whereKey($institution->getKey())->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize('create', [StudentProfile::class, $institution]);
            if (StudentProfile::query()
                ->whereBelongsTo($actor, 'user')
                ->whereBelongsTo($institution, 'institution')
                ->lockForUpdate()
                ->first(['id']) !== null) {
                throw ValidationException::withMessages([
                    'institution_id' => 'Profil untuk institusi ini sudah tersedia.',
                ]);
            }

            $affiliationDraft = AffiliationProfileDraft::query()
                ->whereBelongsTo($actor, 'user')
                ->whereBelongsTo($institution, 'institution')
                ->lockForUpdate()
                ->first();
            $academicDraft = $affiliationDraft === null
                ? []
                : $affiliationDraft->academic_profile;
            $profileData = $data;

            foreach (['faculty', 'study_program', 'admission_year'] as $field) {
                if (! array_key_exists($field, $academicDraft)) {
                    continue;
                }

                $recordedValue = $this->normalizeAcademicValue($field, $academicDraft[$field]);

                if (! $this->isAcademicValueSet($recordedValue)) {
                    if (! array_key_exists($field, $profileData)) {
                        $profileData[$field] = $academicDraft[$field];
                    }

                    continue;
                }

                if (
                    array_key_exists($field, $profileData)
                    && $this->normalizeAcademicValue($field, $profileData[$field]) !== $recordedValue
                ) {
                    throw ValidationException::withMessages([
                        $field => 'Data yang sudah tercatat saat pengajuan afiliasi tidak dapat diubah.',
                    ]);
                }

                $profileData[$field] = $recordedValue;
            }

            $profile = StudentProfile::query()->forceCreate([
                'user_id' => $actor->getKey(),
                'institution_id' => $institution->getKey(),
                'bio' => $this->nullableString($profileData['bio'] ?? null),
                'study_program' => $this->nullableString($profileData['study_program'] ?? null),
                'study_year' => $profileData['study_year'] ?? null,
                'faculty' => $this->nullableString($profileData['faculty'] ?? null),
                'admission_year' => $profileData['admission_year'] ?? null,
            ]);

            $affiliationDraft?->delete();

            $this->syncTaxonomies->handle(
                $profile,
                skills: array_key_exists('skills', $data) && is_array($data['skills'])
                    ? $data['skills']
                    : null,
                interests: array_key_exists('interests', $data) && is_array($data['interests'])
                    ? $data['interests']
                    : null,
            );

            if (array_key_exists('portfolio_visibility', $data)
                || array_key_exists('recruiter_discoverable', $data)) {
                $this->updateVisibility->handle(
                    $actor,
                    $profile,
                    array_filter([
                        'portfolio_visibility' => $data['portfolio_visibility'] ?? null,
                        'expected_privacy_revision' => PortfolioPrivacyRevision::for($profile),
                        'recruiter_discoverable' => $data['recruiter_discoverable'] ?? null,
                    ], static fn (mixed $value): bool => $value !== null),
                );
            }

            if (array_key_exists('availability_windows', $data)) {
                $this->replaceAvailability->handleFromProfile($actor, $profile, $data);
            }

            $this->audit->record(
                operation: 'profile.created',
                auditable: $profile,
                actor: $actor,
                institution: $institution,
                after: [
                    'profile_id' => $profile->getKey(),
                    'skills_count' => $profile->skills()->count(),
                    'interests_count' => $profile->interests()->count(),
                    'availability_count' => $profile->availabilityWindows()->count(),
                ],
            );

            MatchingInputsChanged::dispatch($profile->institution_id, $profile->user_id);

            return $profile->refresh();
        }, attempts: 3);
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function normalizeAcademicValue(string $field, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if ($field === 'admission_year') {
            return is_numeric($value) ? (int) $value : $value;
        }

        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function isAcademicValueSet(mixed $value): bool
    {
        return $value !== null && $value !== '';
    }
}
