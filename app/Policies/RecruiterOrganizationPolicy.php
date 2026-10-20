<?php

namespace App\Policies;

use App\Models\RecruiterOrganization;
use App\Models\User;

final class RecruiterOrganizationPolicy
{
    /**
     * Determine whether the user can view the organization.
     */
    public function view(User $user, RecruiterOrganization $organization): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the organization details.
     */
    public function update(User $user, RecruiterOrganization $organization): bool
    {
        return false;
    }

    /**
     * Role perekrut dihapus. Konfigurasi lama tidak memulihkan kewenangan.
     */
    public function review(User $user, RecruiterOrganization $organization): bool
    {
        return false;
    }
}
