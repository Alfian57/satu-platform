<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Models\AuditLog;
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
        string $search = '',
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Contribution review page size must be between 1 and 100.');
        }

        if (! in_array($sort, ['oldest', 'newest'], true)) {
            throw new InvalidArgumentException('Contribution review sort must be oldest or newest.');
        }

        $search = trim($search);
        if (mb_strlen($search) > 100) {
            throw new InvalidArgumentException('Pencarian kontribusi maksimal 100 karakter.');
        }

        $query = $this->query($reviewer, $institution)
            ->select('contributions.*')
            ->addSelect(['submitted_at' => $this->submissionTime()])
            ->withCasts(['submitted_at' => 'datetime'])
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
                        'disk',
                        'path',
                        'sha256',
                        'original_name',
                        'mime_type',
                        'size_bytes',
                        'deleted_at',
                    ]);
                },
                'reviews.reviewer:id,name',
            ]);

        if ($search !== '') {
            $term = '%'.$search.'%';
            $query->where(fn (Builder $query): Builder => $query
                ->whereHas('owner', fn (Builder $owner): Builder => $owner->where('name', 'like', $term))
                ->orWhereHas('project', fn (Builder $project): Builder => $project->where('title', 'like', $term))
                ->orWhereHas('currentVersion', fn (Builder $version): Builder => $version
                    ->where('claim', 'like', $term)->orWhere('summary', 'like', $term)));
        }

        $direction = $sort === 'oldest' ? 'asc' : 'desc';

        return $query
            ->orderByRaw('submitted_at IS NULL')
            ->orderBy('submitted_at', $direction)
            ->orderBy('id', $direction)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /** @return Builder<AuditLog> */
    private function submissionTime(): Builder
    {
        return AuditLog::query()->select('audit_logs.created_at')
            ->join('contribution_versions as submitted_versions', 'submitted_versions.contribution_id', '=', 'audit_logs.auditable_id')
            ->whereColumn('submitted_versions.id', 'contributions.current_version_id')
            ->whereColumn('submitted_versions.contribution_id', 'contributions.id')
            ->whereColumn('submitted_versions.created_by_id', 'contributions.owner_id')
            ->whereColumn('audit_logs.auditable_id', 'contributions.id')
            ->whereColumn('audit_logs.institution_id', 'contributions.institution_id')
            ->whereColumn('audit_logs.actor_id', 'contributions.owner_id')
            ->where('audit_logs.auditable_type', (new Contribution)->getMorphClass())
            ->where('audit_logs.operation', 'contribution.submitted')
            ->where('audit_logs.after_summary->status', ContributionStatus::Pending->value)
            ->whereColumn('audit_logs.after_summary->version_number', 'submitted_versions.version_number')
            ->latest('audit_logs.created_at')->latest('audit_logs.id')->limit(1);
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

        return Contribution::query()->forInstitution($institution)->where('status', '!=', ContributionStatus::Draft)->where('owner_id', '!=', $reviewer->getKey());
    }
}
