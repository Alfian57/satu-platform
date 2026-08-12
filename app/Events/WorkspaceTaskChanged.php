<?php

declare(strict_types=1);

namespace App\Events;

final class WorkspaceTaskChanged extends WorkspaceDelta
{
    public function broadcastAs(): string
    {
        return 'workspace.task.changed';
    }

    protected function resourceName(): string
    {
        return 'task';
    }
}
