<?php

declare(strict_types=1);

namespace App\Enums;

enum RecommendationFeedbackType: string
{
    case Hidden = 'hidden';
    case NotRelevant = 'not_relevant';
    case ProfileFix = 'profile_fix';

    public function auditOperation(): string
    {
        return 'recommendation.'.$this->value;
    }
}
