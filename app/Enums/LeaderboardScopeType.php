<?php

declare(strict_types=1);

namespace App\Enums;

enum LeaderboardScopeType: string
{
    case Program = 'program';
    case Team = 'team';
    case Individual = 'individual';
}
