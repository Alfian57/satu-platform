<?php

namespace App\Enums;

enum WorkspaceRole: string
{
    case CampusAdmin = 'campus_admin';
    case Student = 'student';
}
