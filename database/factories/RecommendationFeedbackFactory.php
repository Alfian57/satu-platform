<?php

namespace Database\Factories;

use App\Enums\RecommendationFeedbackType;
use App\Models\Institution;
use App\Models\Recommendation;
use App\Models\RecommendationFeedback;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecommendationFeedback>
 */
class RecommendationFeedbackFactory extends Factory
{
    protected $model = RecommendationFeedback::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'recommendation_id' => Recommendation::factory(),
            'institution_id' => Institution::factory()->active(),
            'actor_id' => User::factory(),
            'feedback_type' => RecommendationFeedbackType::NotRelevant,
            'created_at' => now(),
        ];
    }

    public function ofType(RecommendationFeedbackType $type): static
    {
        return $this->state(fn (array $attributes): array => [
            'feedback_type' => $type,
        ]);
    }
}
