<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Audit\AuditRecorder;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
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
            if (StudentProfile::query()
                ->whereBelongsTo($actor, 'user')
                ->whereBelongsTo($institution, 'institution')
                ->lockForUpdate()
                ->exists()) {
                throw ValidationException::withMessages([
                    'institution_id' => 'Profil untuk institusi ini sudah tersedia.',
                ]);
            }

            $profile = StudentProfile::query()->forceCreate([
                'user_id' => $actor->getKey(),
                'institution_id' => $institution->getKey(),
                'bio' => $this->nullableString($data['bio'] ?? null),
                'study_program' => $this->nullableString($data['study_program'] ?? null),
                'study_year' => $data['study_year'] ?? null,
            ]);

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
                        'recruiter_discoverable' => $data['recruiter_discoverable'] ?? null,
                    ], static fn (mixed $value): bool => $value !== null),
                );
            }

            if (array_key_exists('availability_windows', $data)) {
                $this->replaceAvailability->handle(
                    $actor,
                    $profile,
                    [
                        'windows' => is_array($data['availability_windows'])
                            ? $data['availability_windows']
                            : [],
                        'timezone' => $data['timezone'] ?? $institution->timezone,
                    ],
                );
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
}
