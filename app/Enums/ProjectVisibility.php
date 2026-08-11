<?php

namespace App\Enums;

enum ProjectVisibility: string
{
    case Private = 'private';
    case Institution = 'institution';
    case Public = 'public';
}
