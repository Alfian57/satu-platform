<?php

namespace App\Actions\InstitutionMemberships;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Events\InstitutionMembershipReviewed;
use App\Exceptions\InvalidInstitutionMembershipTransition;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

final class ApproveInstitutionMembership
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly TransitionInstitutionMembership $transition,
    ) {}

    public function handle(
        InstitutionMembership $membership,
        User $reviewer,
        string $reason,
    ): InstitutionMembership {
        $reason = $this->validatedReason($reason);

        return DB::transaction(function () use ($membership, $reviewer, $reason): InstitutionMembership {
            $lockedMembership = InstitutionMembership::query()
                ->lockForUpdate()
                ->whereKey($membership->getKey())
                ->firstOrFail();
            $institution = Institution::query()
                ->whereKey($lockedMembership->institution_id)
                ->firstOrFail();

            Gate::forUser($reviewer)->authorize('approve', $lockedMembership);

            if ($lockedMembership->status !== InstitutionMembershipStatus::Pending) {
                throw new InvalidInstitutionMembershipTransition(
                    'Only pending institution memberships may be approved.',
                );
            }

            $before = [
                'membership_id' => $lockedMembership->getKey(),
                'status' => $lockedMembership->status->value,
                'verification_method' => $lockedMembership->verification_method?->value,
            ];

            $lockedMembership = $this->transition->handle(
                $lockedMembership,
                InstitutionMembershipStatus::Verified,
                InstitutionMembershipVerificationMethod::CampusAdminReview,
                $reviewer,
            );

            $this->audit->record(
                operation: 'institution_membership.reviewed',
                auditable: $lockedMembership,
                actor: $reviewer,
                institution: $institution,
                before: $before,
                after: [
                    'membership_id' => $lockedMembership->getKey(),
                    'status' => $lockedMembership->status->value,
                    'reviewed_by_id' => $reviewer->getKey(),
                    'verification_method' => $lockedMembership->verification_method?->value,
                    'last_review_outcome' => $lockedMembership->last_review_outcome?->value,
                ],
                reason: $reason,
            );

            InstitutionMembershipReviewed::dispatch(
                $lockedMembership->getKey(),
                $institution->getKey(),
                InstitutionMembershipReviewOutcome::Approved,
                $lockedMembership->status,
            );

            return $lockedMembership;
        }, attempts: 3);
    }

    private function validatedReason(string $reason): string
    {
        $reason = (string) Str::of($reason)->squish();

        if ($reason === '') {
            throw new \InvalidArgumentException('A review reason is required.');
        }

        if (Str::length($reason) > 1000) {
            throw new \InvalidArgumentException('A review reason may not exceed 1000 characters.');
        }

        return $reason;
    }
}
