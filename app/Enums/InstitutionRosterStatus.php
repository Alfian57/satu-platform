<?php

namespace App\Enums;

enum InstitutionRosterStatus: string
{
    case Active = 'active';
    case Superseded = 'superseded';
}
