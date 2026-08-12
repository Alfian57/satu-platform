<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContributionStatus;
use App\Exceptions\InvalidContributionTransition;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class SubmitContribution
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, Contribution $contribution): Contribution
    {
        Gate::forUser($actor)->authorize('submit', $contribution);

        return DB::transaction(function () use ($actor, $contribution): Contribution {
            $lockedContribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($contribution->getKey())
                ->firstOrFail();

            $lockedContribution->load([
                'currentVersion.evidence.attachment',
                'project',
            ]);
            Gate::forUser($actor)->authorize('submit', $lockedContribution);

            if (! $lockedContribution->status->canTransitionTo(ContributionStatus::Pending)) {
                throw new InvalidContributionTransition(
                    'Contribution hanya dapat dikirim saat berstatus draft.',
                );
            }

            $version = $lockedContribution->currentVersion;

            if ($version === null) {
                throw ValidationException::withMessages([
                    'version' => 'Contribution harus memiliki versi sebelum dikirim.',
                ]);
            }

            $evidenceCount = $version->evidence
                ->filter(static fn ($evidence): bool => $evidence->attachment !== null
                    && ! $evidence->attachment->trashed())
                ->count();

            if ($evidenceCount === 0) {
                throw ValidationException::withMessages([
                    'evidence' => 'Minimal satu evidence aktif wajib dilampirkan.',
                ]);
            }

            $institution = Institution::query()
                ->whereKey($lockedContribution->institution_id)
                ->firstOrFail();
            $beforeStatus = $lockedContribution->status->value;

            $lockedContribution->forceFill([
                'status' => ContributionStatus::Pending,
            ])->save();

            $this->audit->record(
                operation: 'contribution.submitted',
                auditable: $lockedContribution,
                actor: $actor,
                institution: $institution,
                before: ['status' => $beforeStatus],
                after: [
                    'status' => $lockedContribution->status->value,
                    'version_number' => $version->version_number,
                    'evidence_count' => $evidenceCount,
                ],
            );

            return $lockedContribution->refresh()->load([
                'institution',
                'owner',
                'project',
                'currentVersion.task',
                'currentVersion.evidence.attachment',
            ]);
        }, attempts: 3);
    }
}
