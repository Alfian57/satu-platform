<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Events\ContributionApproved;
use App\Exceptions\InvalidContributionTransition;
use App\Exceptions\StaleContributionDecision;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\User;
use App\Notifications\ContributionReviewedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ReviewContribution
{
    public const POLICY_VERSION = 'contribution-review-v1';

    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
    ) {}

    public function handle(
        Contribution $contribution,
        User $reviewer,
        ContributionReviewDecision $decision,
        int $expectedVersion,
        ?string $reason = null,
        ?string $note = null,
    ): ContributionReview {
        $reason = $this->validatedReason($decision, $reason);
        $note = $this->validatedNote($note);

        return DB::transaction(function () use (
            $contribution,
            $reviewer,
            $decision,
            $expectedVersion,
            $reason,
            $note,
        ): ContributionReview {
            $lockedContribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($contribution->getKey())
                ->firstOrFail();
            $lockedContribution->load(['currentVersion', 'owner', 'project']);

            $institution = Institution::query()
                ->whereKey($lockedContribution->institution_id)
                ->firstOrFail();

            Gate::forUser($reviewer)->authorize('review', $lockedContribution);

            $version = $lockedContribution->currentVersion;

            if (
                $version === null
                || $version->version_number !== $expectedVersion
            ) {
                throw new StaleContributionDecision(
                    'Contribution berubah sebelum keputusan ini disimpan.',
                );
            }

            if ($lockedContribution->status !== ContributionStatus::Pending) {
                throw new InvalidContributionTransition(
                    'Hanya contribution dengan status pending yang dapat ditinjau.',
                );
            }

            Gate::forUser($reviewer)->authorize('create', [ContributionReview::class, $version]);

            if (ContributionReview::query()
                ->where('contribution_version_id', $version->getKey())
                ->exists()) {
                throw new StaleContributionDecision(
                    'Versi contribution ini sudah memiliki keputusan review.',
                );
            }

            $newStatus = $decision->contributionStatus();

            if (! $lockedContribution->status->canTransitionTo($newStatus)) {
                throw new InvalidContributionTransition(
                    'Contribution tidak dapat berpindah ke status review yang dipilih.',
                );
            }

            $review = ContributionReview::query()->forceCreate([
                'contribution_version_id' => $version->getKey(),
                'reviewer_id' => $reviewer->getKey(),
                'decision' => $decision,
                'policy_version' => self::POLICY_VERSION,
                'reason' => $reason,
                'note' => $note,
                'reviewed_at' => now(),
            ]);

            $lockedContribution->forceFill([
                'status' => $newStatus,
            ])->save();

            $this->rebuildProjection->handle($lockedContribution->owner, $institution);

            $this->audit->record(
                operation: 'contribution.reviewed',
                auditable: $lockedContribution,
                actor: $reviewer,
                institution: $institution,
                before: [
                    'status' => ContributionStatus::Pending->value,
                    'version_number' => $version->version_number,
                ],
                after: [
                    'status' => $newStatus->value,
                    'decision' => $decision->value,
                    'review_id' => $review->getKey(),
                    'version_number' => $version->version_number,
                    'policy_version' => self::POLICY_VERSION,
                ],
                reason: $reason,
            );

            if ($decision === ContributionReviewDecision::Approved) {
                ContributionApproved::dispatch(
                    contributionId: $lockedContribution->getKey(),
                    contributionVersionId: $version->getKey(),
                    reviewId: $review->getKey(),
                    reviewerId: $reviewer->getKey(),
                    institutionId: $institution->getKey(),
                    policyVersion: self::POLICY_VERSION,
                );
            }

            $lockedContribution->owner->notify(new ContributionReviewedNotification($review));

            return $review->refresh()->load([
                'contributionVersion.contribution',
                'reviewer',
            ]);
        }, attempts: 3);
    }

    private function validatedReason(
        ContributionReviewDecision $decision,
        ?string $reason,
    ): ?string {
        $reason = $reason === null ? null : (string) Str::of($reason)->squish();

        if ($decision->requiresReason() && ($reason === null || $reason === '')) {
            throw ValidationException::withMessages([
                'reason' => 'Alasan wajib diisi untuk request revision atau reject.',
            ]);
        }

        if ($reason !== null && Str::length($reason) > 1000) {
            throw ValidationException::withMessages([
                'reason' => 'Alasan review tidak boleh melebihi 1000 karakter.',
            ]);
        }

        return $reason === '' ? null : $reason;
    }

    private function validatedNote(?string $note): ?string
    {
        $note = $note === null ? null : (string) Str::of($note)->squish();

        if ($note !== null && Str::length($note) > 1000) {
            throw ValidationException::withMessages([
                'note' => 'Catatan review tidak boleh melebihi 1000 karakter.',
            ]);
        }

        return $note === '' ? null : $note;
    }
}
