<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Institution\IssueInvitation;
use App\Actions\Institution\RevokeInvitation;
use App\Enums\InstitutionMembershipRole;
use App\Http\Requests\Institution\IssueInvitationRequest;
use App\Http\Requests\Institution\RevokeInvitationRequest;
use App\Models\Institution;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;

final class PlatformInvitationController extends Controller
{
    public function store(
        IssueInvitationRequest $request,
        Institution $institution,
        IssueInvitation $issueInvitation,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $invitation = $issueInvitation->handle(
            actor: $user,
            institution: $institution,
            phone: (string) $request->validated('phone'),
            intendedRole: InstitutionMembershipRole::CampusAdmin->value,
        );

        return response()->json([
            'data' => [
                'id' => $invitation->getKey(),
                'status' => $invitation->status->value,
                'delivery_status' => $invitation->delivery_status,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ], 201);
    }

    public function revoke(
        RevokeInvitationRequest $request,
        PrivilegedInvitation $invitation,
        RevokeInvitation $revokeInvitation,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $revokeInvitation->handle(
            actor: $user,
            invitation: $invitation,
            reason: (string) $request->validated('reason'),
        );

        return response()->json([
            'data' => [
                'id' => $invitation->getKey(),
                'status' => 'revoked',
            ],
        ]);
    }
}
