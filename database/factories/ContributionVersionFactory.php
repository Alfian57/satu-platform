<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContributionVersion> */
class ContributionVersionFactory extends Factory
{
    protected $model = ContributionVersion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contribution_id' => Contribution::factory(),
            'created_by_id' => User::factory(),
            'task_id' => Task::factory(),
            'version_number' => 1,
            'claim' => fake()->sentence(6),
            'summary' => fake()->paragraph(),
            'declaration' => 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        ];
    }

    public function forContribution(Contribution $contribution, int $versionNumber = 1): static
    {
        return $this->state([
            'contribution_id' => $contribution->getKey(),
            'created_by_id' => $contribution->owner_id,
            'version_number' => $versionNumber,
            'task_id' => Task::factory()->for($contribution->project),
        ]);
    }
}
