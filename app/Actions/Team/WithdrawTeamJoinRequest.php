<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestReceivedNotification;
use App\Support\Team\TeamDecisionSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class WithdrawTeamJoinRequest
{
    public function __construct(private readonly TeamMembershipTransition $transition, private readonly AuditRecorder $audit) {}

    public function handle(User $actor, TeamJoinRequest $request, string $expectedRevision): TeamJoinRequest
    {
        Gate::forUser($actor)->authorize('withdraw', $request);

        return DB::transaction(function () use ($actor, $request, $expectedRevision): TeamJoinRequest {
            $project = $this->transition->lockProject($request->project);
            $lockedRequest = TeamJoinRequest::query()->whereBelongsTo($project)->whereKey($request->getKey())->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize('withdraw', $lockedRequest);
            TeamDecisionSnapshot::ensurePending($lockedRequest, $expectedRevision);
            $lockedRequest->forceFill(['status' => TeamJoinRequestStatus::Withdrawn, 'pending_key' => null, 'responded_at' => now(), 'response_reason' => null])->save();
            $this->audit->record(
                operation: 'team.join_request.withdrawn', auditable: $lockedRequest, actor: $actor, institution: $project->institution,
                before: ['status' => 'pending'], after: ['status' => 'withdrawn', 'join_request_id' => $lockedRequest->getKey(), 'project_id' => $project->getKey()],
            );
            $project->owner->notify(new TeamJoinRequestReceivedNotification($lockedRequest));

            return $lockedRequest->refresh();
        }, attempts: 5);
    }
}
