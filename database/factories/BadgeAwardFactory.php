<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BadgeAward;
use App\Models\BadgeDefinition;
use App\Models\BadgeRuleVersion;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BadgeAward> */
class BadgeAwardFactory extends Factory
{
    protected $model = BadgeAward::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'institution_id' => Institution::factory()->active(),
            'badge_definition_id' => BadgeDefinition::factory(),
            'badge_rule_version_id' => BadgeRuleVersion::factory(),
            'source_type' => Contribution::class,
            'source_id' => Contribution::factory(),
            'source_version_id' => null,
            'source_label' => 'Kontribusi terverifikasi',
            'reason' => null,
            'idempotency_key' => fake()->unique()->bothify('badge-award-########'),
            'awarded_at' => now(),
            'revoked_at' => null,
        ];
    }

    public function forContribution(
        Contribution $contribution,
        ?ContributionVersion $version = null,
    ): static {
        $sourceLabel = 'Kontribusi terverifikasi';

        if ($version !== null) {
            $sourceLabel = $version->claim;
        }

        return $this->state([
            'user_id' => $contribution->owner_id,
            'institution_id' => $contribution->institution_id,
            'source_type' => Contribution::class,
            'source_id' => $contribution->getKey(),
            'source_version_id' => $version?->getKey(),
            'source_label' => $sourceLabel,
        ]);
    }

    public function revoked(): static
    {
        return $this->state(['revoked_at' => now()]);
    }
}
