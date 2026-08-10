<?php

namespace App\Actions\Institution;

use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

final class ApproveInstitution
{
    public function handle(User $actor, Institution $institution): void
    {
        if (! $actor->is_platform_admin) {
            throw new AuthorizationException('Only platform admins can approve institutions.');
        }

        if ($institution->status !== InstitutionStatus::Pending) {
            return;
        }

        DB::transaction(function () use ($institution) {
            $institution->update(['status' => InstitutionStatus::Active]);
        });
    }
}
