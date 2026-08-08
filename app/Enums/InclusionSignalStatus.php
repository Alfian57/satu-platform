<?php

namespace App\Enums;

enum InclusionSignalStatus: string
{
    case New = 'new';
    case Acknowledged = 'acknowledged';
    case Dismissed = 'dismissed';
    case OutreachRecorded = 'outreach_recorded';
    case Expired = 'expired';
}
