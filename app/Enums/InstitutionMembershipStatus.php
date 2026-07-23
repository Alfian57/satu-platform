<?php

namespace App\Enums;

enum InstitutionMembershipStatus: string
{
    case Unverified = 'unverified';
    case Pending = 'pending';
    case Verified = 'verified';
    case Suspended = 'suspended';
}
