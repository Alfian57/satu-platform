<?php

declare(strict_types=1);

namespace App\Events;

final class WorkspaceDiscussionChanged extends WorkspaceDelta
{
    public function broadcastAs(): string
    {
        return 'workspace.discussion.changed';
    }

    protected function resourceName(): string
    {
        return 'discussion';
    }
}
