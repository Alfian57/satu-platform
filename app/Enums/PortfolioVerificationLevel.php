<?php

namespace App\Enums;

enum PortfolioVerificationLevel: string
{
    case SelfReported = 'self_reported';
    case TeamConfirmed = 'team_confirmed';
    case InstitutionVerified = 'institution_verified';

    public function label(): string
    {
        return match ($this) {
            self::SelfReported => 'Self-reported',
            self::TeamConfirmed => 'Team-confirmed',
            self::InstitutionVerified => 'Institution-verified',
        };
    }
}
