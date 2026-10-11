<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestRespondedNotification;
use App\Support\Team\TeamDecisionSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class RejectTeamJoinRequest
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        TeamJoinRequest $request,
        string $reason,
        string $expectedRevision,
    ): TeamJoinRequest {
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
            $role = $this->transition->resolveRole($project, $lockedRequest->project_role_id);
            $before = $this->summary($lockedRequest);
            $lockedRequest->forceFill([
                'status' => TeamJoinRequestStatus::Rejected,
                'pending_key' => null,
                'responded_at' => now(),
                'response_reason' => $reason,
            ])->save();

            $this->audit->record(
                operation: 'team.join_request.rejected',
                auditable: $lockedRequest,
                actor: $actor,
                institution: $project->institution,
                before: $before,
                after: [...$this->summary($lockedRequest), 'selection_criteria' => $role?->selection_criteria, 'reviewed_revision' => $expectedRevision],
                reason: $reason,
            );

            $lockedRequest->load('requester');
            $lockedRequest->requester->notify(
                new TeamJoinRequestRespondedNotification($lockedRequest, $actor, 'rejected'),
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
