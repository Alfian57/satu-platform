<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\User;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use InvalidArgumentException;

final class FetchSavedCandidates
{
    public function __construct(
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
        private readonly RecruiterSafeCandidateSerializer $serializer,
    ) {}

    /**
     * Fetch saved candidates for an entitled recruiter organization.
     *
     * @return LengthAwarePaginator<int, array<string, mixed>>
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Page size must be between 1 and 100.');
        }

        if (! $recruiter->is_platform_admin) {
            $isMember = $organization->memberships()
                ->where('user_id', $recruiter->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->exists();

            if (! $isMember) {
                throw new AuthorizationException('You are not an active member of this recruiter organization.');
            }
        }

        $hasEntitlement = $this->verifyEntitlement->check(
            $organization,
            RecruiterEntitlementScope::CandidateSearch
        );

        if (! $hasEntitlement) {
            throw new AuthorizationException('Recruiter organization does not hold an active candidate search entitlement.');
        }

        $builder = RecruiterSavedCandidate::query()
            ->where('recruiter_organization_id', $organization->id)
            ->whereHas('candidateProjection', function ($query) {
                $query->where('is_visible', true);
            })
            ->with(['candidateProjection.institution'])
            ->orderByDesc('created_at');

        $paginator = $builder->paginate($perPage, ['*'], 'page', $page);

        /** @var LengthAwarePaginator<int, array<string, mixed>> $transformed */
        $transformed = $paginator->through(
            fn (RecruiterSavedCandidate $saved): array => $this->serializer->toArray($saved->candidateProjection)
        );

        return $transformed;
    }
}
