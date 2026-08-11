<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

final class OpenProject
{
    public function __construct(
        private readonly TransitionProjectStatus $transition,
    ) {}

    public function handle(
        User $actor,
        Project $project,
        ?int $occupiedCapacity = null,
        ?string $reason = null,
        ?string $expectedUpdatedAt = null,
    ): Project {
        Gate::forUser($actor)->authorize('open', $project);

        return $this->transition->handle(
            actor: $actor,
            project: $project,
            targetStatus: ProjectStatus::Open,
            occupiedCapacity: $occupiedCapacity,
            reason: $reason,
            operation: 'project.opened',
            expectedUpdatedAt: $expectedUpdatedAt,
        );
    }
}
