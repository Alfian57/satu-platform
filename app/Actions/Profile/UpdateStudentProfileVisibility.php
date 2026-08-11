<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Enums\PortfolioVisibility;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class UpdateStudentProfileVisibility
{
    public function __construct(
        private readonly ConsentRecorder $consent,
        private readonly AuditRecorder $audit,
        private readonly EnsureStudentProfileIsFresh $ensureFresh,
    ) {}

    /**
     * Update portfolio visibility and recruiter discoverability independently.
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
            $before = [
                'portfolio_visibility' => $profile->portfolio_visibility->value,
                'recruiter_discoverable' => $profile->recruiter_discoverable,
            ];
            $changes = [];

            if (array_key_exists('portfolio_visibility', $data)) {
                $visibility = PortfolioVisibility::tryFrom((string) $data['portfolio_visibility']);

                if ($visibility === null) {
                    throw ValidationException::withMessages([
                        'portfolio_visibility' => 'Visibility portfolio tidak valid.',
                    ]);
                }

                $changes['portfolio_visibility'] = $visibility;
            }

            if (array_key_exists('recruiter_discoverable', $data)) {
                $discoverable = filter_var(
                    $data['recruiter_discoverable'],
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE,
                );

                if ($discoverable === null) {
                    throw ValidationException::withMessages([
                        'recruiter_discoverable' => 'Nilai recruiter discoverability tidak valid.',
                    ]);
                }

                $changes['recruiter_discoverable'] = $discoverable;
            }

            if ($changes !== []) {
                $profile->forceFill($changes)->save();
            }

            if (array_key_exists('portfolio_visibility', $changes)) {
                $this->syncConsent(
                    $actor,
                    'portfolio.visibility',
                    $profile->portfolio_visibility !== PortfolioVisibility::Private,
                );
            }

            if (array_key_exists('recruiter_discoverable', $changes)) {
                $this->syncConsent(
                    $actor,
                    'recruiter.discoverability',
                    $profile->recruiter_discoverable,
                );
            }

            if ($changes !== []) {
                $after = [
                    'portfolio_visibility' => $profile->portfolio_visibility->value,
                    'recruiter_discoverable' => $profile->recruiter_discoverable,
                ];
                $this->audit->record(
                    operation: 'profile.visibility_updated',
                    auditable: $profile,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($profile->institution_id),
                    before: $before,
                    after: $after,
                );
            }

            return $profile->refresh();
        }, attempts: 3);
    }

    private function syncConsent(User $actor, string $purpose, bool $granted): void
    {
        $current = $this->consent->current($actor, $purpose);

        if ($granted) {
            if ($current?->isGrant() !== true) {
                $this->consent->grant($actor, $purpose, 'v1', 'profile.settings');
            }

            return;
        }

        if ($current?->isGrant() === true) {
            $this->consent->withdraw($actor, $purpose, 'v1', 'profile.settings');
        }
    }
}
