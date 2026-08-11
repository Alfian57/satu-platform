<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

final class ArchiveProject
{
    public function __construct(
        private readonly TransitionProjectStatus $transition,
    ) {}

    public function handle(
        User $actor,
        Project $project,
        ?string $reason = null,
        ?string $expectedUpdatedAt = null,
    ): Project {
        Gate::forUser($actor)->authorize('archive', $project);

        return $this->transition->handle(
            actor: $actor,
            project: $project,
            targetStatus: ProjectStatus::Archived,
            reason: $reason,
            operation: 'project.archived',
            expectedUpdatedAt: $expectedUpdatedAt,
        );
    }
}
