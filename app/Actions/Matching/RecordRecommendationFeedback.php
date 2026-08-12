<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecommendationFeedbackType;
use App\Exceptions\StaleRecommendation;
use App\Models\Institution;
use App\Models\MatchScoreVersion;
use App\Models\Recommendation;
use App\Models\RecommendationFeedback;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class RecordRecommendationFeedback
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    public function execute(
        User $actor,
        Recommendation $recommendation,
        RecommendationFeedbackType $feedbackType,
    ): RecommendationFeedback {
        Gate::forUser($actor)->authorize('feedback', $recommendation);

        return DB::transaction(function () use ($actor, $recommendation, $feedbackType): RecommendationFeedback {
            $lockedRecommendation = Recommendation::query()
                ->whereKey($recommendation->getKey())
                ->where('institution_id', $recommendation->institution_id)
                ->with('matchRun:id,version_id')
                ->lockForUpdate()
                ->firstOrFail();

            Gate::forUser($actor)->authorize('feedback', $lockedRecommendation);

            $currentVersion = MatchScoreVersion::current();

            if ($lockedRecommendation->isStaleAgainst($currentVersion?->getKey())) {
                throw new StaleRecommendation(
                    'Recommendation menggunakan score version yang sudah tidak aktif. Jalankan query terbaru sebelum memberi feedback.',
                );
            }

            $existingFeedback = RecommendationFeedback::query()
                ->whereBelongsTo($lockedRecommendation)
                ->whereBelongsTo($actor, 'actor')
                ->first();

            if ($existingFeedback !== null) {
                if ($existingFeedback->feedback_type === $feedbackType) {
                    return $existingFeedback;
                }

                throw new InvalidArgumentException('Feedback untuk recommendation ini sudah pernah dicatat.');
            }

            $institution = Institution::query()
                ->whereKey($lockedRecommendation->institution_id)
                ->firstOrFail();
            $feedback = RecommendationFeedback::query()->forceCreate([
                'recommendation_id' => $lockedRecommendation->getKey(),
                'institution_id' => $institution->getKey(),
                'actor_id' => $actor->getKey(),
                'feedback_type' => $feedbackType,
                'created_at' => now(),
            ]);

            $this->auditRecorder->record(
                operation: $feedbackType->auditOperation(),
                auditable: $feedback,
                actor: $actor,
                institution: $institution,
                after: [
                    'recommendation_id' => $lockedRecommendation->getKey(),
                    'feedback_type' => $feedbackType->value,
                ],
                reason: 'Recommendation feedback dicatat.',
            );

            return $feedback;
        }, attempts: 3);
    }
}
