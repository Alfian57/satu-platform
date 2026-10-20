<?php

namespace App\Http\Controllers;

use App\Actions\Institution\ChangeUniversityAdminStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Http\Requests\Institution\ChangeUniversityAdminStatusRequest;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use App\Support\Auth\UniversityAdminRevision;
use App\Support\PhoneIdentity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class UniversityAdminController extends Controller
{
    public function index(Request $request, Institution $institution): JsonResponse|Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isUniversityAdmin($institution), 403);

        $memberships = $institution->memberships()->where('role', InstitutionMembershipRole::CampusAdmin)
            ->with('user:id,name')->orderBy('id')->get();
        $lastAudits = AuditLog::query()->where('auditable_type', (new InstitutionMembership)->getMorphClass())
            ->whereIn('auditable_id', $memberships->modelKeys())->select('auditable_id')
            ->selectRaw('MAX(id) as last_id')->groupBy('auditable_id')->pluck('last_id', 'auditable_id');

        Gate::forUser($user)->authorize('viewAny', [PrivilegedInvitation::class, $institution]);
        $result = ['institution' => $institution->only(['id', 'name']), 'data' => $memberships->map(static fn (InstitutionMembership $membership): array => [
            'id' => $membership->id, 'user_id' => $membership->user_id, 'name' => $membership->user->name,
            'status' => $membership->status->value, 'revision' => UniversityAdminRevision::make($membership, (int) $lastAudits->get($membership->id, 0)),
        ]), 'invitations' => $institution->privilegedInvitations()->where('intended_role', InstitutionMembershipRole::CampusAdmin->value)
            ->latest('id')->paginate(12)->through(static fn (PrivilegedInvitation $invitation): array => [
                'id' => $invitation->id, 'phone_masked' => PhoneIdentity::mask($invitation->phone),
                'status' => $invitation->isIssued() && $invitation->isExpired() ? 'expired' : $invitation->status->value,
                'delivery_status' => $invitation->delivery_status, 'expires_at' => $invitation->expires_at->toIso8601String(),
                'can_revoke' => $invitation->isIssued() && ! $invitation->isExpired(),
            ])];

        return $request->header('X-Inertia') === 'true' || ! $request->expectsJson()
            ? Inertia::render('university/admins', $result) : response()->json($result);
    }

    public function update(ChangeUniversityAdminStatusRequest $request, InstitutionMembership $membership, ChangeUniversityAdminStatus $change): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 403);
        $changed = $change->handle($actor, $membership, InstitutionMembershipStatus::from((string) $request->validated('status')),
            (string) $request->validated('expected_revision'), (string) $request->validated('reason'));

        return response()->json(['data' => ['id' => $changed->id, 'status' => $changed->status->value, 'revision' => UniversityAdminRevision::make($changed)]]);
    }
}
