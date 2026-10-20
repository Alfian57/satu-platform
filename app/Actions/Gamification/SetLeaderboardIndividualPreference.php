<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionRosterStatus;
use App\Enums\LeaderboardScopeType;
use App\Jobs\RebuildLeaderboardProjections;
use App\Models\Institution;
use App\Models\LeaderboardPreference;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class SetLeaderboardIndividualPreference
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        Institution $institution,
        bool $isOptedIn,
        int $expectedVersion,
    ): LeaderboardPreference {
        Gate::forUser($actor)->authorize(
            'create',
            [LeaderboardPreference::class, $institution],
        );

        if (
            ! $institution->exists
            || $institution->isDirty($institution->getKeyName())
        ) {
            throw new InvalidArgumentException('Leaderboard institution harus persisted.');
        }

        return DB::transaction(function () use ($actor, $institution, $isOptedIn, $expectedVersion): LeaderboardPreference {
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->firstOrFail();

            $preference = LeaderboardPreference::query()
                ->whereBelongsTo($lockedInstitution)
                ->whereBelongsTo($actor)
                ->where('scope_type', LeaderboardScopeType::Individual->value)
                ->lockForUpdate()
                ->first();
            $currentVersion = $preference === null ? 0 : $preference->version;

            if ($currentVersion !== $expectedVersion) {
                throw ValidationException::withMessages([
                    'expected_version' => 'Pengaturan peringkat telah berubah di sesi lain. Periksa status terbaru sebelum mengirim perubahan lagi.',
                ]);
            }

            $before = $preference === null ? [] : [
                'is_opted_in' => $preference->is_opted_in,
                'version' => $preference->version,
            ];

            if ($preference === null) {
                $preference = LeaderboardPreference::query()->forceCreate([
                    'institution_id' => $lockedInstitution->getKey(),
                    'user_id' => $actor->getKey(),
                    'scope_type' => LeaderboardScopeType::Individual->value,
                    'is_opted_in' => $isOptedIn,
                    'version' => 1,
                    'changed_at' => now(),
                ]);
            } else {
                $preference->forceFill([
                    'is_opted_in' => $isOptedIn,
                    'version' => $preference->version + 1,
                    'changed_at' => now(),
                ])->save();
            }

            $this->audit->record(
                operation: 'leaderboard.preference.changed',
                auditable: $preference,
                actor: $actor,
                institution: $lockedInstitution,
                before: $before,
                after: [
                    'is_opted_in' => $preference->is_opted_in,
                    'version' => $preference->version,
                    'scope_type' => $preference->scope_type->value,
                ],
                reason: $isOptedIn ? 'student_opt_in' : 'student_withdrawal',
            );

            $semesters = $lockedInstitution->rosters()
                ->where('status', InstitutionRosterStatus::Active->value)
                ->pluck('semester')
                ->merge($lockedInstitution->leaderboardPeriods()->pluck('semester'))
                ->filter()->unique()->values();
            DB::afterCommit(static function () use ($lockedInstitution, $semesters): void {
                foreach ($semesters as $semester) {
                    RebuildLeaderboardProjections::dispatch($lockedInstitution->getKey(), (string) $semester);
                }
            });

            return $preference->refresh();
        }, attempts: 3);
    }
}
