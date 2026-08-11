<?php

namespace App\Enums;

enum AffiliationRequestStatus: string
{
    case PendingReview = 'pending_review';
    case Verified = 'verified';
    case RevisionRequired = 'revision_required';
    case Rejected = 'rejected';
}
