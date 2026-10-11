<?php

declare(strict_types=1);

namespace App\Support\Team;

use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use LogicException;

final class TeamFormationSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serialize(Project $project, User $viewer): array
    {
        Gate::forUser($viewer)->authorize('view', $project);
        $activeMemberCount = TeamMembership::query()
            ->whereBelongsTo($project)
            ->active()
            ->count();
        $isOwner = $project->owner_id === $viewer->getKey() && Gate::forUser($viewer)->allows('update', $project);
        $currentMembership = TeamMembership::query()
            ->with('projectRole:id,title,selection_criteria')
            ->whereBelongsTo($project)
            ->whereBelongsTo($viewer)
            ->active()
            ->first();
        $pendingInvitations = TeamInvitation::query()
            ->with([
                'inviter:id,name',
                'projectRole:id,title',
            ])
            ->whereBelongsTo($project)
            ->whereBelongsTo($viewer, 'invitee')
            ->pending()
            ->latest('created_at')
            ->latest('id')
            ->get();
        $pendingJoinRequest = TeamJoinRequest::query()
            ->with('projectRole:id,title,selection_criteria')
            ->whereBelongsTo($project)
            ->whereBelongsTo($viewer, 'requester')
            ->pending()
            ->latest('requested_at')
            ->latest('id')
            ->first();

        $joinRequests = $isOwner
            ? TeamJoinRequest::query()
                ->with([
                    'requester:id,name',
                    'projectRole:id,title,selection_criteria',
                ])
                ->whereBelongsTo($project)
                ->pending()
                ->latest('requested_at')
                ->latest('id')
                ->get()
            : new EloquentCollection;
        if ($isOwner && $joinRequests->isNotEmpty()) {
            $entryTable = (new PortfolioEntry)->getTable();
            $contributionTable = (new Contribution)->getTable();
            $versionTable = (new ContributionVersion)->getTable();
            $sharedWork = PortfolioEntry::query()->forInstitution($project->institution_id)->visibleToInstitution()
                ->whereHas('contribution', fn (Builder $source) => $source
                    ->whereColumn($contributionTable.'.institution_id', $entryTable.'.institution_id')
                    ->whereColumn($contributionTable.'.owner_id', $entryTable.'.user_id'))
                ->whereHas('sourceVersion', fn (Builder $version) => $version->whereColumn($versionTable.'.contribution_id', $entryTable.'.contribution_id'));
            $joinRequests->load(['requester:id,name', 'requester.portfolioEntries' => function (Relation $relation) use ($sharedWork): void {
                if (! $relation instanceof HasMany || ! $relation->getRelated() instanceof PortfolioEntry) {
                    throw new LogicException('Karya pemohon harus memakai relasi portofolio.');
                }
                $relation->limit(3);
                $relation->getQuery()->mergeConstraintsFrom($sharedWork)->latest('published_at')->latest('id')
                    ->select(['id', 'institution_id', 'user_id', 'contribution_id', 'contribution_version_id', 'title', 'summary', 'verification_level']);
            }]);
        }
        $sentInvitations = $isOwner
            ? TeamInvitation::query()
                ->with([
                    'invitee:id,name',
                    'projectRole:id,title',
                ])
                ->whereBelongsTo($project)
                ->whereBelongsTo($viewer, 'inviter')
                ->pending()
                ->latest('created_at')
                ->latest('id')
                ->get()
            : collect();
        $activeMembers = $isOwner
            ? TeamMembership::query()
                ->with([
                    'user:id,name',
                    'projectRole:id,title',
                ])
                ->whereBelongsTo($project)
                ->active()
                ->latest('joined_at')
                ->latest('id')
                ->get()
            : collect();

        $isFull = $activeMemberCount >= $project->capacity;
        $context = $isOwner ? TeamDecisionSnapshot::context($project) : null;
        $roleCounts = $isOwner ? TeamMembership::query()->whereBelongsTo($project)->active()
            ->selectRaw('project_role_id, COUNT(*) as total')->groupBy('project_role_id')->pluck('total', 'project_role_id') : collect();
        $canReadOwn = Gate::forUser($viewer)->allows('viewHistory', [TeamJoinRequest::class, $project]);
        if (! $canReadOwn) {
            $pendingJoinRequest = null;
        }
        $history = TeamJoinRequest::query()->with(['projectRole:id,title,selection_criteria', 'requester:id,name'])
            ->whereBelongsTo($project)->where('status', '!=', 'pending');
        if (! $isOwner) {
            $history->whereBelongsTo($viewer, 'requester');
        }
        if (! $canReadOwn) {
            $history->whereRaw('1 = 0');
        }
        $historyPage = $history->latest('responded_at')->latest('id')->paginate(20, ['*'], 'team_history_page');
        $historyData = $historyPage->getCollection()->map(fn (TeamJoinRequest $request): array => $this->joinRequestPayload($request))->values()->all();

        return [
            'capacity' => [
                'total' => $project->capacity,
                'occupied' => $activeMemberCount,
                'remaining' => max(0, $project->capacity - $activeMemberCount),
                'state' => $isFull
                    ? 'full'
                    : ($project->acceptsMembers() ? 'open' : 'closed'),
                'is_full' => $isFull,
            ],
            'permissions' => [
                'can_request_join' => ! $isFull
                    && Gate::forUser($viewer)->allows('requestJoin', $project),
                'can_manage_requests' => $isOwner,
                'can_manage_invitations' => Gate::forUser($viewer)->allows('invite', $project),
                'can_leave' => $currentMembership !== null
                    && Gate::forUser($viewer)->allows('leave', $currentMembership),
                'can_withdraw' => $pendingJoinRequest !== null && Gate::forUser($viewer)->allows('withdraw', $pendingJoinRequest),
            ],
            'current_membership' => $currentMembership === null
                ? null
                : $this->membershipPayload($currentMembership),
            'pending_invitations' => $pendingInvitations
                ->map(fn (TeamInvitation $invitation): array => $this->invitationPayload($invitation))
                ->values()
                ->all(),
            'pending_join_request' => $pendingJoinRequest === null
                ? null
                : $this->joinRequestPayload($pendingJoinRequest),
            'join_requests' => $joinRequests
                ->map(function (TeamJoinRequest $request) use ($context, $project, $isFull, $activeMembers, $roleCounts): array {
                    $role = $project->roles->firstWhere('id', $request->project_role_id);
                    $canAccept = ! $isFull && $project->acceptsMembers()
                        && ! $activeMembers->contains('user_id', $request->requester_id)
                        && ($request->project_role_id === null || ($role !== null && $roleCounts->get($role->getKey(), 0) < $role->capacity));

                    return [...$this->joinRequestPayload($request, $context), 'can_accept' => $canAccept,
                        'shared_work' => $request->requester->portfolioEntries->map(fn (PortfolioEntry $entry): array => [
                            'id' => $entry->getKey(), 'title' => $entry->title, 'summary' => $entry->summary, 'verification_label' => $entry->verification_level->label(),
                        ])->all(),
                    ];
                })
                ->values()
                ->all(),
            'sent_invitations' => $sentInvitations
                ->map(fn (TeamInvitation $invitation): array => $this->invitationPayload($invitation))
                ->values()
                ->all(),
            'active_members' => $activeMembers
                ->map(fn (TeamMembership $membership): array => $this->membershipPayload($membership))
                ->values()
                ->all(),
            'request_history' => ['data' => $historyData, 'current_page' => $historyPage->currentPage(), 'last_page' => $historyPage->lastPage()],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function invitationPayload(TeamInvitation $invitation): array
    {
        $person = $invitation->relationLoaded('invitee')
            ? $invitation->invitee
            : ($invitation->relationLoaded('inviter') ? $invitation->inviter : null);

        return [
            'id' => $invitation->getKey(),
            'project_role_id' => $invitation->project_role_id,
            'role' => $invitation->projectRole === null
                ? null
                : [
                    'id' => $invitation->projectRole->getKey(),
                    'title' => $invitation->projectRole->title,
                ],
            'person' => $person === null
                ? null
                : [
                    'id' => $person->getKey(),
                    'name' => $person->name,
                ],
            'status' => $invitation->status->value,
            'expires_at' => $invitation->expires_at->toIso8601String(),
            'is_expired' => $invitation->expires_at->isPast(),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $context
     * @return array<string, mixed>
     */
    private function joinRequestPayload(TeamJoinRequest $request, ?array $context = null): array
    {
        $requester = $request->relationLoaded('requester') ? $request->requester : null;

        return [
            'id' => $request->getKey(),
            'project_role_id' => $request->project_role_id,
            'role' => $request->projectRole === null
                ? null
                : [
                    'id' => $request->projectRole->getKey(),
                    'title' => $request->projectRole->title,
                    'selection_criteria' => $request->projectRole->selection_criteria,
                ],
            'requester' => $requester === null
                ? null
                : [
                    'id' => $requester->getKey(),
                    'name' => $requester->name,
                ],
            'status' => $request->status->value,
            'message' => $request->message,
            'requested_at' => $request->requested_at->toIso8601String(),
            'responded_at' => $request->responded_at?->toIso8601String(),
            'response_reason' => $request->response_reason,
            'revision' => TeamDecisionSnapshot::revision($request, $context),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function membershipPayload(TeamMembership $membership): array
    {
        $user = $membership->relationLoaded('user') ? $membership->user : null;

        return [
            'id' => $membership->getKey(),
            'user' => $user === null
                ? null
                : [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                ],
            'role' => $membership->projectRole === null
                ? null
                : [
                    'id' => $membership->projectRole->getKey(),
                    'title' => $membership->projectRole->title,
                ],
            'status' => $membership->status->value,
            'joined_at' => $membership->joined_at?->toIso8601String(),
        ];
    }
}
