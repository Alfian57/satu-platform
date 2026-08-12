<?php

namespace App\Enums;

enum TeamMembershipEventType: string
{
    case Joined = 'joined';
    case Rejoined = 'rejoined';
    case Left = 'left';
    case Removed = 'removed';
}
