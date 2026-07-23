<?php

namespace App\Enums;

enum InstitutionMembershipReviewOutcome: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
}
