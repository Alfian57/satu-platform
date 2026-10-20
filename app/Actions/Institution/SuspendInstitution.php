<?php

namespace App\Actions\Institution;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

final class SuspendInstitution
{
    public function handle(User $actor, Institution $institution, string $reason): void
    {
        throw new AuthorizationException('Status universitas ditentukan melalui operasi deployment berotorisasi, bukan operasi lintas institusi.');
    }
}
