<?php

namespace App\Enums;

enum InstitutionMembershipVerificationMethod: string
{
    case ApprovedDomain = 'approved_domain';
    case CampusAdminReview = 'campus_admin_review';
}
