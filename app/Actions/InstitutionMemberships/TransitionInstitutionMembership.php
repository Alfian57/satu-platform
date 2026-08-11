<?php

namespace App\Actions\InstitutionMemberships;

use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Exceptions\InvalidInstitutionMembershipTransition;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TransitionInstitutionMembership
{
    public function handle(
        InstitutionMembership $membership,
        InstitutionMembershipStatus $targetStatus,
        ?InstitutionMembershipVerificationMethod $verificationMethod = null,
        ?User $reviewer = null,
    ): InstitutionMembership {
        return DB::transaction(function () use (
            $membership,
            $targetStatus,
            $verificationMethod,
            $reviewer,
        ): InstitutionMembership {
            $lockedMembership = InstitutionMembership::query()
                ->lockForUpdate()
                ->whereKey($membership->getKey())
                ->firstOrFail();

            if (! $this->isAllowed($lockedMembership->status, $targetStatus)) {
                throw new InvalidInstitutionMembershipTransition(
                    "Institution membership cannot transition from {$lockedMembership->status->value} to {$targetStatus->value}.",
                );
            }

            $lockedMembership->forceFill($this->attributesForTransition(
                $lockedMembership,
                $targetStatus,
                $verificationMethod,
                $reviewer,
            ))->save();

            return $lockedMembership->refresh();
        }, attempts: 3);
    }

    private function isAllowed(
        InstitutionMembershipStatus $currentStatus,
        InstitutionMembershipStatus $targetStatus,
    ): bool {
        return match ($currentStatus) {
            InstitutionMembershipStatus::Unverified => in_array(
                $targetStatus,
                [InstitutionMembershipStatus::Pending, InstitutionMembershipStatus::Verified],
                true,
            ),
            InstitutionMembershipStatus::Pending => in_array(
                $targetStatus,
                [InstitutionMembershipStatus::Verified, InstitutionMembershipStatus::Unverified],
                true,
            ),
            InstitutionMembershipStatus::Verified => $targetStatus === InstitutionMembershipStatus::Suspended,
            InstitutionMembershipStatus::Suspended => $targetStatus === InstitutionMembershipStatus::Verified,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesForTransition(
        InstitutionMembership $membership,
        InstitutionMembershipStatus $targetStatus,
        ?InstitutionMembershipVerificationMethod $verificationMethod,
        ?User $reviewer,
    ): array {
        if ($targetStatus === InstitutionMembershipStatus::Pending) {
            $this->rejectUnexpectedVerificationContext($verificationMethod, $reviewer);

            return [
                'status' => $targetStatus,
                'requested_at' => now(),
                'reviewed_at' => null,
                'reviewed_by_id' => null,
                'verified_at' => null,
                'verification_method' => null,
                'last_review_outcome' => null,
            ];
        }

        if ($targetStatus === InstitutionMembershipStatus::Unverified) {
            if ($reviewer === null || $verificationMethod !== null) {
                throw new InvalidInstitutionMembershipTransition(
                    'Rejecting a membership requires a reviewer and no verification method.',
                );
            }

            return [
                'status' => $targetStatus,
                'reviewed_at' => now(),
                'reviewed_by_id' => $reviewer->getKey(),
                'verified_at' => null,
                'verification_method' => null,
                'last_review_outcome' => InstitutionMembershipReviewOutcome::Rejected,
            ];
        }

        if ($targetStatus === InstitutionMembershipStatus::Suspended) {
            $this->rejectUnexpectedVerificationContext($verificationMethod, $reviewer);
            $this->ensureExistingVerificationProvenance($membership);

            return ['status' => $targetStatus];
        }

        if ($membership->status === InstitutionMembershipStatus::Suspended) {
            $this->rejectUnexpectedVerificationContext($verificationMethod, $reviewer);
            $this->ensureExistingVerificationProvenance($membership);

            return ['status' => $targetStatus];
        }

        if ($verificationMethod === null) {
            throw new InvalidInstitutionMembershipTransition(
                'Verifying a membership requires a verification method.',
            );
        }

        if (
            in_array($verificationMethod, [
                InstitutionMembershipVerificationMethod::ApprovedDomain,
                InstitutionMembershipVerificationMethod::RosterExactMatch,
            ], true)
            && $reviewer !== null
        ) {
            throw new InvalidInstitutionMembershipTransition(
                'Automatic verification cannot include a campus reviewer.',
            );
        }

        if (
            $verificationMethod === InstitutionMembershipVerificationMethod::CampusAdminReview
            && $reviewer === null
        ) {
            throw new InvalidInstitutionMembershipTransition(
                'Campus-admin verification requires a reviewer.',
            );
        }

        return [
            'status' => $targetStatus,
            'requested_at' => $membership->requested_at ?? now(),
            'reviewed_at' => $reviewer === null ? null : now(),
            'reviewed_by_id' => $reviewer?->getKey(),
            'verified_at' => now(),
            'verification_method' => $verificationMethod,
            'last_review_outcome' => $reviewer === null
                ? null
                : InstitutionMembershipReviewOutcome::Approved,
        ];
    }

    private function rejectUnexpectedVerificationContext(
        ?InstitutionMembershipVerificationMethod $verificationMethod,
        ?User $reviewer,
    ): void {
        if ($verificationMethod !== null || $reviewer !== null) {
            throw new InvalidInstitutionMembershipTransition(
                'This transition does not accept verification context.',
            );
        }
    }

    private function ensureExistingVerificationProvenance(
        InstitutionMembership $membership,
    ): void {
        if ($membership->verification_method === null || $membership->verified_at === null) {
            throw new InvalidInstitutionMembershipTransition(
                'Suspension lifecycle requires existing verification provenance.',
            );
        }
    }
}
