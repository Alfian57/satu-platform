<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\BadgeRuleType;
use App\Models\BadgeDefinition;
use App\Models\BadgeRuleVersion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class CreateBadgeRuleVersion
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $criteria
     */
    public function execute(
        User $actor,
        BadgeDefinition $definition,
        BadgeRuleType|string $ruleType,
        array $criteria,
        bool $activate = true,
        ?string $policyVersion = null,
    ): BadgeRuleVersion {
        Gate::forUser($actor)->authorize('create', BadgeRuleVersion::class);

        $ruleType = $ruleType instanceof BadgeRuleType
            ? $ruleType
            : BadgeRuleType::tryFrom($ruleType)
                ?? throw new InvalidArgumentException('Badge rule type tidak dikenali.');
        $criteria = $this->validatedCriteria($ruleType, $criteria);
        $policyVersion = $this->validatedPolicyVersion(
            $policyVersion ?? (string) config('gamification.policy_version', '1.0.0'),
        );

        return DB::transaction(function () use (
            $actor,
            $definition,
            $ruleType,
            $criteria,
            $activate,
            $policyVersion,
        ): BadgeRuleVersion {
            $lockedDefinition = BadgeDefinition::query()
                ->lockForUpdate()
                ->whereKey($definition->getKey())
                ->firstOrFail();
            $nextVersion = ((int) BadgeRuleVersion::query()
                ->where('badge_definition_id', $lockedDefinition->getKey())
                ->max('version')) + 1;
            $now = now();

            if ($activate) {
                BadgeRuleVersion::query()
                    ->where('badge_definition_id', $lockedDefinition->getKey())
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->get()
                    ->each(function (BadgeRuleVersion $activeVersion): void {
                        $activeVersion->forceFill(['is_active' => false])->save();
                    });
            }

            $version = BadgeRuleVersion::query()->forceCreate([
                'badge_definition_id' => $lockedDefinition->getKey(),
                'version' => $nextVersion,
                'rule_type' => $ruleType,
                'criteria' => $criteria,
                'policy_version' => $policyVersion,
                'is_active' => $activate,
                'created_by_id' => $actor->getKey(),
                'activated_at' => $activate ? $now : null,
            ]);

            $this->audit->record(
                operation: 'badge.rule_version.created',
                auditable: $version,
                actor: $actor,
                after: [
                    'badge_definition_id' => $lockedDefinition->getKey(),
                    'version' => $version->version,
                    'rule_type' => $version->rule_type->value,
                    'criteria' => $version->criteria,
                    'policy_version' => $version->policy_version,
                    'is_active' => $version->is_active,
                ],
                reason: 'taxonomy_change',
            );

            return $version->refresh()->load('definition');
        }, attempts: 3);
    }

    /**
     * @param  array<string, mixed>  $criteria
     */
    public function handle(
        User $actor,
        BadgeDefinition $definition,
        BadgeRuleType|string $ruleType,
        array $criteria,
        bool $activate = true,
        ?string $policyVersion = null,
    ): BadgeRuleVersion {
        return $this->execute($actor, $definition, $ruleType, $criteria, $activate, $policyVersion);
    }

    /**
     * @param  array<string, mixed>  $criteria
     * @return array<string, mixed>
     */
    private function validatedCriteria(BadgeRuleType $ruleType, array $criteria): array
    {
        return match ($ruleType) {
            BadgeRuleType::VerifiedContributionCount => $this->validatedContributionCriteria($criteria),
            BadgeRuleType::Manual => $this->validatedManualCriteria($criteria),
        };
    }

    /**
     * @param  array<string, mixed>  $criteria
     * @return array{minimum_approved_contributions: int}
     */
    private function validatedContributionCriteria(array $criteria): array
    {
        if (array_keys($criteria) !== ['minimum_approved_contributions']) {
            throw new InvalidArgumentException(
                'Verified contribution badge rule hanya menerima minimum_approved_contributions.',
            );
        }

        $minimum = $criteria['minimum_approved_contributions'];

        if (! is_int($minimum) || $minimum < 1) {
            throw new InvalidArgumentException(
                'minimum_approved_contributions harus berupa bilangan positif.',
            );
        }

        return ['minimum_approved_contributions' => $minimum];
    }

    /**
     * @param  array<string, mixed>  $criteria
     * @return array{reason_required: bool}
     */
    private function validatedManualCriteria(array $criteria): array
    {
        if ($criteria === []) {
            return ['reason_required' => true];
        }

        if (array_keys($criteria) !== ['reason_required'] || ! is_bool($criteria['reason_required'])) {
            throw new InvalidArgumentException(
                'Manual badge rule hanya menerima reason_required berupa boolean.',
            );
        }

        return ['reason_required' => $criteria['reason_required']];
    }

    private function validatedPolicyVersion(string $policyVersion): string
    {
        $policyVersion = (string) Str::of($policyVersion)->squish();

        if (
            $policyVersion === ''
            || Str::length($policyVersion) > 32
            || preg_match('/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/', $policyVersion) !== 1
        ) {
            throw new InvalidArgumentException('Badge policy version harus berupa identifier canonical.');
        }

        return $policyVersion;
    }
}
