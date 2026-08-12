<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\RecommendationFeedbackType;
use App\Models\Recommendation;
use App\Models\RecommendationFeedback;
use App\Models\User;

final class MarkRecommendationNotRelevant
{
    public function __construct(
        private readonly RecordRecommendationFeedback $recordFeedback,
    ) {}

    public function execute(User $actor, Recommendation $recommendation): RecommendationFeedback
    {
        return $this->recordFeedback->execute(
            $actor,
            $recommendation,
            RecommendationFeedbackType::NotRelevant,
        );
    }
}
