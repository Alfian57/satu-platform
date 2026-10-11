<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipEventType;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestRespondedNotification;
use App\Support\Team\TeamDecisionSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class AcceptTeamJoinRequest
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
        private readonly ResolvePendingTeamOffers $pendingOffers,
    ) {}

    public function handle(User $actor, TeamJoinRequest $request, string $reason, string $expectedRevision): TeamJoinRequest
    {
        Gate::forUser($actor)->authorize('decide', $request);
        $reason = $this->transition->normalizeReason($reason, required: true);

        return DB::transaction(function () use ($actor, $request, $reason, $expectedRevision): TeamJoinRequest {
            $project = $this->transition->lockProject($request->project);
            $lockedRequest = TeamJoinRequest::query()
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->whereBelongsTo($project)
                ->firstOrFail();

            Gate::forUser($actor)->authorize('decide', $lockedRequest);
            TeamDecisionSnapshot::ensurePending($lockedRequest, $expectedRevision, TeamDecisionSnapshot::context($project));
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
                sourceType: 'join_request',
                reason: $reason,
            );

            $before = $this->summary($lockedRequest);
            $lockedRequest->forceFill([
                'status' => TeamJoinRequestStatus::Accepted,
                'pending_key' => null,
                'responded_at' => now(),
                'response_reason' => $reason,
            ])->save();
            $this->pendingOffers->handle($project, $requester, $actor);

            $this->audit->record(
                operation: 'team.join_request.accepted',
                auditable: $lockedRequest,
                actor: $actor,
                institution: $project->institution,
                before: $before,
                after: [...$this->summary($lockedRequest), 'selection_criteria' => $role?->selection_criteria, 'reviewed_revision' => $expectedRevision],
                reason: $reason,
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
