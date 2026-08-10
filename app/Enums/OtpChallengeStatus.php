<?php

namespace App\Enums;

enum OtpChallengeStatus: string
{
    case Pending = 'pending';
    case Consumed = 'consumed';
    case Expired = 'expired';
    case Invalidated = 'invalidated';
    case Failed = 'failed';
}
