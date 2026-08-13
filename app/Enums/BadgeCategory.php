<?php

namespace App\Enums;

enum BadgeCategory: string
{
    case Contribution = 'contribution';
    case Skill = 'skill';
    case Collaboration = 'collaboration';
    case CampusRecognition = 'campus_recognition';
}
