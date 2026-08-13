<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BadgeRuleType;
use App\Models\BadgeDefinition;
use App\Models\BadgeRuleVersion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BadgeRuleVersion> */
class BadgeRuleVersionFactory extends Factory
{
    protected $model = BadgeRuleVersion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'badge_definition_id' => BadgeDefinition::factory(),
            'version' => 1,
            'rule_type' => BadgeRuleType::VerifiedContributionCount,
            'criteria' => ['minimum_approved_contributions' => 1],
            'policy_version' => '1.0.0',
            'is_active' => true,
            'created_by_id' => User::factory(),
            'activated_at' => now(),
        ];
    }

    public function inactive(): static
    {
        return $this->state([
            'is_active' => false,
            'activated_at' => null,
        ]);
    }

    public function manual(): static
    {
        return $this->state([
            'rule_type' => BadgeRuleType::Manual,
            'criteria' => [],
        ]);
    }

    public function forDefinition(BadgeDefinition $definition, int $version = 1): static
    {
        return $this->state([
            'badge_definition_id' => $definition->getKey(),
            'version' => $version,
        ]);
    }
}
