<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BadgeRuleVersion;
use App\Models\User;

final class BadgeRuleVersionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->exists && $user->canAdministerAdvancedModule('gamification');
    }

    public function view(User $user, BadgeRuleVersion $version): bool
    {
        return $user->exists && $user->canAdministerAdvancedModule('gamification') && $version->exists;
    }

    public function create(User $user): bool
    {
        return $user->exists && $user->canAdministerAdvancedModule('gamification');
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
