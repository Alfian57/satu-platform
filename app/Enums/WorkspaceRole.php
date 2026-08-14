<?php

namespace App\Enums;

enum WorkspaceRole: string
{
    case PlatformAdmin = 'platform_admin';
    case CampusAdmin = 'campus_admin';
    case Recruiter = 'recruiter';
    case Student = 'student';
}
