<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use InvalidArgumentException;

final class InviteRecruiterMember
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Invite a member to a recruiter organization.
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $actor,
        RecruiterOrganization $organization,
        User $invitee,
        RecruiterMembershipRole|string $role = RecruiterMembershipRole::Recruiter,
    ): RecruiterMembership {
        $enumRole = $role instanceof RecruiterMembershipRole
            ? $role
            : RecruiterMembershipRole::tryFrom((string) $role)
                ?? throw new InvalidArgumentException("Invalid recruiter membership role: {$role}");

        if (! $actor->is_platform_admin) {
            $isOrgAdmin = $organization->memberships()
                ->where('user_id', $actor->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->whereIn('role', [RecruiterMembershipRole::Owner, RecruiterMembershipRole::Admin])
                ->exists();

            if (! $isOrgAdmin) {
                throw new AuthorizationException('You are not authorized to invite members to this organization.');
            }
        }

        if ($organization->status !== RecruiterOrganizationStatus::Verified) {
            throw new InvalidArgumentException('Only verified recruiter organizations can invite members.');
        }

        $existingMembership = $organization->memberships()
            ->where('user_id', $invitee->id)
            ->first();

        if ($existingMembership !== null) {
            throw new InvalidArgumentException('User is already a member of this recruiter organization.');
        }

        $membership = RecruiterMembership::query()->create([
            'recruiter_organization_id' => $organization->id,
            'user_id' => $invitee->id,
            'role' => $enumRole->value,
            'status' => RecruiterMembershipStatus::Pending->value,
        ]);

        $this->auditRecorder->record(
            operation: 'recruiter_membership.created',
            auditable: $organization,
            actor: $actor,
            institution: null,
            before: [],
            after: [
                'recruiter_membership_id' => $membership->id,
                'user_id' => $invitee->id,
                'role' => $enumRole->value,
            ],
            reason: "Invited {$invitee->name} as {$enumRole->value}.",
        );

        return $membership;
    }
}
