<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipStatus;
use App\Exceptions\InvalidTeamTransition;
use App\Models\Project;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamJoinRequestReceivedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RequestToJoinTeam
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $requester,
        Project $project,
        ?int $projectRoleId = null,
        ?string $message = null,
    ): TeamJoinRequest {
        Gate::forUser($requester)->authorize('requestJoin', $project);

        $message = $message === null ? null : (string) Str::of($message)->squish();

        if ($message !== null && Str::length($message) > 1000) {
            throw ValidationException::withMessages([
                'message' => 'Pesan tidak boleh lebih dari 1000 karakter.',
            ]);
        }

        return DB::transaction(function () use (
            $requester,
            $project,
            $projectRoleId,
            $message,
        ): TeamJoinRequest {
            $lockedProject = $this->transition->lockProject($project);
            Gate::forUser($requester)->authorize('requestJoin', $lockedProject);
            $this->transition->ensureProjectAcceptsMembers($lockedProject);
            $this->transition->ensureVerifiedStudent($requester, $lockedProject);

            $role = $this->transition->resolveRole($lockedProject, $projectRoleId);
            $membership = $this->transition->lockMembership($lockedProject, $requester);

            if ($membership?->status === TeamMembershipStatus::Active) {
                throw new InvalidTeamTransition('User sudah menjadi anggota aktif pada project ini.');
            }

            $pending = TeamJoinRequest::query()
                ->lockForUpdate()
                ->where('project_id', $lockedProject->getKey())
                ->where('requester_id', $requester->getKey())
                ->where('status', TeamJoinRequestStatus::Pending)
                ->first();

            if ($pending !== null) {
                throw ValidationException::withMessages([
                    'project_id' => 'Masih ada join request yang pending untuk project ini.',
                ]);
            }

            $joinRequest = TeamJoinRequest::query()->forceCreate([
                'project_id' => $lockedProject->getKey(),
                'project_role_id' => $role?->getKey(),
                'requester_id' => $requester->getKey(),
                'status' => TeamJoinRequestStatus::Pending,
                'pending_key' => 'pending',
                'message' => $message,
                'requested_at' => now(),
                'responded_at' => null,
                'response_reason' => null,
            ]);

            $this->audit->record(
                operation: 'team.join_request.created',
                auditable: $joinRequest,
                actor: $requester,
                institution: $lockedProject->institution,
                after: $this->requestSummary($joinRequest),
            );

            $lockedProject->owner->notify(new TeamJoinRequestReceivedNotification($joinRequest));

            return $joinRequest->refresh();
        }, attempts: 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestSummary(TeamJoinRequest $request): array
    {
        return [
            'join_request_id' => $request->getKey(),
            'project_id' => $request->project_id,
            'requester_id' => $request->requester_id,
            'status' => $request->status->value,
        ];
    }
}
