<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\BadgeRuleType;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Models\BadgeAward;
use App\Models\BadgeRuleVersion;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;
use LogicException;

final class IssueBadge
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly BadgeRuleEvaluator $evaluator,
    ) {}

    public function execute(
        User $actor,
        BadgeRuleVersion $ruleVersion,
        Contribution $sourceContribution,
        ?string $reason = null,
    ): BadgeAward {
        return $this->handle($ruleVersion, $sourceContribution, $actor, $reason);
    }

    public function handle(
        BadgeRuleVersion $ruleVersion,
        Contribution $sourceContribution,
        User $actor,
        ?string $reason = null,
    ): BadgeAward {
        Gate::forUser($actor)->authorize('issue', [BadgeAward::class, $sourceContribution]);
        $reason = $this->validatedReason($ruleVersion->rule_type, $reason);

        return DB::transaction(function () use (
            $ruleVersion,
            $sourceContribution,
            $actor,
            $reason,
        ): BadgeAward {
            $lockedRule = BadgeRuleVersion::query()
                ->lockForUpdate()
                ->with('definition')
                ->whereKey($ruleVersion->getKey())
                ->firstOrFail();
            $lockedContribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($sourceContribution->getKey())
                ->firstOrFail();
            $lockedContribution->load(['currentVersion', 'project']);

            Gate::forUser($actor)->authorize('issue', [BadgeAward::class, $lockedContribution]);

            $this->validateContributionSource($lockedContribution);

            $institution = Institution::query()
                ->whereKey($lockedContribution->institution_id)
                ->firstOrFail();
            $idempotencyKey = $this->idempotencyKey($lockedRule, $lockedContribution);
            $existing = BadgeAward::query()
                ->where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                $this->assertMatchingExistingAward($existing, $lockedRule, $lockedContribution);

                return $existing->load([
                    'definition',
                    'ruleVersion',
                    'source',
                    'sourceVersion',
                    'revocation',
                ]);
            }

            if (! $lockedRule->is_active) {
                throw new InvalidArgumentException('Badge rule version tidak lagi aktif.');
            }

            $approvedReview = ContributionReview::query()
                ->where('contribution_version_id', $lockedContribution->currentVersion->getKey())
                ->where('decision', ContributionReviewDecision::Approved)
                ->first();

            if ($approvedReview === null) {
                throw new InvalidArgumentException(
                    'Badge hanya dapat diterbitkan dari contribution dengan review approved.',
                );
            }

            if ($lockedRule->rule_type === BadgeRuleType::VerifiedContributionCount) {
                $verifiedContributionCount = $this->verifiedContributionCount($lockedContribution);

                if (! $this->evaluator->passes($lockedRule, $verifiedContributionCount)) {
                    throw new InvalidArgumentException('Contribution belum memenuhi badge rule aktif.');
                }
            }

            $version = $lockedContribution->currentVersion;
            $sourceLabel = (string) Str::of($version->claim)->squish();
            $sourceLabel = Str::limit(
                $sourceLabel === '' ? 'Kontribusi terverifikasi' : $sourceLabel,
                160,
                '',
            );
            $award = BadgeAward::query()->forceCreate([
                'user_id' => $lockedContribution->owner_id,
                'institution_id' => $lockedContribution->institution_id,
                'badge_definition_id' => $lockedRule->badge_definition_id,
                'badge_rule_version_id' => $lockedRule->getKey(),
                'source_type' => Contribution::class,
                'source_id' => $lockedContribution->getKey(),
                'source_version_id' => $version->getKey(),
                'source_label' => $sourceLabel,
                'reason' => $reason,
                'idempotency_key' => $idempotencyKey,
                'awarded_at' => now(),
                'revoked_at' => null,
            ]);

            $this->audit->record(
                operation: 'badge.awarded',
                auditable: $award,
                actor: $actor,
                institution: $institution,
                after: [
                    'badge_award_id' => $award->getKey(),
                    'badge_definition_id' => $award->badge_definition_id,
                    'badge_rule_version_id' => $award->badge_rule_version_id,
                    'user_id' => $award->user_id,
                    'source_type' => $award->source_type,
                    'source_id' => $award->source_id,
                    'source_version_id' => $award->source_version_id,
                    'policy_version' => $lockedRule->policy_version,
                ],
                reason: $reason ?? $this->evaluator->explanation($lockedRule),
            );

            return $award->refresh()->load([
                'definition',
                'ruleVersion',
                'source',
                'sourceVersion',
                'revocation',
            ]);
        }, attempts: 3);
    }

    public function award(
        BadgeRuleVersion $ruleVersion,
        Contribution $sourceContribution,
        User $actor,
        ?string $reason = null,
    ): BadgeAward {
        return $this->handle($ruleVersion, $sourceContribution, $actor, $reason);
    }

    private function validateContributionSource(Contribution $contribution): void
    {
        if (
            $contribution->project === null
            || $contribution->project->institution_id !== $contribution->institution_id
        ) {
            throw new LogicException('Badge source dan institution harus berada dalam tenant yang sama.');
        }

        if ($contribution->status !== ContributionStatus::Approved) {
            throw new InvalidArgumentException(
                'Badge hanya dapat diterbitkan dari contribution yang sudah approved.',
            );
        }

        if ($contribution->currentVersion === null) {
            throw new InvalidArgumentException('Contribution approved harus memiliki current version.');
        }
    }

    private function verifiedContributionCount(Contribution $contribution): int
    {
        return Contribution::query()
            ->where('institution_id', $contribution->institution_id)
            ->where('owner_id', $contribution->owner_id)
            ->where('status', ContributionStatus::Approved)
            ->whereHas('project', function ($query) use ($contribution): void {
                $query->where('institution_id', $contribution->institution_id);
            })
            ->whereHas('currentVersion.reviews', function ($query): void {
                $query->where('decision', ContributionReviewDecision::Approved);
            })
            ->count();
    }

    private function idempotencyKey(
        BadgeRuleVersion $rule,
        Contribution $contribution,
    ): string {
        return implode(':', [
            'badge',
            $contribution->institution_id,
            $contribution->owner_id,
            $rule->badge_definition_id,
            $rule->getKey(),
        ]);
    }

    private function validatedReason(BadgeRuleType $ruleType, ?string $reason): ?string
    {
        $reason = $reason === null ? null : (string) Str::of($reason)->squish();

        if ($ruleType === BadgeRuleType::Manual && ($reason === null || $reason === '')) {
            throw new InvalidArgumentException('Manual badge issuance membutuhkan alasan.');
        }

        if ($reason !== null && Str::length($reason) > 1000) {
            throw new InvalidArgumentException('Alasan badge tidak boleh melebihi 1000 karakter.');
        }

        return $reason === '' ? null : $reason;
    }

    private function assertMatchingExistingAward(
        BadgeAward $existing,
        BadgeRuleVersion $rule,
        Contribution $contribution,
    ): void {
        if (
            $existing->user_id !== $contribution->owner_id
            || $existing->institution_id !== $contribution->institution_id
            || $existing->badge_definition_id !== $rule->badge_definition_id
            || $existing->badge_rule_version_id !== $rule->getKey()
            || $existing->source_type !== Contribution::class
        ) {
            throw new LogicException('Badge idempotency key sudah terikat pada badge atau tenant yang berbeda.');
        }
    }
}
