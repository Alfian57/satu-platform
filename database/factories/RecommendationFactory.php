<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MatchingDimension;
use App\Models\Institution;
use App\Models\MatchRun;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Recommendation>
 */
class RecommendationFactory extends Factory
{
    protected $model = Recommendation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'match_run_id' => MatchRun::factory(),
            'institution_id' => Institution::factory()->active(),
            'project_id' => Project::factory(),
            'candidate_id' => User::factory(),
            'component_scores' => [
                MatchingDimension::SkillFit->value => 0.8,
                MatchingDimension::ProjectNeed->value => 0.8,
                MatchingDimension::Availability->value => 0.7,
                MatchingDimension::ConnectivityOpportunity->value => 0.5,
            ],
            'total_score' => 0.74,
            'reason_candidates' => [[
                'dimension' => MatchingDimension::SkillFit->value,
                'score' => 0.8,
                'type' => 'positive',
                'reason' => 'Kecocokan skill cukup kuat.',
            ]],
            'expires_at' => null,
        ];
    }
}
