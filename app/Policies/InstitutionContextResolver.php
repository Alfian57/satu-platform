<?php

namespace App\Policies;

use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final class InstitutionContextResolver
{
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
        if ($source === null || $allowedRoles === []) {
            return null;
        }

        if ($source instanceof Institution) {
            if (! $source->exists || $source->isDirty($source->getKeyName())) {
                return null;
            }

            $institutionId = $source->getKey();
        } else {
            if (
                ! $source instanceof Model
                || ! $source->exists
                || $source->isDirty([$source->getKeyName(), 'institution_id'])
            ) {
                return null;
            }

            $persistedSource = $source->newQuery()->find($source->getKey());

            if (
                ! $persistedSource instanceof InstitutionOwned
                || $persistedSource->institutionId() !== $source->institutionId()
            ) {
                return null;
            }

            $institutionId = $persistedSource->institutionId();
        }

        $institution = Institution::query()
            ->whereKey($institutionId)
            ->where('status', InstitutionStatus::Active->value)
            ->first();

        if ($institution === null) {
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
            ->first();

        if ($membership === null) {
            return null;
        }

        return new InstitutionContext($actor, $institution, $membership);
    }
}
