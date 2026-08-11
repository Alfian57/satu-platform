<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Open = 'open';
    case Forming = 'forming';
    case Full = 'full';
    case Closed = 'closed';
    case Cancelled = 'cancelled';

    public function acceptsMembers(): bool
    {
        return in_array($this, [
            self::Open,
            self::Forming,
        ], true);
    }

    public function isActive(): bool
    {
        return in_array($this, [
            self::Open,
            self::Forming,
            self::Full,
        ], true);
    }

    public function canTransitionTo(self $target): bool
    {
        if ($this === $target) {
            return true;
        }

        return match ($this) {
            self::Open => in_array($target, [
                self::Forming,
                self::Full,
                self::Closed,
                self::Cancelled,
            ], true),
            self::Forming => in_array($target, [
                self::Open,
                self::Full,
                self::Closed,
                self::Cancelled,
            ], true),
            self::Full => in_array($target, [
                self::Forming,
                self::Closed,
                self::Cancelled,
            ], true),
            self::Closed, self::Cancelled => false,
        };
    }
}
