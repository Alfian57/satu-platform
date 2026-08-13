<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionRosterStatus;
use App\Enums\LeaderboardScopeType;
use App\Enums\TeamMembershipStatus;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;
use App\Models\XpLedgerEntry;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use JsonException;

final class RebuildLeaderboardProjections
{
    public const MINIMUM_COHORT = 5;

    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(Institution $institution, string $semester): LeaderboardPeriod
    {
        if (
            ! $institution->exists
            || $institution->isDirty($institution->getKeyName())
        ) {
            throw new InvalidArgumentException('Leaderboard institution harus persisted.');
        }

        $semester = $this->validatedSemester($semester);
        $ruleVersion = (string) config(
            'gamification.leaderboard_rule_version',
            LeaderboardPeriod::RULE_VERSION,
        );

        return DB::transaction(function () use ($institution, $semester, $ruleVersion): LeaderboardPeriod {
            $lockedInstitution = Institution::query()
                ->lockForUpdate()
                ->whereKey($institution->getKey())
                ->firstOrFail();

            $period = LeaderboardPeriod::query()
                ->whereBelongsTo($lockedInstitution)
                ->where('semester', $semester)
                ->where('rule_version', $ruleVersion)
                ->first();

            if ($period === null) {
                $period = LeaderboardPeriod::query()->forceCreate([
                    'institution_id' => $lockedInstitution->getKey(),
                    'semester' => $semester,
                    'rule_version' => $ruleVersion,
                ]);
            }

            $activeMembers = $this->activeMembers($lockedInstitution, $semester);
            $activeUserIds = array_keys($activeMembers);
            $userTotals = $this->userXpTotals(
                $lockedInstitution,
                $semester,
                $activeUserIds,
            );
            $teamTotals = $this->teamXpTotals(
                $lockedInstitution,
                $semester,
                $activeUserIds,
            );
            $teamMembers = $this->teamMembers($lockedInstitution, $activeUserIds);
            $preferenceState = $this->preferenceState(
                $lockedInstitution,
                $activeUserIds,
            );
            $optedInUserIds = $this->optedInUserIds($preferenceState);
            $displayNames = $this->displayNames(array_keys($optedInUserIds));

            $rows = $this->buildRows(
                activeMembers: $activeMembers,
                userTotals: $userTotals,
                teamTotals: $teamTotals,
                teamMembers: $teamMembers,
                optedInUserIds: $optedInUserIds,
                displayNames: $displayNames,
            );
            $snapshotDigest = $this->snapshotDigest(
                institutionId: $lockedInstitution->getKey(),
                semester: $semester,
                ruleVersion: $ruleVersion,
                rows: $rows,
                preferenceState: $preferenceState,
            );
            $computedAt = now();

            $projectionRows = array_map(
                fn (array $row): array => $this->projectionRow(
                    row: $row,
                    period: $period,
                    institution: $lockedInstitution,
                    snapshotDigest: $snapshotDigest,
                    computedAt: $computedAt,
                ),
                $rows,
            );

            if ($projectionRows !== []) {
                LeaderboardProjection::query()->insertOrIgnore($projectionRows);
            }

            $previousDigest = $period->latest_snapshot_digest;
            $period->forceFill([
                'latest_snapshot_digest' => $snapshotDigest,
                'computed_at' => $computedAt,
            ])->save();

            Cache::forget(self::cacheKey(
                $lockedInstitution->getKey(),
                $semester,
                $ruleVersion,
            ));

            if ($previousDigest !== $snapshotDigest) {
                $this->audit->record(
                    operation: 'leaderboard.rebuilt',
                    auditable: $period,
                    institution: $lockedInstitution,
                    after: [
                        'period_id' => $period->getKey(),
                        'semester' => $semester,
                        'rule_version' => $ruleVersion,
                        'snapshot_digest' => $snapshotDigest,
                        'row_count' => count($projectionRows),
                    ],
                    reason: 'projection_rebuild',
                );
            }

            return $period->refresh();
        }, attempts: 3);
    }

    public static function cacheKey(
        int $institutionId,
        string $semester,
        string $ruleVersion = LeaderboardPeriod::RULE_VERSION,
    ): string {
        return 'leaderboard:projection:'.$institutionId.':'
            .hash('sha256', $semester).':'.$ruleVersion;
    }

