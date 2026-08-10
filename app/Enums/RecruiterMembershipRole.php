<?php

namespace App\Enums;

enum RecruiterMembershipRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Recruiter = 'recruiter';
}
