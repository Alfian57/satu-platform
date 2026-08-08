<?php

namespace App\Enums;

enum CollaborationEventType: string
{
    case TeamJoined = 'team_joined';
    case TaskCompleted = 'task_completed';
    case ProjectContributed = 'project_contributed';
    case PeerReviewed = 'peer_reviewed';
}