    /**
     * @return array<int, string>
     */
    private function activeMembers(Institution $institution, string $semester): array
    {
        $membershipTable = (new InstitutionMembership)->getTable();
        $rosterTable = (new InstitutionRoster)->getTable();
        $rowTable = (new InstitutionRosterRow)->getTable();

        /** @var EloquentCollection<int, InstitutionMembership> $memberships */
        $memberships = InstitutionMembership::query()
            ->join(
                $rosterTable,
                $rosterTable.'.institution_id',
                '=',
                $membershipTable.'.institution_id',
            )
            ->join(
                $rowTable,
                $rowTable.'.roster_id',
                '=',
                $rosterTable.'.id',
            )
            ->where($membershipTable.'.institution_id', $institution->getKey())
            ->where($membershipTable.'.role', InstitutionMembershipRole::Student->value)
            ->where($membershipTable.'.status', InstitutionMembershipStatus::Verified->value)
            ->whereNotNull($membershipTable.'.institutional_identifier')
            ->whereColumn(
                $membershipTable.'.institutional_identifier',
                $rowTable.'.nim',
            )
            ->where($rosterTable.'.semester', $semester)
            ->where($rosterTable.'.status', InstitutionRosterStatus::Active->value)
            ->where($rowTable.'.semester', $semester)
            ->where($rowTable.'.is_active', true)
            ->select([
                $membershipTable.'.user_id as leaderboard_user_id',
                $rowTable.'.program_studi as leaderboard_program',
                $rowTable.'.id as leaderboard_roster_row_id',
            ])
            ->orderBy($membershipTable.'.user_id')
            ->orderBy($rowTable.'.id')
            ->get();

        $activeMembers = [];

        foreach ($memberships as $membership) {
            $userId = (int) $membership->getAttribute('leaderboard_user_id');

            if (array_key_exists($userId, $activeMembers)) {
                continue;
            }

            $program = trim((string) $membership->getAttribute('leaderboard_program'));
            $activeMembers[$userId] = $program === '' ? 'Tidak ditentukan' : $program;
        }

        return $activeMembers;
    }

    /**
     * @param  list<int>  $activeUserIds
     * @return array<int, int>
     */
    private function userXpTotals(
        Institution $institution,
        string $semester,
        array $activeUserIds,
    ): array {
        if ($activeUserIds === []) {
            return [];
        }

        $ledgerTable = (new XpLedgerEntry)->getTable();
        $contributionTable = (new Contribution)->getTable();
        $sourceType = (new Contribution)->getMorphClass();

        $totals = XpLedgerEntry::query()
            ->join(
                $contributionTable,
                $contributionTable.'.id',
                '=',
                $ledgerTable.'.source_id',
            )
            ->where($ledgerTable.'.institution_id', $institution->getKey())
            ->where($ledgerTable.'.semester', $semester)
            ->where($ledgerTable.'.source_type', $sourceType)
            ->whereIn($ledgerTable.'.user_id', $activeUserIds)
            ->where($contributionTable.'.institution_id', $institution->getKey())
            ->where($contributionTable.'.status', ContributionStatus::Approved->value)
            ->select($ledgerTable.'.user_id as leaderboard_user_id')
            ->selectRaw(
                'SUM(CASE WHEN reversal_reference_id IS NULL '
                .'THEN amount ELSE -amount END) AS leaderboard_xp_total',
            )
            ->groupBy($ledgerTable.'.user_id')
            ->get();

        $result = [];

        foreach ($totals as $total) {
            $result[(int) $total->getAttribute('leaderboard_user_id')] =
                (int) $total->getAttribute('leaderboard_xp_total');
        }

        return $result;
    }

