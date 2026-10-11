<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class ResolveStudentMembership
{
    public function handle(User $user, ?int $institutionId = null): ?InstitutionMembership
    {
        return InstitutionMembership::query()
            ->with('institution:id,name,status,timezone')
            ->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::Student)
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->when($institutionId !== null, fn (Builder $query): Builder => $query->where('institution_id', $institutionId))
            ->orderByRaw('CASE WHEN status = ? THEN 0 WHEN status = ? THEN 1 ELSE 2 END', [
                InstitutionMembershipStatus::Verified->value,
                InstitutionMembershipStatus::Pending->value,
            ])
            ->latest('requested_at')->latest('id')->first();
    }
}
