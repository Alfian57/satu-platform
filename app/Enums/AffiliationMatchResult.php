<?php

namespace App\Enums;

enum AffiliationMatchResult: string
{
    case Exact = 'exact';
    case NoMatch = 'no_match';
    case Ambiguous = 'ambiguous';
    case Inactive = 'inactive';
    case RosterUnavailable = 'roster_unavailable';
    case StaleRoster = 'stale_roster';
}
