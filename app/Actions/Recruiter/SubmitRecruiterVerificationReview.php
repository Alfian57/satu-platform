<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecruiterOrganizationStatus;
use App\Enums\RecruiterVerificationConclusion;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class SubmitRecruiterVerificationReview
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Submit a verification review decision for a recruiter organization as platform admin.
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $admin,
        RecruiterOrganization $organization,
        RecruiterVerificationConclusion|string $conclusion,
        ?string $reason = null,
    ): RecruiterVerificationReview {
        if (! $admin->is_platform_admin) {
            throw new AuthorizationException('Only platform administrators can review recruiter organizations.');
        }

        $enumConclusion = $conclusion instanceof RecruiterVerificationConclusion
            ? $conclusion
            : RecruiterVerificationConclusion::tryFrom((string) $conclusion)
                ?? throw new InvalidArgumentException("Invalid recruiter verification conclusion: {$conclusion}");

        $trimmedReason = $reason !== null ? trim($reason) : null;

        if (
            in_array($enumConclusion, [RecruiterVerificationConclusion::Rejected, RecruiterVerificationConclusion::Suspended], true)
            && ($trimmedReason === null || $trimmedReason === '')
        ) {
            throw new InvalidArgumentException('A reason is required when rejecting or suspending a recruiter organization.');
        }

        $newStatus = match ($enumConclusion) {
            RecruiterVerificationConclusion::Verified, RecruiterVerificationConclusion::Unsuspend => RecruiterOrganizationStatus::Verified,
            RecruiterVerificationConclusion::Rejected => RecruiterOrganizationStatus::Rejected,
            RecruiterVerificationConclusion::Suspended => RecruiterOrganizationStatus::Suspended,
        };

        return DB::transaction(function () use ($admin, $organization, $enumConclusion, $newStatus, $trimmedReason) {
            $organization->update([
                'status' => $newStatus->value,
            ]);

            $review = RecruiterVerificationReview::query()->create([
                'recruiter_organization_id' => $organization->id,
                'reviewer_id' => $admin->id,
                'conclusion' => $enumConclusion->value,
                'reason' => $trimmedReason,
                'created_at' => Carbon::now(),
            ]);

            $this->auditRecorder->record(
                operation: 'recruiter_organization.reviewed',
                auditable: $organization,
                actor: $admin,
                institution: null,
                before: [
                    'status' => $organization->getOriginal('status'),
                ],
                after: [
                    'status' => $newStatus->value,
                    'conclusion' => $enumConclusion->value,
                ],
                reason: $trimmedReason,
            );

            return $review;
        });
    }
}
