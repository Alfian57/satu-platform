<?php

namespace App\Enums;

enum InclusionReviewConclusion: string
{
    case Acknowledged = 'acknowledged';
    case Dismissed = 'dismissed';
    case OutreachRecorded = 'outreach_recorded';
}
