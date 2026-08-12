<?php

declare(strict_types=1);

namespace App\Enums;

enum MatchingDimension: string
{
    case SkillFit = 'skill_fit';
    case ProjectNeed = 'project_need';
    case Availability = 'availability';
    case ConnectivityOpportunity = 'connectivity_opportunity';

    public function label(): string
    {
        return match ($this) {
            self::SkillFit => 'Kecocokan skill',
            self::ProjectNeed => 'Cakupan kebutuhan project',
            self::Availability => 'Ketersediaan waktu',
            self::ConnectivityOpportunity => 'Peluang koneksi',
        };
    }
}
