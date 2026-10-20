<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Enums\TeamMembershipStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\Institution;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use App\Support\Project\ProjectDiscoveryResult;
use App\Support\Project\ProjectOpportunityCapacity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;

final class ProjectDiscoveryQuery
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity) {}

    public function execute(User $user, ProjectDiscoveryFilters $filters): ProjectDiscoveryResult
    {
        $institution = $this->resolveInstitution($filters->institutionId);
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
            ->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeMembers(...)])
            ->with([
                'institution:id,name',
                'owner:id,name',
                'roles' => fn ($roles) => $roles->select(['id', 'project_id', 'title', 'description', 'capacity', 'accepts_beginners', 'selection_criteria'])
                    ->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeRoleMembers(...)]),
                'roles.skills:id,project_role_id,skill_taxonomy_id,proficiency',
                'roles.skills.taxonomy:id,name',
            ]);

        $this->applyVisibility($query, $user, $effectiveFilters);
        if ($effectiveFilters->view === 'mine') {
            $query->where(fn (Builder $projects): Builder => $projects
                ->where('projects.owner_id', $user->getKey())
                ->orWhereHas('teamMemberships', fn (Builder $memberships): Builder => $memberships
                    ->where('user_id', $user->getKey())
                    ->where('status', TeamMembershipStatus::Active)));
        }
        $this->applySearch($query, $effectiveFilters->search);
        $this->applyOpportunityFilters($query, $effectiveFilters);
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

    private function resolveInstitution(?int $institutionId): Institution
    {
        try {
            $university = $this->resolveUniversity->handle();
        } catch (InvalidUniversityConfiguration) {
            throw new AuthorizationException('Konteks universitas belum tersedia.');
        }
        if ($institutionId !== null && $institutionId !== $university->getKey()) {
            throw new AuthorizationException('Konteks universitas tidak sesuai.');
        }

        return $university;
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
            $filters,
        ): void {
            if ($sharedVisibilities !== []) {
                $query->whereIn('projects.visibility', $sharedVisibilities);
            }

            if ($privateRequested) {
                $privateQuery = static fn (Builder $query): Builder => $query
                    ->where('projects.visibility', ProjectVisibility::Private->value)
                    ->where(function (Builder $participants) use ($user, $filters): void {
                        $participants->where('projects.owner_id', $user->getKey());
                        if ($filters->view === 'mine') {
                            $participants->orWhereHas('teamMemberships', fn (Builder $memberships): Builder => $memberships
                                ->where('user_id', $user->getKey())
                                ->where('status', TeamMembershipStatus::Active));
                        }
                    });

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
                        ->orWhere('description', 'like', $like)
                        ->orWhere('selection_criteria', 'like', $like)
                        ->orWhereHas(
                            'skills.taxonomy',
                            static fn (Builder $taxonomy): Builder => $taxonomy->where('name', 'like', $like),
                        );
                });
        });
    }

    /** @param Builder<Project> $query */
    private function applyOpportunityFilters(Builder $query, ProjectDiscoveryFilters $filters): void
    {
        $available = $filters->availability === 'available';
        if ($available) {
            $query->whereIn('projects.status', [ProjectStatus::Open, ProjectStatus::Forming])
                ->where('projects.deadline', '>', now());
            $query->where(fn ($count) => $count->selectRaw('count(*)')
                ->from((new TeamMembership)->getTable())
                ->whereColumn((new TeamMembership)->qualifyColumn('project_id'), (new Project)->qualifyColumn('id'))
                ->where('status', TeamMembershipStatus::Active->value), '<', new Expression('projects.capacity'));
        }
        if ($filters->beginner === 'accepting' || $available) {
            $query->whereHas('roles', function (Builder $roles) use ($filters, $available): void {
                if ($filters->beginner === 'accepting') {
                    $roles->where('accepts_beginners', true);
                }
                if ($available) {
                    $roles->where(fn ($count) => $count->selectRaw('count(*)')
                        ->from((new TeamMembership)->getTable())
                        ->whereColumn((new TeamMembership)->qualifyColumn('project_role_id'), (new ProjectRole)->qualifyColumn('id'))
                        ->whereColumn((new TeamMembership)->qualifyColumn('project_id'), (new ProjectRole)->qualifyColumn('project_id'))
                        ->where('status', TeamMembershipStatus::Active->value), '<', new Expression('project_roles.capacity'));
                }
            });
        }
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
