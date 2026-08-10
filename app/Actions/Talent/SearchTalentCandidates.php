<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

final class SearchTalentCandidates
{
    public function __construct(
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
        private readonly RecruiterSafeCandidateSerializer $serializer,
    ) {}

    /**
     * Search recruiter-safe talent candidates for an entitled recruiter organization.
     *
     * @param  array<string>|null  $skills
     * @param  array<string>|null  $badges
     * @return LengthAwarePaginator<int, array<string, mixed>>
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        ?string $query = null,
        ?array $skills = null,
        ?array $badges = null,
        ?string $availabilityStatus = null,
        ?int $institutionId = null,
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

        $builder = TalentCandidateProjection::query()
            ->with('institution')
            ->where('is_visible', true);

        if ($institutionId !== null) {
            $builder->where('institution_id', $institutionId);
        }

        if ($availabilityStatus !== null && $availabilityStatus !== '') {
            $builder->where('availability_status', $availabilityStatus);
        }

        if ($query !== null && trim($query) !== '') {
            $searchTerm = '%'.trim($query).'%';
            $builder->where(function (Builder $q) use ($searchTerm) {
                $q->where('headline', 'like', $searchTerm)
                    ->orWhere('bio', 'like', $searchTerm);
            });
        }

        if ($skills !== null && count($skills) > 0) {
            foreach ($skills as $skill) {
                $builder->whereJsonContains('skills', $skill);
            }
        }

        if ($badges !== null && count($badges) > 0) {
            foreach ($badges as $badge) {
                $builder->whereJsonContains('badges', $badge);
            }
        }

        $paginator = $builder->orderByDesc('verified_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);

        /** @var LengthAwarePaginator<int, array<string, mixed>> $transformed */
        $transformed = $paginator->through(
            fn (TalentCandidateProjection $projection): array => $this->serializer->toArray($projection)
        );

        return $transformed;
    }
}
