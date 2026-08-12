<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MatchingDimension;
use App\Models\MatchScoreVersion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MatchScoreVersion>
 */
class MatchScoreVersionFactory extends Factory
{
    protected $model = MatchScoreVersion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'version' => '1.0.0',
            'dimensions' => array_map(
                static fn (MatchingDimension $dimension): string => $dimension->value,
                MatchingDimension::cases(),
            ),
            'weights' => [
                MatchingDimension::SkillFit->value => 0.35,
                MatchingDimension::ProjectNeed->value => 0.30,
                MatchingDimension::Availability->value => 0.20,
                MatchingDimension::ConnectivityOpportunity->value => 0.15,
            ],
            'parameters' => [
                'availability_target_minutes' => 1200,
                'connectivity_cap' => 5,
            ],
            'activated_at' => now(),
            'author_id' => User::factory(),
            'notes' => 'Version matching untuk pengujian dan synthetic demonstration.',
        ];
    }

    public function version(string $version): static
    {
        return $this->state(fn (array $attributes): array => [
            'version' => $version,
        ]);
    }
}
