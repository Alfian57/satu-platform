<?php

namespace App\Actions\Auth;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Enums\WorkspaceRole;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\RecruiterMembership;
use App\Models\User;
use App\Support\Auth\UserWorkspace;

final class ResolveUserWorkspace
{
    public function handle(
        User $user,
        ?Institution $requestedInstitution = null,
        ?WorkspaceRole $requestedWorkspace = null,
    ): UserWorkspace {
        if ($user->is_platform_admin) {
            return new UserWorkspace(WorkspaceRole::PlatformAdmin);
        }

        if ($requestedWorkspace === WorkspaceRole::Recruiter) {
            $recruiterWorkspace = $this->recruiterWorkspace($user);

            if ($recruiterWorkspace !== null) {
                return $recruiterWorkspace;
            }
        }

        $campusWorkspace = $this->campusWorkspace($user, $requestedInstitution);

        if ($campusWorkspace !== null) {
            return $campusWorkspace;
        }

        if ($requestedWorkspace === WorkspaceRole::Recruiter) {
            return new UserWorkspace(WorkspaceRole::Student);
        }

        $recruiterWorkspace = $this->recruiterWorkspace($user);

        return $recruiterWorkspace ?? new UserWorkspace(WorkspaceRole::Student);
    }

    private function campusWorkspace(
        User $user,
        ?Institution $requestedInstitution,
    ): ?UserWorkspace {
        $campusMembershipQuery = InstitutionMembership::query()
            ->select(['id', 'institution_id', 'user_id', 'verified_at'])
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::CampusAdmin)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->whereRelation('institution', 'status', InstitutionStatus::Active);

        if ($requestedInstitution !== null) {
            $campusMembershipQuery->whereBelongsTo($requestedInstitution);
        }

        $campusMembership = $campusMembershipQuery
            ->latest('verified_at')
            ->latest('id')
            ->first();

        if ($campusMembership?->institution !== null) {
            return new UserWorkspace(
                role: WorkspaceRole::CampusAdmin,
                institutionId: $campusMembership->institution->getKey(),
                institutionName: $campusMembership->institution->name,
            );
        }

        return null;
    }

    private function recruiterWorkspace(User $user): ?UserWorkspace
    {
        $recruiterMembership = RecruiterMembership::query()
            ->select(['id', 'recruiter_organization_id', 'user_id'])
            ->with('organization:id,name,status')
            ->whereBelongsTo($user)
            ->where('status', RecruiterMembershipStatus::Active)
            ->whereRelation('organization', 'status', RecruiterOrganizationStatus::Verified)
            ->latest('id')
            ->first();

        if ($recruiterMembership?->organization !== null) {
            return new UserWorkspace(
                role: WorkspaceRole::Recruiter,
                recruiterOrganizationId: $recruiterMembership->organization->getKey(),
                recruiterOrganizationName: $recruiterMembership->organization->name,
            );
        }

        return null;
    }
}
