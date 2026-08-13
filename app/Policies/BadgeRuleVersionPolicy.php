<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BadgeRuleVersion;
use App\Models\User;

final class BadgeRuleVersionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->exists && $user->is_platform_admin;
    }

    public function view(User $user, BadgeRuleVersion $version): bool
    {
        return $user->exists && $user->is_platform_admin && $version->exists;
    }

    public function create(User $user): bool
    {
        return $user->exists && $user->is_platform_admin;
    }

    public function update(User $user, BadgeRuleVersion $version): bool
    {
        return false;
    }

    public function delete(User $user, BadgeRuleVersion $version): bool
    {
        return false;
    }

    public function restore(User $user, BadgeRuleVersion $version): bool
    {
        return false;
    }

    public function forceDelete(User $user, BadgeRuleVersion $version): bool
    {
        return false;
    }
}
