<?php

namespace App\Actions\Institution;

use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

final class SuspendInstitution
{
    public function handle(User $actor, Institution $institution, string $reason): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can suspend institutions.');
        }

        if ($institution->status !== InstitutionStatus::Active) {
            return;
        }

        $institution->update(['status' => InstitutionStatus::Suspended]);
    }
}
