<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\ProjectVisibility;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Project\ProjectDiscoveryResult;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;

final class ProjectDiscoveryQuery
{
    public function execute(User $user, ProjectDiscoveryFilters $filters): ProjectDiscoveryResult
    {
        $institution = $this->resolveInstitution($user, $filters->institutionId);
        Gate::forUser($user)->authorize('viewAny', [Project::class, $institution]);

        $effectiveFilters = $filters->forInstitution($institution->getKey());
        $query = Project::query()
            ->select([
                'projects.id',
                'projects.institution_id',
                'projects.owner_id',
                'projects.title',
                'projects.description',
                'projects.status',
                'projects.visibility',
                'projects.capacity',
                'projects.deadline',
                'projects.created_at',
                'projects.updated_at',
            ])
            ->forInstitution($institution)
            ->whereIn('projects.status', $this->enumValues($effectiveFilters->statuses))
            ->with([
                'institution:id,name',
                'owner:id,name',
                'roles:id,project_id,title,description,capacity',
                'roles.skills:id,project_role_id,skill_taxonomy_id,proficiency',
                'roles.skills.taxonomy:id,name',
            ]);

        $this->applyVisibility($query, $user, $effectiveFilters);
        $this->applySearch($query, $effectiveFilters->search);
        $this->applyOrdering($query, $effectiveFilters);

        /** @var LengthAwarePaginator<int, Project> $paginator */
        $paginator = $query
            ->paginate(
                $effectiveFilters->perPage,
                ['*'],
                'page',
                $effectiveFilters->page,
            )
            ->appends($effectiveFilters->queryParameters());

        return new ProjectDiscoveryResult($institution, $effectiveFilters, $paginator);
    }

    private function resolveInstitution(User $user, ?int $institutionId): Institution
    {
        $membership = InstitutionMembership::query()
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->whereIn('role', [
                InstitutionMembershipRole::Student,
                InstitutionMembershipRole::CampusAdmin,
            ])
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->when(
                $institutionId !== null,
                fn (Builder $query): Builder => $query->where('institution_id', $institutionId),
            )
            ->latest('requested_at')
            ->latest('id')
            ->first();

        if ($membership?->institution === null) {
            throw new AuthorizationException('Tidak ada konteks institution yang terverifikasi.');
        }

        return $membership->institution;
    }

    /** @param  Builder<Project>  $query */
    private function applyVisibility(
        Builder $query,
        User $user,
        ProjectDiscoveryFilters $filters,
    ): void {
        $visibilityValues = $this->enumValues($filters->visibilities);
        $sharedVisibilities = array_values(array_intersect(
            $visibilityValues,
            [ProjectVisibility::Institution->value, ProjectVisibility::Public->value],
        ));
        $privateRequested = in_array(ProjectVisibility::Private->value, $visibilityValues, true);

        $query->where(function (Builder $query) use (
            $sharedVisibilities,
            $privateRequested,
            $user,
        ): void {
            if ($sharedVisibilities !== []) {
                $query->whereIn('projects.visibility', $sharedVisibilities);
            }

            if ($privateRequested) {
                $privateQuery = static fn (Builder $query): Builder => $query
                    ->where('projects.visibility', ProjectVisibility::Private->value)
                    ->where('projects.owner_id', $user->getKey());

                $sharedVisibilities === []
                    ? $query->where($privateQuery)
                    : $query->orWhere($privateQuery);
            }
        });
    }

    /** @param  Builder<Project>  $query */
    private function applySearch(Builder $query, ?string $search): void
    {
        if ($search === null) {
            return;
        }

        $like = '%'.$search.'%';

        $query->where(function (Builder $query) use ($like): void {
            $query
                ->where('projects.title', 'like', $like)
                ->orWhere('projects.description', 'like', $like)
                ->orWhereHas(
                    'owner',
                    static fn (Builder $owner): Builder => $owner->where('name', 'like', $like),
                )
                ->orWhereHas('roles', function (Builder $roles) use ($like): void {
                    $roles
                        ->where('title', 'like', $like)
                        ->orWhereHas(
                            'skills.taxonomy',
                            static fn (Builder $taxonomy): Builder => $taxonomy->where('name', 'like', $like),
                        );
                });
        });
    }

    /** @param  Builder<Project>  $query */
    private function applyOrdering(Builder $query, ProjectDiscoveryFilters $filters): void
    {
        $column = match ($filters->sort) {
            'newest' => 'projects.created_at',
            'title' => 'projects.title',
            default => 'projects.deadline',
        };

        $direction = match ($filters->direction) {
            'desc' => 'desc',
            default => 'asc',
        };

        $query
            ->orderBy($column, $direction)
            ->orderBy('projects.id', $direction);
    }

    /**
     * @param  list<\BackedEnum>  $enums
     * @return list<string>
     */
    private function enumValues(array $enums): array
    {
        return array_map(
            static fn (\BackedEnum $enum): string => (string) $enum->value,
            $enums,
        );
    }
}
