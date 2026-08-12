<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Institution;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MatchRun>
 */
class MatchRunFactory extends Factory
{
    protected $model = MatchRun::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory()->active(),
            'actor_id' => User::factory(),
            'project_id' => Project::factory(),
            'version_id' => MatchScoreVersion::factory(),
            'input_snapshot' => [
                'schema_version' => 'matching-input-v1',
            ],
            'computed_at' => now(),
        ];
    }
}
