<?php

namespace App\Enums;

enum ContributionStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Revision = 'revision';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Archived = 'archived';

    public function canTransitionTo(self $target): bool
    {
        if ($this === $target) {
            return true;
        }

        return match ($this) {
            self::Draft => in_array($target, [self::Pending, self::Archived], true),
            self::Pending => in_array($target, [self::Revision, self::Approved, self::Rejected], true),
            self::Revision => in_array($target, [self::Draft, self::Archived], true),
            self::Approved => $target === self::Archived,
            self::Rejected => false,
            self::Archived => false,
        };
    }

    public function canCreateVersion(): bool
    {
        return in_array($this, [self::Draft, self::Revision], true);
    }
}
