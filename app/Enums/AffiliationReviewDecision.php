<?php

namespace App\Enums;

enum AffiliationReviewDecision: string
{
    case Approve = 'approve';
    case RequestRevision = 'request_revision';
    case Reject = 'reject';
}
