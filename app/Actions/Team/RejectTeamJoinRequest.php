<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestRespondedNotification;
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
        ?string $reason = null,
    ): TeamJoinRequest {
        Gate::forUser($actor)->authorize('reject', $request);
        $reason = $this->transition->normalizeReason($reason);

        return DB::transaction(function () use ($actor, $request, $reason): TeamJoinRequest {
            $project = $this->transition->lockProject($request->project);
            $lockedRequest = TeamJoinRequest::query()
                ->lockForUpdate()
                ->whereKey($request->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('reject', $lockedRequest);
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
                after: $this->summary($lockedRequest),
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
