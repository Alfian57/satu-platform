<?php

namespace App\Actions\Affiliations;

use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipRole;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

final class AffiliationReviewQueue
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /** @return LengthAwarePaginator<int, AffiliationRequest> */
    public function paginate(
        User $reviewer,
        Institution $institution,
        ?AffiliationMatchResult $matchResult = null,
        ?bool $stale = null,
        string $sort = 'oldest',
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Review queue page size must be between 1 and 100.');
        }

        if (! in_array($sort, ['oldest', 'newest'], true)) {
            throw new InvalidArgumentException('Review queue sort must be oldest or newest.');
        }

        $activeRoster = $this->activeRoster($institution);
        $query = $this->authorizedQuery($reviewer, $institution)
            ->when(
                $matchResult !== null,
                fn (Builder $query): Builder => $query->where('match_result', $matchResult),
            );

        $this->applyStaleFilter($query, $activeRoster, $stale);

        return $query
            ->with([
                'user:id,username',
                'user.phoneNumber:id,user_id,masked,status,verified_at',
                'roster:id,institution_id,semester,status,activated_at',
                'lockOwner:id,username',
            ])
            ->orderBy('submitted_at', $sort === 'oldest' ? 'asc' : 'desc')
            ->orderBy('id', $sort === 'oldest' ? 'asc' : 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /** @return array{total: int, stale: int, exact: int, mismatch: int} */
    public function summary(User $reviewer, Institution $institution): array
    {
        $activeRoster = $this->activeRoster($institution);
        $query = $this->authorizedQuery($reviewer, $institution);
        $staleQuery = clone $query;

        $this->applyStaleFilter($staleQuery, $activeRoster, true);

        return [
            'total' => (clone $query)->count(),
            'stale' => $staleQuery->count(),
            'exact' => (clone $query)
                ->where('match_result', AffiliationMatchResult::Exact)
                ->count(),
            'mismatch' => (clone $query)
                ->where('match_result', '!=', AffiliationMatchResult::Exact)
                ->count(),
        ];
    }

    public function activeRoster(Institution $institution): ?InstitutionRoster
    {
        return InstitutionRoster::query()
            ->whereBelongsTo($institution)
            ->active()
            ->latest('activated_at')
            ->latest('id')
            ->first();
    }

    /** @return Builder<AffiliationRequest> */
    private function authorizedQuery(User $reviewer, Institution $institution): Builder
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

        return AffiliationRequest::query()
            ->forInstitution($institution)
            ->where('status', AffiliationRequestStatus::PendingReview);
    }

    /** @param Builder<AffiliationRequest> $query */
    private function applyStaleFilter(
        Builder $query,
        ?InstitutionRoster $activeRoster,
        ?bool $stale,
    ): void {
        if ($stale === null) {
            return;
        }

        $activeRosterId = $activeRoster?->getKey();

        if ($stale) {
            $query->where(function (Builder $query) use ($activeRosterId): void {
                if ($activeRosterId === null) {
                    $query->whereNotNull('roster_id');

                    return;
                }

                $query
                    ->whereNull('roster_id')
                    ->orWhere('roster_id', '!=', $activeRosterId);
            });

            return;
        }

        $activeRosterId === null
            ? $query->whereNull('roster_id')
            : $query->where('roster_id', $activeRosterId);
    }
}
