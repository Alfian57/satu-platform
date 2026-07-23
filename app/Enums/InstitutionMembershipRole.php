<?php

namespace App\Enums;

enum InstitutionMembershipRole: string
{
    case Student = 'student';
    case CampusAdmin = 'campus_admin';
}
