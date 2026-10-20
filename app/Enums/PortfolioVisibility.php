<?php

namespace App\Enums;

enum PortfolioVisibility: string
{
    case Private = 'private';
    case Institution = 'institution';
    case Recruiter = 'recruiter';
    case Public = 'public';

    public function isSelectable(): bool
    {
        return $this === self::Private || $this === self::Public;
    }

    public function effective(): self
    {
        return $this === self::Public ? self::Public : self::Private;
    }
}
