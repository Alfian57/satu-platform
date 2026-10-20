<?php

declare(strict_types=1);

namespace App\Events;

final class WorkspaceAttachmentChanged extends WorkspaceDelta
{
    public function broadcastAs(): string
    {
        return 'workspace.attachment.changed';
    }

    protected function resourceName(): string
    {
        return 'attachment';
    }
}
