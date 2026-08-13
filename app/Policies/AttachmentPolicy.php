<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\AttachmentPurpose;
use App\Enums\InstitutionMembershipRole;
use App\Enums\ProjectStatus;
use App\Enums\TeamMembershipStatus;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Attachment\AttachmentStorage;

final class AttachmentPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
        private readonly AttachmentStorage $storage,
    ) {}

    public function viewAny(User $user, Project $project): bool
    {
        return $this->canAccessProject($user, $project)
            || $this->canReviewEvidence($user, $project);
    }

    public function view(User $user, Attachment $attachment): bool
    {
        $project = $this->projectFor($attachment);

        return $project !== null
            && $this->storage->isManagedPath($attachment)
            && (
                $this->canAccessProject($user, $project)
                || $this->canReviewEvidence($user, $project, $attachment)
            );
    }

    public function create(User $user, Project $project): bool
    {
        return $this->canAccessProject($user, $project);
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        $project = $this->projectFor($attachment);

        return $project !== null
            && $this->storage->isManagedPath($attachment)
            && $this->canAccessProject($user, $project)
            && (
                $attachment->uploaded_by_id === $user->getKey()
                || $project->owner_id === $user->getKey()
            );
    }

    private function projectFor(Attachment $attachment): ?Project
    {
        if (
            ! $attachment->exists
            || $attachment->trashed()
            || $attachment->isDirty([
                $attachment->getKeyName(),
                'project_id',
                'message_id',
                'uploaded_by_id',
                'disk',
                'path',
                'sha256',
            ])
        ) {
            return null;
        }

        return Project::query()->whereKey($attachment->project_id)->first();
    }

    private function canAccessProject(User $user, Project $project): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $project->exists
            || $project->isDirty([
                $project->getKeyName(),
                'institution_id',
                'owner_id',
            ])
            || ! in_array($project->status, [
                ProjectStatus::Open,
                ProjectStatus::Forming,
                ProjectStatus::Full,
            ], true)
            || $this->institutionContextResolver->resolve(
                $user,
                $project,
                [InstitutionMembershipRole::Student],
            ) === null
        ) {
            return false;
        }

        return $project->owner_id === $user->getKey()
            || TeamMembership::query()
                ->where('project_id', $project->getKey())
                ->where('user_id', $user->getKey())
                ->where('status', TeamMembershipStatus::Active)
                ->exists();
    }

    private function canReviewEvidence(
        User $user,
        Project $project,
        ?Attachment $attachment = null,
    ): bool {
        if (
            $attachment !== null
            && $attachment->purpose !== AttachmentPurpose::Evidence
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $project,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