    /**
     * @param  list<int>  $activeUserIds
     * @return array<int, array<int, int>>
     */
    private function teamXpTotals(
        Institution $institution,
        string $semester,
        array $activeUserIds,
    ): array {
        if ($activeUserIds === []) {
            return [];
        }

        $ledgerTable = (new XpLedgerEntry)->getTable();
        $contributionTable = (new Contribution)->getTable();
        $sourceType = (new Contribution)->getMorphClass();

        $totals = XpLedgerEntry::query()
            ->join(
                $contributionTable,
                $contributionTable.'.id',
                '=',
                $ledgerTable.'.source_id',
            )
            ->where($ledgerTable.'.institution_id', $institution->getKey())
            ->where($ledgerTable.'.semester', $semester)
            ->where($ledgerTable.'.source_type', $sourceType)
            ->whereIn($ledgerTable.'.user_id', $activeUserIds)
            ->where($contributionTable.'.institution_id', $institution->getKey())
            ->where($contributionTable.'.status', ContributionStatus::Approved->value)
            ->select([
                $ledgerTable.'.user_id as leaderboard_user_id',
                $contributionTable.'.project_id as leaderboard_project_id',
            ])
            ->selectRaw(
                'SUM(CASE WHEN reversal_reference_id IS NULL '
                .'THEN amount ELSE -amount END) AS leaderboard_xp_total',
            )
            ->groupBy(
                $ledgerTable.'.user_id',
                $contributionTable.'.project_id',
            )
            ->get();

        $result = [];

        foreach ($totals as $total) {
            $projectId = (int) $total->getAttribute('leaderboard_project_id');
            $userId = (int) $total->getAttribute('leaderboard_user_id');
            $result[$projectId][$userId] = (int) $total->getAttribute('leaderboard_xp_total');
        }

        return $result;
    }

    /**
     * @param  list<int>  $activeUserIds
     * @return list<array{project_id: int, user_id: int, label: string}>
     */
    private function teamMembers(Institution $institution, array $activeUserIds): array
    {
        if ($activeUserIds === []) {
            return [];
        }

        $teamTable = (new TeamMembership)->getTable();
        $projectTable = (new Project)->getTable();

        $memberships = TeamMembership::query()
            ->join(
                $projectTable,
                $projectTable.'.id',
                '=',
                $teamTable.'.project_id',
            )
            ->where($projectTable.'.institution_id', $institution->getKey())
            ->where($teamTable.'.status', TeamMembershipStatus::Active->value)
            ->whereIn($teamTable.'.user_id', $activeUserIds)
            ->select([
                $teamTable.'.project_id as leaderboard_project_id',
                $teamTable.'.user_id as leaderboard_user_id',
                $projectTable.'.title as leaderboard_project_label',
            ])
            ->orderBy($teamTable.'.project_id')
            ->orderBy($teamTable.'.user_id')
            ->get();

        return array_values($memberships->map(
            static fn (TeamMembership $membership): array => [
                'project_id' => (int) $membership->getAttribute('leaderboard_project_id'),
                'user_id' => (int) $membership->getAttribute('leaderboard_user_id'),
                'label' => (string) $membership->getAttribute('leaderboard_project_label'),
            ],
        )->values()->all());
    }

    /**
     * @param  list<int>  $activeUserIds
     * @return array<int, array{is_opted_in: bool, version: int}>
     */
    private function preferenceState(Institution $institution, array $activeUserIds): array
    {
        if ($activeUserIds === []) {
            return [];
        }

        $preferences = LeaderboardPreference::query()
            ->whereBelongsTo($institution)
            ->where('scope_type', LeaderboardScopeType::Individual->value)
            ->whereIn('user_id', $activeUserIds)
            ->get(['user_id', 'is_opted_in', 'version']);
        $state = [];

        foreach ($preferences as $preference) {
            $state[(int) $preference->user_id] = [
                'is_opted_in' => (bool) $preference->is_opted_in,
                'version' => (int) $preference->version,
            ];
        }

        return $state;
    }

    /**
     * @param  array<int, array{is_opted_in: bool, version: int}>  $preferenceState
     * @return array<int, true>
     */
    private function optedInUserIds(array $preferenceState): array
    {
        $result = [];

        foreach ($preferenceState as $userId => $preference) {
            if ($preference['is_opted_in']) {
                $result[$userId] = true;
            }
        }

        return $result;
    }

    /**
     * @param  list<int>  $userIds
     * @return array<int, string>
     */
    private function displayNames(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        return User::query()
            ->whereKey($userIds)
            ->pluck('name', 'id')
            ->mapWithKeys(
                static fn (mixed $name, mixed $userId): array => [
                    (int) $userId => (string) $name,
                ],
            )
            ->all();
    }

