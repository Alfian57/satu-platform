<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\MatchScoreVersion;
use App\Models\User;

final class MatchScoreVersionPolicy
{
    public function create(User $user): bool
    {
        return $user->exists && $user->is_platform_admin;
    }

    public function view(User $user, MatchScoreVersion $version): bool
    {
        return $this->create($user) && $version->exists;
    }
}
