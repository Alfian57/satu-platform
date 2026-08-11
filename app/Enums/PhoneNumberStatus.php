<?php

namespace App\Enums;

enum PhoneNumberStatus: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Revoked = 'revoked';
}