    /**
     * @param  array<int, string>  $activeMembers
     * @param  array<int, int>  $userTotals
     * @param  array<int, array<int, int>>  $teamTotals
     * @param  list<array{project_id: int, user_id: int, label: string}>  $teamMembers
     * @param  array<int, true>  $optedInUserIds
     * @param  array<int, string>  $displayNames
     * @return list<array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null,
     * }>
     */
    private function buildRows(
        array $activeMembers,
        array $userTotals,
        array $teamTotals,
        array $teamMembers,
        array $optedInUserIds,
        array $displayNames,
    ): array {
        $programGroups = [];

        foreach ($activeMembers as $userId => $program) {
            if (! array_key_exists($userId, $userTotals)) {
                continue;
            }

            $programGroups[$program] ??= [
                'scope_id' => null,
                'scope_key' => 'program:'.$program,
                'scope_label' => $program,
                'total' => 0,
                'members' => [],
            ];
            $programGroups[$program]['members'][$userId] = $userTotals[$userId];
            $programGroups[$program]['total'] += $userTotals[$userId];
        }

        $programRows = $this->groupRows(
            scopeType: LeaderboardScopeType::Program,
            groups: $programGroups,
        );

        $teamGroups = [];

        foreach ($teamMembers as $teamMember) {
            $projectId = $teamMember['project_id'];
            $userId = $teamMember['user_id'];

            if (
                ! array_key_exists($projectId, $teamTotals)
                || ! array_key_exists($userId, $teamTotals[$projectId])
            ) {
                continue;
            }

            $teamKey = 'team:'.$projectId;
            $teamGroups[$teamKey] ??= [
                'scope_id' => $projectId,
                'scope_key' => 'team:'.$projectId,
                'scope_label' => $teamMember['label'],
                'total' => 0,
                'members' => [],
            ];
            $teamGroups[$teamKey]['members'][$userId] = $teamTotals[$projectId][$userId];
            $teamGroups[$teamKey]['total'] += $teamTotals[$projectId][$userId];
        }

        $teamRows = $this->groupRows(
            scopeType: LeaderboardScopeType::Team,
            groups: $teamGroups,
        );

        $individualRows = [];

        foreach (array_keys($optedInUserIds) as $userId) {
            if (! array_key_exists($userId, $userTotals)) {
                continue;
            }

            $individualRows[] = [
                'scope_type' => LeaderboardScopeType::Individual->value,
                'scope_id' => $userId,
                'scope_key' => 'individual:'.$userId,
                'scope_label' => $displayNames[$userId] ?? 'Mahasiswa',
                'rank' => null,
                'shared_rank_group' => null,
                'score' => $this->score($userTotals[$userId], 1),
                'verified_xp_total' => $userTotals[$userId],
                'active_member_denominator' => 1,
                'cohort_size' => 1,
                'suppressed' => false,
                'suppression_reason' => null,
            ];
        }

        return array_merge(
            $programRows,
            $teamRows,
            $this->rankRows($individualRows),
        );
    }

    /**
     * @param  array<string, array{
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string,
     *     total: int,
     *     members: array<int, int>
     * }>  $groups
     * @return list<array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null
     * }>
     */
    private function groupRows(LeaderboardScopeType $scopeType, array $groups): array
    {
        $rows = [];
        $minimumCohort = (int) config(
            'gamification.leaderboard_minimum_cohort',
            self::MINIMUM_COHORT,
        );

        foreach ($groups as $group) {
            $cohortSize = count($group['members']);
            $suppressed = $cohortSize < $minimumCohort;

            $rows[] = [
                'scope_type' => $scopeType->value,
                'scope_id' => $group['scope_id'],
                'scope_key' => $group['scope_key'],
                'scope_label' => $group['scope_label'],
                'rank' => null,
                'shared_rank_group' => null,
                'score' => $this->score($group['total'], $cohortSize),
                'verified_xp_total' => $group['total'],
                'active_member_denominator' => $cohortSize,
                'cohort_size' => $cohortSize,
                'suppressed' => $suppressed,
                'suppression_reason' => $suppressed ? 'cohort_below_minimum' : null,
            ];
        }

        return $this->rankRows($rows);
    }

