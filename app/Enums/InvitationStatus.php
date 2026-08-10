<?php

namespace App\Enums;

enum InvitationStatus: string
{
    case Issued = 'issued';
    case Accepted = 'accepted';
    case Expired = 'expired';
    case Revoked = 'revoked';
}
