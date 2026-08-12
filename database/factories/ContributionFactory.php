<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContributionStatus;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Contribution> */
class ContributionFactory extends Factory
{
    protected $model = Contribution::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory()->active(),
            'owner_id' => User::factory(),
            'project_id' => Project::factory()->open(),
            'status' => ContributionStatus::Draft,
            'current_version_id' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => ContributionStatus::Draft]);
    }

    public function pending(): static
    {
        return $this->state(['status' => ContributionStatus::Pending]);
    }

    public function revision(): static
    {
        return $this->state(['status' => ContributionStatus::Revision]);
    }

    public function approved(): static
    {
        return $this->state(['status' => ContributionStatus::Approved]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => ContributionStatus::Rejected]);
    }

    public function archived(): static
    {
        return $this->state(['status' => ContributionStatus::Archived]);
    }
}
