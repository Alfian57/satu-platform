<?php

namespace App\Enums;

enum RecruiterVerificationConclusion: string
{
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Suspended = 'suspended';
    case Unsuspend = 'unsuspend';
}
