<?php

declare(strict_types=1);

namespace App\Enums;

enum CreditMappingStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Retired = 'retired';
}
