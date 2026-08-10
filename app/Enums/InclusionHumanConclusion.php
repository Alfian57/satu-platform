<?php

declare(strict_types=1);

namespace App\Enums;

enum InclusionHumanConclusion: string
{
    case Acknowledged = 'acknowledged';
    case Dismissed = 'dismissed';
    case OutreachScheduled = 'outreach_scheduled';
}
