<?php

namespace App\Actions\Institution;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

final class ApproveInstitution
{
    public function handle(User $actor, Institution $institution, string $reason): void
    {
        throw new AuthorizationException('Persetujuan institusi baru tidak tersedia pada deployment satu universitas.');
    }
}
