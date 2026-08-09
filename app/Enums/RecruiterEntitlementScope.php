<?php

declare(strict_types=1);

namespace App\Enums;

enum RecruiterEntitlementScope: string
{
    case CandidateSearch = 'candidate_search';
    case CandidateContact = 'candidate_contact';
    case JobPosting = 'job_posting';
    case FullSuite = 'full_suite';
}
