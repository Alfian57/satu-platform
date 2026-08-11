<?php

namespace App\Enums;

enum PortfolioVisibility: string
{
    case Private = 'private';
    case Institution = 'institution';
    case Recruiter = 'recruiter';
    case Public = 'public';
}
