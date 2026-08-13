<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BadgeDefinition;
use App\Models\User;

final class BadgeDefinitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->exists;
    }

    public function view(User $user, BadgeDefinition $definition): bool
    {
        return $user->exists && $definition->exists;
    }

    public function create(User $user): bool
    {
        return $user->exists && $user->is_platform_admin;
    }

    public function update(User $user, BadgeDefinition $definition): bool
    {
        return false;
    }

    public function delete(User $user, BadgeDefinition $definition): bool
    {
        return false;
    }

    public function restore(User $user, BadgeDefinition $definition): bool
    {
        return false;
    }

    public function forceDelete(User $user, BadgeDefinition $definition): bool
    {
        return false;
    }
}
