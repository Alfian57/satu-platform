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
            self::SelfReported => 'Lapor mandiri',
            self::TeamConfirmed => 'Dikonfirmasi tim',
            self::InstitutionVerified => 'Terverifikasi institusi',
        };
    }
}
