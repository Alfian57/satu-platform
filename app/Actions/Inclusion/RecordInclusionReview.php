<?php

declare(strict_types=1);

namespace App\Actions\Inclusion;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InclusionHumanConclusion;
use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Laravel\Pennant\Feature;

final class RecordInclusionReview
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Record a human inclusion review decision for an inclusion signal.
     *
     * @throws Exception
     */
    public function execute(
        User $reviewer,
        InclusionSignal $signal,
        InclusionHumanConclusion|string $conclusion,
        ?string $supportAction = null,
        string $reason = '',
    ): InclusionReview {
        if (! Feature::active('inclusion-signal-engine')) {
            throw new Exception('Inclusion signal engine is not active.');
        }

        $signal->loadMissing('institution');

        $context = $this->institutionContextResolver->resolve(
            $reviewer,
            $signal->institution,
            [InstitutionMembershipRole::CampusAdmin],
        );

        if ($context === null) {
            throw new AuthorizationException('You are not authorized to submit a review for this institution.');
        }

        $conclusionValue = $conclusion instanceof InclusionHumanConclusion
            ? $conclusion->value
            : trim((string) $conclusion);

        if ($conclusionValue === '') {
            throw new InvalidArgumentException('Human conclusion is required for inclusion review.');
        }

        $trimmedReason = trim($reason);
        if ($trimmedReason === '') {
            throw new InvalidArgumentException('A clear reason is required for inclusion human review.');
        }

        return DB::transaction(function () use ($reviewer, $signal, $conclusionValue, $supportAction, $trimmedReason) {
            $review = InclusionReview::create([
                'inclusion_signal_id' => $signal->id,
                'reviewer_id' => $reviewer->id,
                'human_conclusion' => $conclusionValue,
                'support_action' => $supportAction !== null ? trim($supportAction) : null,
                'reason' => $trimmedReason,
            ]);

            $this->auditRecorder->record(
                operation: 'inclusion_review.created',
                auditable: $signal,
                actor: $reviewer,
                institution: $signal->institution,
                before: [],
                after: [
                    'inclusion_review_id' => $review->id,
                    'human_conclusion' => $conclusionValue,
                    'support_action' => $supportAction,
                ],
                reason: $trimmedReason,
            );

            return $review;
        });
    }
}
