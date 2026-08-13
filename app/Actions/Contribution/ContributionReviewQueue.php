<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use InvalidArgumentException;

final class ContributionReviewQueue
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Return the institution-scoped contribution review queue.
     *
     * @return LengthAwarePaginator<int, Contribution>
     */
    public function paginate(
        User $reviewer,
        Institution $institution,
        ?ContributionStatus $status = ContributionStatus::Pending,
        string $sort = 'oldest',
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Contribution review page size must be between 1 and 100.');
        }

        if (! in_array($sort, ['oldest', 'newest'], true)) {
            throw new InvalidArgumentException('Contribution review sort must be oldest or newest.');
        }

        $query = $this->query($reviewer, $institution)
            ->when(
                $status !== null,
                fn (Builder $query): Builder => $query->where('status', $status),
            )
            ->with([
                'owner:id,name',
                'project:id,institution_id,title',
                'currentVersion:id,contribution_id,created_by_id,task_id,version_number,claim,summary,declaration,created_at',
                'currentVersion.createdBy:id,name',
                'currentVersion.task:id,project_id,title',
                'currentVersion.evidence:id,contribution_version_id,attachment_id,source_label,notes,created_at',
                'currentVersion.evidence.attachment' => static function (Relation $query): void {
                    $query->select([
                        'id',
                        'project_id',
                        'purpose',
                        'original_name',
                        'mime_type',
                        'size_bytes',
                        'deleted_at',
                    ]);
                },
                'reviews.reviewer:id,name',
            ]);

        $direction = $sort === 'oldest' ? 'asc' : 'desc';

        return $query
            ->orderBy('updated_at', $direction)
            ->orderBy('id', $direction)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Return decision workload counts for the institution.
     *
     * @return array{total: int, pending: int, approved: int, revision: int, rejected: int}
     */
    public function summary(User $reviewer, Institution $institution): array
    {
        $query = $this->query($reviewer, $institution);

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)
                ->where('status', ContributionStatus::Pending)
                ->count(),
            'approved' => (clone $query)
                ->where('status', ContributionStatus::Approved)
                ->count(),
            'revision' => (clone $query)
                ->where('status', ContributionStatus::Revision)
                ->count(),
            'rejected' => (clone $query)
                ->where('status', ContributionStatus::Rejected)
                ->count(),
        ];
    }

    /**
     * @return Builder<Contribution>
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
            throw new AuthorizationException('You are not authorized to review contributions for this institution.');
        }

        return Contribution::query()->forInstitution($institution);
    }
}
