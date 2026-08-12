<?php

declare(strict_types=1);

namespace App\Support\Team;

use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

final class TeamFormationSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serialize(Project $project, User $viewer): array
    {
        $activeMemberCount = TeamMembership::query()
            ->whereBelongsTo($project)
            ->active()
            ->count();
        $isOwner = $project->owner_id === $viewer->getKey();
        $currentMembership = TeamMembership::query()
            ->with('projectRole:id,title')
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
            ->with('projectRole:id,title')
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
                    'projectRole:id,title',
                ])
                ->whereBelongsTo($project)
                ->pending()
                ->latest('requested_at')
                ->latest('id')
                ->get()
            : collect();
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
                ->map(fn (TeamJoinRequest $request): array => $this->joinRequestPayload($request))
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
     * @return array<string, mixed>
     */
    private function joinRequestPayload(TeamJoinRequest $request): array
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
