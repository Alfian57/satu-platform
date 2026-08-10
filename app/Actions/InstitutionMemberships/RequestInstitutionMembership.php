<?php

namespace App\Actions\InstitutionMemberships;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Events\InstitutionMembershipRequested;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final class RequestInstitutionMembership
{
    public function __construct(
        private readonly TransitionInstitutionMembership $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $user, Institution $institution): InstitutionMembership
    {
        return DB::transaction(function () use ($user, $institution): InstitutionMembership {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->whereKey($user->getKey())
                ->firstOrFail();
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->firstOrFail();

            if ($lockedInstitution->status !== InstitutionStatus::Active) {
                throw new AuthorizationException('This institution is not accepting affiliation requests.');
            }

            $membership = InstitutionMembership::query()
                ->whereBelongsTo($lockedUser, 'user')
                ->whereBelongsTo($lockedInstitution, 'institution')
                ->where('role', InstitutionMembershipRole::Student)
                ->lockForUpdate()
                ->first();

            if ($membership !== null) {
                if ($membership->status === InstitutionMembershipStatus::Suspended) {
                    throw new AuthorizationException('This affiliation cannot be requested again.');
                }

                if ($membership->status === InstitutionMembershipStatus::Verified) {
                    return $membership;
                }

                if ($membership->status === InstitutionMembershipStatus::Pending) {
                    return $membership;
                }
            } else {
                $membership = $this->createMembershipSafely($lockedUser, $lockedInstitution);
            }

            $beforeStatus = $membership->status;
            $targetStatus = InstitutionMembershipStatus::Pending;

            $membership = $this->transition->handle(
                $membership,
                $targetStatus,
            );

            $this->audit->record(
                operation: 'institution_membership.requested',
                auditable: $membership,
                actor: $lockedUser,
                institution: $lockedInstitution,
                before: [
                    'membership_id' => $membership->getKey(),
                    'status' => $beforeStatus->value,
                ],
                after: [
                    'membership_id' => $membership->getKey(),
                    'status' => $membership->status->value,
                ],
            );

            InstitutionMembershipRequested::dispatch(
                $membership->getKey(),
                $lockedUser->getKey(),
                $lockedInstitution->getKey(),
                $membership->status,
            );

            return $membership;
        }, attempts: 3);
    }

    private function createMembershipSafely(User $user, Institution $institution): InstitutionMembership
    {
        try {
            return InstitutionMembership::query()->forceCreate([
                'user_id' => $user->getKey(),
                'institution_id' => $institution->getKey(),
                'role' => InstitutionMembershipRole::Student,
                'status' => InstitutionMembershipStatus::Unverified,
            ]);
        } catch (QueryException $exception) {
            $existing = InstitutionMembership::query()
                ->whereBelongsTo($user, 'user')
                ->whereBelongsTo($institution, 'institution')
                ->where('role', InstitutionMembershipRole::Student)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            throw $exception;
        }
    }
}
