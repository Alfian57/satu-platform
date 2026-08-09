<?php

declare(strict_types=1);

namespace App\Enums;

enum RecruiterEntitlementStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Expired = 'expired';
    case Revoked = 'revoked';
}
