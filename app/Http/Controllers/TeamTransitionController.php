<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Team\AcceptTeamInvitation;
use App\Actions\Team\AcceptTeamJoinRequest;
use App\Actions\Team\InviteTeamMember;
use App\Actions\Team\LeaveTeam;
use App\Actions\Team\RejectTeamInvitation;
use App\Actions\Team\RejectTeamJoinRequest;
use App\Actions\Team\RemoveTeamMember;
use App\Actions\Team\RequestToJoinTeam;
use App\Actions\Team\RevokeTeamInvitation;
use App\Exceptions\InvalidTeamTransition;
use App\Http\Requests\Team\InviteTeamMemberRequest;
use App\Http\Requests\Team\LeaveTeamRequest;
use App\Http\Requests\Team\RemoveTeamMemberRequest;
use App\Http\Requests\Team\RequestToJoinTeamRequest;
use App\Http\Requests\Team\TeamDecisionRequest;
use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

final class TeamTransitionController extends Controller
{
    public function invite(
        InviteTeamMemberRequest $request,
        Project $project,
        InviteTeamMember $invite,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();
        $invitation = $invite->handle(
            actor: $user,
            project: $project,
            invitee: User::query()->whereKey($validated['invitee_id'])->firstOrFail(),
            projectRoleId: $validated['project_role_id'] ?? null,
            expiresAt: isset($validated['expires_at'])
                ? Carbon::parse($validated['expires_at'])
                : null,
        );

        return response()->json(['data' => $this->invitationPayload($invitation)], 201);
    }

    public function requestJoin(
        RequestToJoinTeamRequest $request,
        Project $project,
        RequestToJoinTeam $requestToJoin,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $joinRequest = $requestToJoin->handle(
            requester: $user,
            project: $project,
            projectRoleId: $data['project_role_id'] ?? null,
            message: $data['message'] ?? null,
        );

        return response()->json(['data' => $this->requestPayload($joinRequest)], 201);
    }

    public function acceptInvitation(
        TeamDecisionRequest $request,
        TeamInvitation $teamInvitation,
        AcceptTeamInvitation $accept,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $invitation = $accept->handle($user, $teamInvitation);
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->invitationPayload($invitation)]);
    }

    public function rejectInvitation(
        TeamDecisionRequest $request,
        TeamInvitation $teamInvitation,
        RejectTeamInvitation $reject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $invitation = $reject->handle($user, $teamInvitation, $request->validated()['reason'] ?? null);
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->invitationPayload($invitation)]);
    }

    public function revokeInvitation(
        TeamDecisionRequest $request,
        TeamInvitation $teamInvitation,
        RevokeTeamInvitation $revoke,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $invitation = $revoke->handle($user, $teamInvitation, $request->validated()['reason'] ?? null);

        return response()->json(['data' => $this->invitationPayload($invitation)]);
    }

    public function acceptJoinRequest(
        TeamDecisionRequest $request,
        TeamJoinRequest $teamJoinRequest,
        AcceptTeamJoinRequest $accept,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $joinRequest = $accept->handle($user, $teamJoinRequest);
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->requestPayload($joinRequest)]);
    }

    public function rejectJoinRequest(
        TeamDecisionRequest $request,
        TeamJoinRequest $teamJoinRequest,
        RejectTeamJoinRequest $reject,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $joinRequest = $reject->handle($user, $teamJoinRequest, $request->validated()['reason'] ?? null);
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->requestPayload($joinRequest)]);
    }

    public function leave(
        LeaveTeamRequest $request,
        TeamMembership $teamMembership,
        LeaveTeam $leave,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $membership = $leave->handle($user, $teamMembership, $request->input('reason'));
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->membershipPayload($membership)]);
    }

    public function remove(
        RemoveTeamMemberRequest $request,
        TeamMembership $teamMembership,
        RemoveTeamMember $remove,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $membership = $remove->handle($user, $teamMembership, $request->validated()['reason']);
        } catch (InvalidTeamTransition $exception) {
            $this->throwTransitionValidation($exception);
        }

        return response()->json(['data' => $this->membershipPayload($membership)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function invitationPayload(TeamInvitation $invitation): array
    {
        return [
            'id' => $invitation->getKey(),
            'project_id' => $invitation->project_id,
            'project_role_id' => $invitation->project_role_id,
            'inviter_id' => $invitation->inviter_id,
            'invitee_id' => $invitation->invitee_id,
            'status' => $invitation->status->value,
            'expires_at' => $invitation->expires_at->toIso8601String(),
            'responded_at' => $invitation->responded_at?->toIso8601String(),
            'response_reason' => $invitation->response_reason,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function requestPayload(TeamJoinRequest $request): array
    {
        return [
            'id' => $request->getKey(),
            'project_id' => $request->project_id,
            'project_role_id' => $request->project_role_id,
            'requester_id' => $request->requester_id,
            'status' => $request->status->value,
            'message' => $request->message,
            'requested_at' => $request->requested_at->toIso8601String(),
            'responded_at' => $request->responded_at?->toIso8601String(),
            'response_reason' => $request->response_reason,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function membershipPayload(TeamMembership $membership): array
    {
        return [
            'id' => $membership->getKey(),
            'project_id' => $membership->project_id,
            'user_id' => $membership->user_id,
            'project_role_id' => $membership->project_role_id,
            'status' => $membership->status->value,
            'joined_at' => $membership->joined_at?->toIso8601String(),
            'left_at' => $membership->left_at?->toIso8601String(),
            'removed_at' => $membership->removed_at?->toIso8601String(),
            'removal_reason' => $membership->removal_reason,
        ];
    }

    private function throwTransitionValidation(InvalidTeamTransition $exception): never
    {
        throw ValidationException::withMessages([
            'transition' => $exception->getMessage(),
        ]);
    }
}
