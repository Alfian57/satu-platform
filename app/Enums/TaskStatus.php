<?php

declare(strict_types=1);

namespace App\Enums;

enum TaskStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case Blocked = 'blocked';
    case Done = 'done';

    public function canTransitionTo(self $target): bool
    {
        if ($this === $target) {
            return true;
        }

        return match ($this) {
            self::Todo => in_array($target, [
                self::InProgress,
                self::Blocked,
                self::Done,
            ], true),
            self::InProgress => in_array($target, [
                self::Todo,
                self::Blocked,
                self::Done,
            ], true),
            self::Blocked => in_array($target, [
                self::Todo,
                self::InProgress,
            ], true),
            self::Done => in_array($target, [
                self::Todo,
                self::InProgress,
            ], true),
        };
    }

    public function isComplete(): bool
    {
        return $this === self::Done;
    }
}
