<?php

namespace App\Enums;

enum TeamMembershipStatus: string
{
    case Active = 'active';
    case Left = 'left';
    case Removed = 'removed';
}
