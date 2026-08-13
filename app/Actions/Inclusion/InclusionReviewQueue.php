<?php

declare(strict_types=1);

namespace App\Actions\Inclusion;

use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;
use Laravel\Pennant\Feature;

final class InclusionReviewQueue
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Return paginated inclusion review queue for authorized CampusAdmin.
     *
     * @return LengthAwarePaginator<int, InclusionSignal>
     *
     * @throws Exception
     */
    public function paginate(
        User $reviewer,
        Institution $institution,
        ?string $period = null,
        bool $restrictedOnly = true,
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if (! Feature::active('inclusion-signal-engine')) {
            throw new Exception('Inclusion signal engine is not active.');
        }

        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Inclusion queue page size must be between 1 and 100.');
        }

        return $this->query($reviewer, $institution, $period, $restrictedOnly)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @return Builder<InclusionSignal>
     *
     * @throws Exception
     */
    public function query(
        User $reviewer,
        Institution $institution,
        ?string $period = null,
        bool $restrictedOnly = true,
    ): Builder {
        if (! Feature::active('inclusion-signal-engine')) {
            throw new Exception('Inclusion signal engine is not active.');
        }

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
            throw new AuthorizationException('You are not authorized to access the inclusion queue for this institution.');
        }

        $query = InclusionSignal::query()
            ->where('institution_id', $institution->id)
            ->with([
                'subject:id,name',
                'version:id,version',
                'reviews.reviewer:id,name',
            ]);

        if ($restrictedOnly) {
            $query->where('restricted_feature_state', true);
        }

        if ($period !== null && $period !== '') {
            $query->where('period', $period);
        }

        return $query->orderByDesc('created_at')->orderByDesc('id');
    }
}
