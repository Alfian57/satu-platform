<?php

namespace App\Policies;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class InstitutionContextResolver
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity) {}

    /**
     * Resolve an authorized context from a route-bound institution or owned resource.
     *
     * @param  list<InstitutionMembershipRole>  $allowedRoles
     */
    public function resolve(
        User $actor,
        Institution|InstitutionOwned|null $source,
        array $allowedRoles,
    ): ?InstitutionContext {
        if ($source === null || $allowedRoles === [] || ! $actor->exists || $actor->isDirty($actor->getKeyName())) {
            return null;
        }

        try {
            $institution = $this->resolveUniversity->handle($source);
        } catch (InvalidUniversityConfiguration) {
            return null;
        }

        $roleValues = array_map(
            static fn (InstitutionMembershipRole $role): string => $role->value,
            $allowedRoles,
        );

        $membership = InstitutionMembership::query()
            ->forInstitution($institution)
            ->whereBelongsTo($actor)
            ->where('status', InstitutionMembershipStatus::Verified->value)
            ->whereIn('role', $roleValues)
            ->when(DB::transactionLevel() > 0, fn ($query) => $query->sharedLock())
            ->first();

        if ($membership === null || ($membership->role === InstitutionMembershipRole::CampusAdmin
            && ! $actor->isUniversityAdmin($institution))) {
            return null;
        }

        return new InstitutionContext($actor, $institution, $membership);
    }
}
