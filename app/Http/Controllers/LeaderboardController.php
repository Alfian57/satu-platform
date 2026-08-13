<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Gamification\ReadLeaderboardProjections;
use App\Actions\Gamification\SetLeaderboardIndividualPreference;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionRosterStatus;
use App\Enums\InstitutionStatus;
use App\Enums\LeaderboardScopeType;
use App\Http\Requests\LeaderboardIndexRequest;
use App\Http\Requests\UpdateLeaderboardPreferenceRequest;
use App\Jobs\RebuildLeaderboardProjections as RebuildLeaderboardProjectionsJob;
use App\Models\BadgeAward;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class LeaderboardController extends Controller
{
    public function __construct(
        private readonly ReadLeaderboardProjections $readProjections,
        private readonly SetLeaderboardIndividualPreference $setPreference,
    ) {}

    public function index(LeaderboardIndexRequest $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $membership = $this->activeMembership($user);

        if ($membership === null) {
            return Inertia::render('leaderboards/index', [
                'leaderboard' => $this->forbiddenPayload(),
                'leaderboardRows' => [
                    'state' => 'forbidden',
                    'rows' => [],
                    'pagination' => $this->pagination(1, 0),
                ],
            ]);
        }

        $institution = $membership->institution;
        Gate::forUser($user)->authorize('viewAny', [LeaderboardProjection::class, $institution]);

        $validated = $request->validated();
        $scope = (string) ($validated['scope'] ?? LeaderboardScopeType::Program->value);
        $isCampusOperator = $membership->role === InstitutionMembershipRole::CampusAdmin;

        if (
            $isCampusOperator
            && $scope === LeaderboardScopeType::Individual->value
        ) {
            $scope = LeaderboardScopeType::Program->value;
        }

        $page = (int) ($validated['page'] ?? 1);
        $periods = $this->availablePeriods($institution);
        $semesters = $periods->pluck('semester')->unique()->values();
        $rosterSemester = $this->activeRosterSemester($institution);

        if ($semesters->isEmpty() && $rosterSemester !== null) {
            $semesters->push($rosterSemester);
        }

        $requestedSemester = Str::of((string) ($validated['semester'] ?? ''))
            ->squish()
            ->toString();
        $selectedSemester = $semesters->contains($requestedSemester)
            ? $requestedSemester
            : (string) ($semesters->first() ?? '');
        $period = $periods->firstWhere('semester', $selectedSemester);
        $preference = $this->preference($user, $institution);

        return Inertia::render('leaderboards/index', [
            'leaderboard' => [
                'state' => 'ready',
                'institution' => [
                    'id' => $institution->getKey(),
                    'name' => $institution->name,
                ],
                'semester' => $selectedSemester,
                'semesters' => $semesters->map(
                    static fn (mixed $semester): array => [
                        'value' => (string) $semester,
                        'label' => (string) $semester,
                    ],
                )->values()->all(),
                'scope' => $scope,
                'scopes' => $this->scopes(! $isCampusOperator),
                'period' => $period === null ? null : [
                    'computedAt' => $period->computed_at?->toIso8601String(),
                    'isStale' => $period->isStale(),
                    'ruleVersion' => $period->rule_version,
                ],
                'preference' => [
                    'isOptedIn' => $preference === null
                        ? false
                        : (bool) $preference->is_opted_in,
                    'version' => $preference === null
                        ? 0
                        : (int) $preference->version,
                ],
                'badges' => $this->badges($user, $institution),
                'isCampusOperator' => $isCampusOperator,
            ],
            'leaderboardRows' => Inertia::defer(
                fn (): array => $this->rows(
                    $user,
                    $institution,
                    $selectedSemester,
                    $scope,
                    $page,
                ),
            ),
        ]);
    }

    public function updateIndividualPreference(UpdateLeaderboardPreferenceRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $membership = $this->activeMembership($user);

        if (
            $membership === null
            || $membership->role !== InstitutionMembershipRole::Student
        ) {
            abort(403);
        }

        $preference = $this->setPreference->handle(
            actor: $user,
            institution: $membership->institution,
            isOptedIn: $request->boolean('is_opted_in'),
        );

        $semesters = $membership->institution->rosters()
            ->where('status', InstitutionRosterStatus::Active->value)
            ->pluck('semester')
            ->filter()
            ->unique()
            ->values();

        foreach ($semesters as $semester) {
            RebuildLeaderboardProjectionsJob::dispatch(
                $membership->institution->getKey(),
                (string) $semester,
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $preference->is_opted_in
                ? 'Leaderboard individual diaktifkan.'
                : 'Leaderboard individual disembunyikan.',
        ]);

        $query = array_filter([
            'semester' => $request->string('semester')->squish()->toString(),
            'scope' => $request->string('scope')->squish()->toString(),
        ]);

        return to_route('leaderboards.index', $query);
    }

    private function activeMembership(User $user): ?InstitutionMembership
    {
        return InstitutionMembership::query()
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('status', InstitutionMembershipStatus::Verified->value)
            ->whereIn('role', [
                InstitutionMembershipRole::Student->value,
                InstitutionMembershipRole::CampusAdmin->value,
            ])
            ->whereRelation('institution', 'status', InstitutionStatus::Active->value)
            ->latest('verified_at')
            ->latest('id')
            ->first();
    }

    /**
     * @return Collection<int, LeaderboardPeriod>
     */
    private function availablePeriods(Institution $institution): Collection
    {
        return LeaderboardPeriod::query()
            ->whereBelongsTo($institution)
            ->where(
                'rule_version',
                (string) config(
                    'gamification.leaderboard_rule_version',
                    LeaderboardPeriod::RULE_VERSION,
                ),
            )
            ->whereNotNull('latest_snapshot_digest')
            ->latest('computed_at')
            ->latest('id')
            ->get(['id', 'semester', 'rule_version', 'computed_at', 'latest_snapshot_digest'])
            ->unique('semester')
            ->values();
    }

    private function activeRosterSemester(Institution $institution): ?string
    {
        $semester = $institution->rosters()
            ->where('status', InstitutionRosterStatus::Active->value)
            ->latest('activated_at')
            ->latest('id')
            ->value('semester');

        return is_string($semester) && $semester !== '' ? $semester : null;
    }

    private function preference(User $user, Institution $institution): ?LeaderboardPreference
    {
        return LeaderboardPreference::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($institution)
            ->where('scope_type', LeaderboardScopeType::Individual->value)
            ->first();
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    private function scopes(bool $includeIndividual = true): array
    {
        $scopes = [
            [
                'value' => LeaderboardScopeType::Program->value,
                'label' => 'Program studi',
                'description' => 'Rata-rata XP terverifikasi per anggota aktif.',
            ],
            [
                'value' => LeaderboardScopeType::Team->value,
                'label' => 'Tim',
                'description' => 'Rata-rata XP terverifikasi dalam project.',
            ],
        ];

        if ($includeIndividual) {
            $scopes[] = [
                'value' => LeaderboardScopeType::Individual->value,
                'label' => 'Individual',
                'description' => 'Tampil setelah kamu melakukan opt-in.',
            ];
        }

        return $scopes;
    }

    /**
     * @return array{state: string, rows: list<array<string, mixed>>, pagination: array<string, int>, emptyReason?: string}
     */
    private function rows(
        User $user,
        Institution $institution,
        string $semester,
        string $scope,
        int $page,
    ): array {
        if ($semester === '') {
            return [
                'state' => 'empty',
                'rows' => [],
                'pagination' => $this->pagination(1, 0),
                'emptyReason' => 'no_verified_xp',
            ];
        }

        $scopeType = LeaderboardScopeType::from($scope);
        $preferenceIsOptedIn = (bool) LeaderboardPreference::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($institution)
            ->where('scope_type', LeaderboardScopeType::Individual->value)
            ->where('is_opted_in', true)
            ->value('is_opted_in');

        if (
            $scopeType === LeaderboardScopeType::Individual
            && ! $preferenceIsOptedIn
        ) {
            return [
                'state' => 'empty',
                'rows' => [],
                'pagination' => $this->pagination(1, 0),
                'emptyReason' => 'opt_in_required',
            ];
        }

        $projections = $this->readProjections
            ->handle($institution, $semester)
            ->filter(fn (LeaderboardProjection $projection): bool => $projection->scope_type === $scopeType);

        if ($scopeType === LeaderboardScopeType::Individual) {
            $optedInUserIds = LeaderboardPreference::query()
                ->whereBelongsTo($institution)
                ->where('scope_type', LeaderboardScopeType::Individual->value)
                ->where('is_opted_in', true)
                ->pluck('user_id')
                ->map(static fn (mixed $userId): int => (int) $userId)
                ->all();
            $optedInLookup = array_fill_keys($optedInUserIds, true);
            $projections = $projections->filter(
                fn (LeaderboardProjection $projection): bool => isset(
                    $optedInLookup[$projection->scope_id],
                ),
            );
        }

        $total = $projections->count();
        $perPage = 10;
        $lastPage = max(1, (int) ceil($total / $perPage));
        $currentPage = min(max(1, $page), $lastPage);
        $pageRows = array_values($projections
            ->forPage($currentPage, $perPage)
            ->values()
            ->map(fn (LeaderboardProjection $projection): array => [
                'scopeType' => $projection->scope_type->value,
                'scopeKey' => $projection->scope_key,
                'scopeLabel' => $projection->scope_label,
                'rank' => $projection->rank,
                'sharedRankGroup' => $projection->shared_rank_group,
                'score' => (string) $projection->score,
                'verifiedXpTotal' => $projection->verified_xp_total,
                'activeMemberDenominator' => $projection->active_member_denominator,
                'cohortSize' => $projection->cohort_size,
                'suppressed' => $projection->suppressed,
                'suppressionReason' => $projection->suppression_reason,
            ])
            ->all());

        return [
            'state' => $total === 0 ? 'empty' : 'ready',
            'rows' => $pageRows,
            'pagination' => [
                'currentPage' => $currentPage,
                'lastPage' => $lastPage,
                'perPage' => $perPage,
                'total' => $total,
            ],
            'emptyReason' => $total === 0 ? 'no_verified_xp' : null,
        ];
    }

    /**
     * @return array{currentPage: int, lastPage: int, perPage: int, total: int}
     */
    private function pagination(int $currentPage, int $total): array
    {
        return [
            'currentPage' => $currentPage,
            'lastPage' => max(1, (int) ceil($total / 10)),
            'perPage' => 10,
            'total' => $total,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function badges(User $user, Institution $institution): array
    {
        $awards = BadgeAward::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($institution)
            ->whereNull('revoked_at')
            ->with([
                'definition:id,public_name,public_description,category,level',
                'ruleVersion:id,version',
                'sourceVersion:id,version_number',
            ])
            ->latest('awarded_at')
            ->limit(6)
            ->get();
        $badges = [];

        foreach ($awards as $award) {
            if ($award->definition === null || $award->ruleVersion === null) {
                continue;
            }

            $badges[] = [
                'id' => $award->getKey(),
                'name' => $award->definition->public_name,
                'description' => $award->definition->public_description,
                'category' => $award->definition->category->value,
                'level' => $award->definition->level,
                'sourceLabel' => $award->source_label,
                'sourceVersion' => $award->sourceVersion?->version_number,
                'ruleVersion' => $award->ruleVersion->version,
                'awardedAt' => $award->awarded_at->toIso8601String(),
            ];
        }

        return $badges;
    }

    /** @return array<string, mixed> */
    private function forbiddenPayload(): array
    {
        return [
            'state' => 'forbidden',
            'institution' => null,
            'semester' => '',
            'semesters' => [],
            'scope' => LeaderboardScopeType::Program->value,
            'scopes' => $this->scopes(),
            'period' => null,
            'preference' => [
                'isOptedIn' => false,
                'version' => 0,
            ],
            'badges' => [],
            'isCampusOperator' => false,
        ];
    }
}
