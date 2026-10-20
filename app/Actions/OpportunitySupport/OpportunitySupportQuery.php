<?php

namespace App\Actions\OpportunitySupport;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectVisibility;
use App\Models\ConsentRecord;
use App\Models\Institution;
use App\Models\OpportunitySupportEvent;
use App\Models\OpportunitySupportRequest;
use App\Models\ProjectRole;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use App\Support\Project\ProjectOpportunityCapacity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

class OpportunitySupportQuery
{
    public function __construct(private readonly OpportunitySupportGovernance $governance) {}

    /** @return Builder<OpportunitySupportRequest> */
    public function exposed(Institution $institution): Builder
    {
        $settings = $this->governance->settings($institution);
        $requests = (new OpportunitySupportRequest)->getTable();
        $consents = (new ConsentRecord)->getTable();
        $query = OpportunitySupportRequest::query()->where('institution_id', $institution->getKey());
        if (! $this->governance->enabled($institution)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('status', '!=', 'withdrawn')->where('expires_at', '>', now())
            ->where('purpose', $settings['purpose'])->where('notice_version', $settings['notice_version'])
            ->where('approval_reference', $settings['approval_reference'])
            ->where('dataset_kind', $settings['dataset_kind'])->where('dataset_manifest', $settings['dataset_manifest'])
            ->whereHas('owner.institutionMemberships', fn (Builder $q) => $q->where('institution_id', $institution->getKey())
                ->where('role', InstitutionMembershipRole::Student)->where('status', InstitutionMembershipStatus::Verified))
            ->whereExists(function (QueryBuilder $q) use ($requests, $consents): void {
                $q->selectRaw('1')->from($consents)
                    ->whereColumn($consents.'.user_id', $requests.'.owner_id')
                    ->whereColumn($consents.'.purpose', $requests.'.consent_purpose')->whereNotNull('granted_at')
                    ->where($consents.'.id', DB::table($consents.' as latest_consent')->select('latest_consent.id')
                        ->whereColumn('latest_consent.user_id', $consents.'.user_id')
                        ->whereColumn('latest_consent.purpose', $consents.'.purpose')
                        ->orderByDesc('latest_consent.occurred_at')->orderByDesc('latest_consent.id')->limit(1));
            });
    }

    /** @return array<string, mixed> */
    public function page(User $actor, Institution $institution, bool $reviewer, int $page = 1): array
    {
        $enabled = $this->governance->enabled($institution);
        $installed = Schema::hasTable((new OpportunitySupportRequest)->getTable())
            && Schema::hasTable((new OpportunitySupportEvent)->getTable());
        if (! $installed || ($reviewer && ! $enabled)) {
            return ['data' => [], 'page' => 1, 'last_page' => 1, 'total' => 0, 'installed' => $installed];
        }
        $query = $reviewer ? $this->exposed($institution)
            : OpportunitySupportRequest::query()->where('institution_id', $institution->getKey())->where('owner_id', $actor->getKey());
        $result = $query->with(['owner', 'events.projectRole.project'])->latest('id')->paginate(10, ['*'], 'page', $page);

        return [
            'data' => $result->getCollection()->map(fn (OpportunitySupportRequest $request) => $this->serialize($actor, $request))->all(),
            'page' => $result->currentPage(), 'last_page' => $result->lastPage(), 'total' => $result->total(), 'installed' => true,
        ];
    }

    /** @return array<string, mixed> */
    public function serialize(User $actor, OpportunitySupportRequest $request): array
    {
        Gate::forUser($actor)->authorize('view', $request);
        $request->loadMissing(['owner', 'events.projectRole.project']);

        return [
            'id' => $request->getKey(), 'need' => $request->need, 'explanation' => $request->explanation,
            'owner_name' => $request->owner->name, 'status' => $request->status, 'revision' => $request->revision,
            'created_at' => $request->created_at->toISOString(), 'expires_at' => $request->expires_at->toISOString(),
            'permissions' => [
                'review' => Gate::forUser($actor)->allows('review', $request),
                'respond' => Gate::forUser($actor)->allows('respond', $request),
                'withdraw' => Gate::forUser($actor)->allows('withdraw', $request),
            ],
            'events' => $request->events->sortBy('revision')->map(function (OpportunitySupportEvent $event) use ($actor, $request): array {
                $role = $event->projectRole;
                $project = $role?->project;
                $visible = $project !== null && $project->institution_id === $request->institution_id
                    && $project->visibility !== ProjectVisibility::Private && Gate::forUser($actor)->allows('view', $project);

                return [
                    'id' => $event->getKey(), 'action' => $event->action, 'reason' => $event->reason,
                    'created_at' => $event->created_at->toISOString(), 'revision' => $event->revision,
                    'opportunity' => $visible ? ['project_id' => $project->getKey(), 'project_title' => $project->title, 'role_title' => $role->title] : null,
                ];
            })->values()->all(),
        ];
    }

    /** @return list<array{id:int, label:string, accepts_beginners:bool|null}> */
    public function opportunities(User $actor, Institution $institution): array
    {
        $roles = ProjectRole::query()->with(['project' => fn (Relation $q) => $q->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeMembers(...)])])->withCount(['teamMemberships as occupied_count' => ProjectOpportunityCapacity::activeRoleMembers(...)])->whereHas('project', fn (Builder $q) => $q
            ->where('institution_id', $institution->getKey())->where('visibility', '!=', ProjectVisibility::Private)
            ->whereIn('status', ['open', 'forming'])->where('deadline', '>', now()))
            ->orderBy('id')->limit(100)->get();

        $options = [];
        foreach ($roles as $role) {
            if (Gate::forUser($actor)->allows('view', $role->project)
                && ProjectOpportunityCapacity::role($role, $role->project)['accepting']) {
                $options[] = ['id' => $role->id, 'label' => $role->project->title.' / '.$role->title, 'accepts_beginners' => $role->accepts_beginners];
            }
        }

        return $options;
    }
}
