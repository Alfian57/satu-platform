<?php

namespace App\Actions\Auth;

use App\Enums\WorkspaceRole;
use App\Models\Institution;
use App\Models\User;
use App\Support\Auth\UserWorkspace;

final class ResolveUserWorkspace
{
    public function handle(
        User $user,
        ?Institution $requestedInstitution = null,
    ): UserWorkspace {
        $campusWorkspace = $this->campusWorkspace($user, $requestedInstitution);

        if ($campusWorkspace !== null) {
            return $campusWorkspace;
        }

        return new UserWorkspace(WorkspaceRole::Student);
    }

    private function campusWorkspace(
        User $user,
        ?Institution $requestedInstitution,
    ): ?UserWorkspace {
        $campusMembership = $user->universityAdminMembership($requestedInstitution);
        $campusMembership?->load('institution:id,name,status');

        if ($campusMembership?->institution !== null) {
            return new UserWorkspace(
                role: WorkspaceRole::CampusAdmin,
                institutionId: $campusMembership->institution->getKey(),
                institutionName: $campusMembership->institution->name,
            );
        }

        return null;
    }
}
