<?php

namespace App\Actions\InstitutionMemberships;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

final class InstitutionMembershipReviewQueue
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Return the pending membership queue for an authorized institution reviewer.
     *
     * @return LengthAwarePaginator<int, InstitutionMembership>
     */
    public function paginate(
        User $reviewer,
        Institution $institution,
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Review queue page size must be between 1 and 100.');
        }

        return $this->query($reviewer, $institution)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @return Builder<InstitutionMembership>
     */
    public function query(User $reviewer, Institution $institution): Builder
    {
        if (
            ! $reviewer->exists
            || $reviewer->isDirty($reviewer->getKeyName())
            || ! $institution->exists
            || $institution->isDirty($institution->getKeyName())
            || $this->institutionContextResolver->resolve(
                $reviewer,
                $institution,
                [InstitutionMembershipRole::CampusAdmin],
            ) === null
        ) {
            throw new AuthorizationException('You are not authorized to review this institution.');
        }

        return InstitutionMembership::query()
            ->forInstitution($institution)
            ->where('role', InstitutionMembershipRole::Student)
            ->where('status', InstitutionMembershipStatus::Pending)
            ->with([
                'user:id,name,username',
            ])
            ->orderByRaw('requested_at IS NULL')
            ->orderBy('requested_at')
            ->orderBy('id');
    }
}
