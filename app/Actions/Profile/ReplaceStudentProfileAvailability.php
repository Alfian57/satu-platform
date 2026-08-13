<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Models\AvailabilityWindow;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class ReplaceStudentProfileAvailability
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly EnsureStudentProfileIsFresh $ensureFresh,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
    ) {}

    /**
     * Replace all availability windows atomically after validating order and overlap.
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
            $fallbackTimezone = $data['timezone']
                ?? $profile->institution()->value('timezone')
                ?? 'UTC';
            $windows = $this->normalizeWindows($data['windows'] ?? [], $fallbackTimezone);
            $existingCount = AvailabilityWindow::query()
                ->whereBelongsTo($profile, 'studentProfile')
                ->count();

            AvailabilityWindow::query()
                ->whereBelongsTo($profile, 'studentProfile')
                ->delete();

            foreach ($windows as $window) {
                AvailabilityWindow::query()->forceCreate([
                    'student_profile_id' => $profile->getKey(),
                    ...$window,
                ]);
            }

            $institution = Institution::query()->findOrFail($profile->institution_id);

            $this->audit->record(
                operation: 'profile.availability_updated',
                auditable: $profile,
                actor: $actor,
                institution: $institution,
                before: [
                    'profile_id' => $profile->getKey(),
                    'availability_count' => $existingCount,
                ],
                after: [
                    'profile_id' => $profile->getKey(),
                    'availability_count' => count($windows),
                    'days' => array_values(array_unique(array_column($windows, 'day_of_week'))),
                ],
            );

            $this->rebuildProjection->handle($actor, $institution);

            return $profile->refresh();
        }, attempts: 3);
    }

    /**
     * @return array<int, array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>
     */
    private function normalizeWindows(mixed $windows, mixed $fallbackTimezone): array
    {
        if (! is_array($windows)) {
            $this->invalid('windows', 'Format availability windows tidak valid.');
        }

        if (count($windows) > 14) {
            $this->invalid('windows', 'Maksimal 14 availability window dapat disimpan.');
        }

        $fallbackTimezone = $this->normalizeTimezone($fallbackTimezone, 'timezone');
        $normalized = [];
        $seen = [];

        foreach ($windows as $index => $window) {
            if (! is_array($window)) {
                $this->invalid('windows.'.$index, 'Format availability window tidak valid.');
            }

            $day = $window['day_of_week'] ?? null;
            if (! is_int($day) && ! (is_string($day) && ctype_digit($day))) {
                $this->invalid('windows.'.$index.'.day_of_week', 'Hari availability tidak valid.');
            }
            $day = (int) $day;

            if ($day < 0 || $day > 6) {
                $this->invalid('windows.'.$index.'.day_of_week', 'Hari availability harus bernilai 0 sampai 6.');
            }

            $timezone = $this->normalizeTimezone(
                $window['timezone'] ?? $fallbackTimezone,
                'windows.'.$index.'.timezone',
            );
            $startsAt = $this->normalizeTime($window['starts_at'] ?? null, 'windows.'.$index.'.starts_at');
            $endsAt = $this->normalizeTime($window['ends_at'] ?? null, 'windows.'.$index.'.ends_at');

            if ($startsAt >= $endsAt) {
                $this->invalid('windows.'.$index, 'Waktu mulai harus sebelum waktu selesai.');
            }

            $key = implode('|', [$day, $startsAt, $endsAt, $timezone]);
            if (isset($seen[$key])) {
                $this->invalid('windows', 'Availability window tidak boleh duplikat.');
            }
            $seen[$key] = true;

            $normalized[] = [
                'day_of_week' => $day,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'timezone' => $timezone,
            ];
        }

        usort($normalized, static function (array $left, array $right): int {
            return [$left['day_of_week'], $left['timezone'], $left['starts_at']]
                <=> [$right['day_of_week'], $right['timezone'], $right['starts_at']];
        });

        foreach ($normalized as $index => $window) {
            $previous = $normalized[$index - 1] ?? null;

            if (
                $previous !== null
                && $previous['day_of_week'] === $window['day_of_week']
                && $previous['timezone'] === $window['timezone']
                && $window['starts_at'] < $previous['ends_at']
            ) {
                $this->invalid('windows', 'Availability window pada hari dan timezone yang sama tidak boleh overlap.');
            }
        }

        return $normalized;
    }

    private function normalizeTime(mixed $value, string $field): string
    {
        if (! is_string($value)) {
            $this->invalid($field, 'Waktu availability tidak valid.');
        }

        foreach (['!H:i', '!H:i:s'] as $format) {
            $parsed = DateTimeImmutable::createFromFormat($format, $value);
            $errors = DateTimeImmutable::getLastErrors();

            if (
                $parsed !== false
                && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))
            ) {
                return $parsed->format('H:i:s');
            }
        }

        $this->invalid($field, 'Waktu availability harus memakai format HH:MM.');
    }

    private function normalizeTimezone(mixed $value, string $field): string
    {
        if (! is_string($value) || $value === '') {
            $this->invalid($field, 'Timezone availability tidak valid.');
        }

        try {
            new DateTimeZone($value);
        } catch (\Exception) {
            $this->invalid($field, 'Timezone availability tidak valid.');
        }

        return $value;
    }

    private function invalid(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