    /**
     * @param  list<array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null
     * }>  $rows
     * @return list<array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null
     * }>
     */
    private function rankRows(array $rows): array
    {
        $unsuppressed = array_values(array_filter(
            $rows,
            static fn (array $row): bool => ! $row['suppressed'],
        ));
        $suppressed = array_values(array_filter(
            $rows,
            static fn (array $row): bool => $row['suppressed'],
        ));

        usort($unsuppressed, static function (array $left, array $right): int {
            $scoreOrder = (float) $right['score'] <=> (float) $left['score'];

            return $scoreOrder !== 0
                ? $scoreOrder
                : strcmp($left['scope_key'], $right['scope_key']);
        });

        $ranked = [];
        $rankCounts = [];
        $previousScore = null;

        foreach ($unsuppressed as $index => $row) {
            $rank = $previousScore === $row['score']
                ? $ranked[array_key_last($ranked)]['rank']
                : $index + 1;
            $row['rank'] = $rank;
            $ranked[] = $row;
            $rankCounts[$rank] = ($rankCounts[$rank] ?? 0) + 1;
            $previousScore = $row['score'];
        }

        foreach ($suppressed as $row) {
            $ranked[] = $row;
        }

        foreach ($ranked as &$row) {
            if ($row['rank'] !== null && ($rankCounts[$row['rank']] ?? 0) > 1) {
                $row['shared_rank_group'] = $row['rank'];
            }
        }
        unset($row);

        return $ranked;
    }

    private function score(int $total, int $denominator): string
    {
        if ($denominator < 1) {
            return '0.0000';
        }

        return number_format($total / $denominator, 4, '.', '');
    }

    /**
     * @param  list<array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null
     * }>  $rows
     * @param  array<int, array{is_opted_in: bool, version: int}>  $preferenceState
     */
    private function snapshotDigest(
        int $institutionId,
        string $semester,
        string $ruleVersion,
        array $rows,
        array $preferenceState,
    ): string {
        ksort($preferenceState);
        usort(
            $rows,
            static fn (array $left, array $right): int => strcmp(
                $left['scope_key'],
                $right['scope_key'],
            ),
        );

        try {
            return hash('sha256', json_encode([
                'institution_id' => $institutionId,
                'semester' => $semester,
                'rule_version' => $ruleVersion,
                'preference_state' => $preferenceState,
                'rows' => $rows,
            ], JSON_THROW_ON_ERROR));
        } catch (JsonException $exception) {
            throw new InvalidArgumentException(
                'Leaderboard snapshot tidak dapat diserialisasi.',
                previous: $exception,
            );
        }
    }

    /**
     * @param  array{
     *     scope_type: string,
     *     scope_id: int|null,
     *     scope_key: string,
     *     scope_label: string|null,
     *     rank: int|null,
     *     shared_rank_group: int|null,
     *     score: string,
     *     verified_xp_total: int,
     *     active_member_denominator: int,
     *     cohort_size: int,
     *     suppressed: bool,
     *     suppression_reason: string|null
     * }  $row
     * @return array<string, mixed>
     */
    private function projectionRow(
        array $row,
        LeaderboardPeriod $period,
        Institution $institution,
        string $snapshotDigest,
        DateTimeInterface $computedAt,
    ): array {
        return [
            'leaderboard_period_id' => $period->getKey(),
            'institution_id' => $institution->getKey(),
            'scope_type' => $row['scope_type'],
            'scope_id' => $row['scope_id'],
            'scope_key' => $row['scope_key'],
            'scope_label' => $row['scope_label'],
            'rank' => $row['rank'],
            'shared_rank_group' => $row['shared_rank_group'],
            'score' => $row['score'],
            'verified_xp_total' => $row['verified_xp_total'],
            'active_member_denominator' => $row['active_member_denominator'],
            'cohort_size' => $row['cohort_size'],
            'suppressed' => $row['suppressed'],
            'suppression_reason' => $row['suppression_reason'],
            'snapshot_digest' => $snapshotDigest,
            'snapshot_key' => hash(
                'sha256',
                $snapshotDigest.'|'.$row['scope_type'].'|'.$row['scope_key'],
            ),
            'computed_at' => $computedAt,
            'created_at' => $computedAt,
            'updated_at' => $computedAt,
        ];
    }

    private function validatedSemester(string $semester): string
    {
        $semester = (string) Str::of($semester)->squish();

        if ($semester === '' || Str::length($semester) > 100) {
            throw new InvalidArgumentException(
                'Semester leaderboard wajib diisi dan maksimal 100 karakter.',
            );
        }

        return $semester;
    }
}
