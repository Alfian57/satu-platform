<?php

namespace App\Enums;

enum InstitutionMembershipVerificationMethod: string
{
    case ApprovedDomain = 'approved_domain';
    case RosterExactMatch = 'roster_exact_match';
    case CampusAdminReview = 'campus_admin_review';
}
