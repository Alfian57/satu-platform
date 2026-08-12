<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\TeamInvitationStatus;
use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\User;

final class TeamInvitationPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, TeamInvitation $invitation): bool
    {
        return $this->sameTenantStudent($user, $invitation->project)
            && in_array($user->getKey(), [$invitation->inviter_id, $invitation->invitee_id], true);
    }

    public function accept(User $user, TeamInvitation $invitation): bool
    {
        return $invitation->status === TeamInvitationStatus::Pending
            && $invitation->invitee_id === $user->getKey()
            && $this->sameTenantStudent($user, $invitation->project);
    }

    public function reject(User $user, TeamInvitation $invitation): bool
    {
        return $this->accept($user, $invitation);
    }

    public function revoke(User $user, TeamInvitation $invitation): bool
    {
        return $invitation->status === TeamInvitationStatus::Pending
            && $this->isProjectOwner($user, $invitation->project);
    }

    private function isProjectOwner(User $user, Project $project): bool
    {
        return $project->owner_id === $user->getKey()
            && $this->sameTenantStudent($user, $project);
    }

    private function sameTenantStudent(User $user, Project $project): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $project,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }
}
