<?php

namespace App\Actions\Campus;

use App\Enums\AffiliationReviewDecision;
use App\Models\AffiliationReview;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class FetchCampusOverviewMetrics
{
    /**
     * @param array{
     *     date_from?: string|null,
     *     date_to?: string|null,
     *     program?: string|null,
     *     page?: int,
     *     per_page?: int,
     * } $filters
     * @return array<string, mixed>
     */
    public function handle(Institution $institution, array $filters = []): array
    {
        $dateFrom = ! empty($filters['date_from']) ? CarbonImmutable::parse($filters['date_from'])->startOfDay() : null;
        $dateTo = ! empty($filters['date_to']) ? CarbonImmutable::parse($filters['date_to'])->endOfDay() : null;
        $program = ! empty($filters['program']) ? trim((string) $filters['program']) : null;
        $page = (int) ($filters['page'] ?? 1);
        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        $membershipStats = $this->queryMembershipStats($institution, $dateFrom, $dateTo, $program);
        $projectStats = $this->queryProjectStats($institution, $dateFrom, $dateTo);
        $contributionStats = $this->queryContributionStats($institution, $dateFrom, $dateTo);
        $reviewTurnaround = $this->queryReviewTurnaround($institution, $dateFrom, $dateTo);
        $programDistribution = $this->queryProgramDistribution($institution, $dateFrom, $dateTo);
        $drilledDownMembers = $this->paginateMembers($institution, $dateFrom, $dateTo, $program, $page, $perPage);

        return [
            'overview' => [
                'memberships' => $membershipStats,
                'projects' => $projectStats,
                'contributions' => $contributionStats,
                'review_turnaround' => $reviewTurnaround,
            ],
            'program_distribution' => $programDistribution,
            'members' => [
                'items' => $drilledDownMembers->items(),
                'pagination' => [
                    'current_page' => $drilledDownMembers->currentPage(),
                    'last_page' => $drilledDownMembers->lastPage(),
                    'per_page' => $drilledDownMembers->perPage(),
                    'total' => $drilledDownMembers->total(),
                ],
            ],
            'filters' => [
                'date_from' => $dateFrom?->toDateString(),
                'date_to' => $dateTo?->toDateString(),
                'program' => $program,
            ],
        ];
    }

    /**
     * @return array{total: int, verified: int, pending: int, unverified: int}
     */
    private function queryMembershipStats(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
        ?string $program,
    ): array {
        $query = InstitutionMembership::query()
            ->where('institution_id', $institution->getKey());

        if ($dateFrom !== null) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== null) {
            $query->where('created_at', '<=', $dateTo);
        }

        if ($program !== null) {
            $query->whereHas('user.studentProfile', function (Builder $b) use ($program) {
                $b->where('study_program', $program);
            });
        }

        $results = $query->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $verified = (int) ($results['verified'] ?? 0);
        $pending = (int) ($results['pending'] ?? 0);
        $unverified = (int) ($results['unverified'] ?? 0);
        $total = $verified + $pending + $unverified;

        return [
            'total' => $total,
            'verified' => $verified,
            'pending' => $pending,
            'unverified' => $unverified,
        ];
    }

    /**
     * @return array{total: int, active: int, completed: int, draft: int}
     */
    private function queryProjectStats(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
    ): array {
        $query = Project::query()
            ->where('institution_id', $institution->getKey());

        if ($dateFrom !== null) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== null) {
            $query->where('created_at', '<=', $dateTo);
        }

        $results = $query->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $active = (int) ($results['published'] ?? 0) + (int) ($results['in_progress'] ?? 0);
        $completed = (int) ($results['completed'] ?? 0);
        $draft = (int) ($results['draft'] ?? 0);
        $total = collect($results)->sum();

        return [
            'total' => $total,
            'active' => $active,
            'completed' => $completed,
            'draft' => $draft,
        ];
    }

    /**
     * @return array{total: int, pending: int, validated: int, revision_required: int}
     */
    private function queryContributionStats(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
    ): array {
        $query = Contribution::query()
            ->whereHas('project', function (Builder $b) use ($institution) {
                $b->where('institution_id', $institution->getKey());
            });

        if ($dateFrom !== null) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== null) {
            $query->where('created_at', '<=', $dateTo);
        }

        $results = $query->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $pending = (int) ($results['submitted'] ?? 0) + (int) ($results['under_review'] ?? 0);
        $validated = (int) ($results['validated'] ?? 0) + (int) ($results['approved'] ?? 0);
        $revision = (int) ($results['revision_required'] ?? 0);
        $total = collect($results)->sum();

        return [
            'total' => $total,
            'pending' => $pending,
            'validated' => $validated,
            'revision_required' => $revision,
        ];
    }

    /**
     * @return array{average_hours: float, total_reviewed: int, approved_count: int, rejected_count: int, revision_count: int}
     */
    private function queryReviewTurnaround(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
    ): array {
        $query = AffiliationReview::query()
            ->whereHas('affiliationRequest', function (Builder $b) use ($institution) {
                $b->where('institution_id', $institution->getKey());
            });

        if ($dateFrom !== null) {
            $query->where('reviewed_at', '>=', $dateFrom);
        }

        if ($dateTo !== null) {
            $query->where('reviewed_at', '<=', $dateTo);
        }

        $reviews = $query->with('affiliationRequest')->get();
        $totalReviewed = $reviews->count();

        if ($totalReviewed === 0) {
            return [
                'average_hours' => 0.0,
                'total_reviewed' => 0,
                'approved_count' => 0,
                'rejected_count' => 0,
                'revision_count' => 0,
            ];
        }

        $totalHours = 0.0;
        $approvedCount = 0;
        $rejectedCount = 0;
        $revisionCount = 0;

        foreach ($reviews as $review) {
            if ($review->decision === AffiliationReviewDecision::Approve) {
                $approvedCount++;
            } elseif ($review->decision === AffiliationReviewDecision::Reject) {
                $rejectedCount++;
            } elseif ($review->decision === AffiliationReviewDecision::RequestRevision) {
                $revisionCount++;
            }

            if ($review->affiliationRequest !== null) {
                $submittedAt = $review->affiliationRequest->submitted_at;
                $reviewedAt = $review->reviewed_at;
                if ($submittedAt !== null && $reviewedAt !== null) {
                    $totalHours += max(0, $submittedAt->diffInMinutes($reviewedAt) / 60.0);
                }
            }
        }

        return [
            'average_hours' => round($totalHours / $totalReviewed, 2),
            'total_reviewed' => $totalReviewed,
            'approved_count' => $approvedCount,
            'rejected_count' => $rejectedCount,
            'revision_count' => $revisionCount,
        ];
    }

    /**
     * @return list<array{program: string, count: int}>
     */
    private function queryProgramDistribution(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
    ): array {
        $query = StudentProfile::query()
            ->whereHas('user.memberships', function (Builder $b) use ($institution, $dateFrom, $dateTo) {
                $b->where('institution_id', $institution->getKey());
                if ($dateFrom !== null) {
                    $b->where('created_at', '>=', $dateFrom);
                }
                if ($dateTo !== null) {
                    $b->where('created_at', '<=', $dateTo);
                }
            })
            ->whereNotNull('study_program')
            ->where('study_program', '!=', '');

        $results = $query->select('study_program', DB::raw('count(*) as aggregate'))
            ->groupBy('study_program')
            ->orderByDesc('aggregate')
            ->get();

        return $results->map(fn ($row) => [
            'program' => (string) $row->study_program,
            'count' => (int) $row->aggregate,
        ])->all();
    }

    /**
     * @return LengthAwarePaginator<InstitutionMembership>
     */
    private function paginateMembers(
        Institution $institution,
        ?CarbonImmutable $dateFrom,
        ?CarbonImmutable $dateTo,
        ?string $program,
        int $page,
        int $perPage,
    ): LengthAwarePaginator {
        $query = InstitutionMembership::query()
            ->where('institution_id', $institution->getKey())
            ->with(['user', 'user.studentProfile']);

        if ($dateFrom !== null) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== null) {
            $query->where('created_at', '<=', $dateTo);
        }

        if ($program !== null) {
            $query->whereHas('user.studentProfile', function (Builder $b) use ($program) {
                $b->where('study_program', $program);
            });
        }

        /** @var LengthAwarePaginator<InstitutionMembership> $paginator */
        $paginator = $query->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

        $paginator->getCollection()->transform(function (InstitutionMembership $m) {
            return [
                'id' => $m->getKey(),
                'username' => $m->user->username,
                'role' => $m->role->value,
                'status' => $m->status->value,
                'program' => $m->user->studentProfile?->study_program,
                'createdAt' => $m->created_at?->toIso8601String(),
            ];
        });

        return $paginator;
    }
}
