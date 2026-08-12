<?php

declare(strict_types=1);

namespace App\Enums;

enum TaskPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Urgent = 'urgent';

    public function sortWeight(): int
    {
        return match ($this) {
            self::Urgent => 0,
            self::High => 1,
            self::Medium => 2,
            self::Low => 3,
        };
    }
}
