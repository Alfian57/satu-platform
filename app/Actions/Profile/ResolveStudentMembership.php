<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\InstitutionMembershipRole;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ResolveStudentMembership
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity) {}

    public function handle(User $user, ?int $institutionId = null): ?InstitutionMembership
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            return null;
        }

        try {
            $university = $this->resolveUniversity->handle();
        } catch (InvalidUniversityConfiguration) {
            return null;
        }

        if ($institutionId !== null && $institutionId !== $university->getKey()) {
            return null;
        }

        return InstitutionMembership::query()
            ->with('institution:id,name,status,timezone')
            ->whereBelongsTo($user)
            ->forInstitution($university)
            ->where('role', InstitutionMembershipRole::Student)
            ->when(DB::transactionLevel() > 0, fn ($query) => $query->sharedLock())
            ->first();
    }
}
