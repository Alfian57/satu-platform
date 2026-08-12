<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipEventType;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestRespondedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class AcceptTeamJoinRequest
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, TeamJoinRequest $request): TeamJoinRequest
    {
        Gate::forUser($actor)->authorize('accept', $request);

        return DB::transaction(function () use ($actor, $request): TeamJoinRequest {
            $project = $this->transition->lockProject($request->project);
            $lockedRequest = TeamJoinRequest::query()
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('accept', $lockedRequest);
            $this->transition->ensureProjectAcceptsMembers($project);
            $requester = User::query()->findOrFail($lockedRequest->requester_id);
            $this->transition->ensureVerifiedStudent($requester, $project);
            $role = $this->transition->resolveRole($project, $lockedRequest->project_role_id);
            $existingMembership = $this->transition->lockMembership($project, $requester);
            $this->transition->ensureAvailableCapacity($project, $role, $existingMembership);

            $this->transition->saveMembership(
                project: $project,
                member: $requester,
                role: $role,
                actor: $actor,
                eventType: $existingMembership === null
                    ? TeamMembershipEventType::Joined
                    : TeamMembershipEventType::Rejoined,
                operation: $existingMembership === null
                    ? 'team.membership.joined'
                    : 'team.membership.rejoined',
                sourceId: $lockedRequest->getKey(),
            );

            $before = $this->summary($lockedRequest);
            $lockedRequest->forceFill([
                'status' => TeamJoinRequestStatus::Accepted,
                'pending_key' => null,
                'responded_at' => now(),
                'response_reason' => null,
            ])->save();

            $this->audit->record(
                operation: 'team.join_request.accepted',
                auditable: $lockedRequest,
                actor: $actor,
                institution: $project->institution,
                before: $before,
                after: $this->summary($lockedRequest),
            );

            $lockedRequest->load('requester');
            $lockedRequest->requester->notify(
                new TeamJoinRequestRespondedNotification($lockedRequest, $actor, 'accepted'),
            );

            return $lockedRequest->refresh();
        }, attempts: 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(TeamJoinRequest $request): array
    {
        return [
            'join_request_id' => $request->getKey(),
            'project_id' => $request->project_id,
            'requester_id' => $request->requester_id,
            'status' => $request->status->value,
        ];
    }
}
