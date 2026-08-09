<?php

namespace App\Enums;

enum RecruiterMembershipStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
}
