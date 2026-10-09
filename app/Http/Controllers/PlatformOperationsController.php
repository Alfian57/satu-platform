<?php

namespace App\Http\Controllers;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\InvitationStatus;
use App\Enums\MessageStatus;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\MessageOutbox;
use App\Models\PrivilegedInvitation;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterOrganization;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class PlatformOperationsController extends Controller
{
    public function index(Request $request): Response
    {
        $actor = $request->user();

        abort_unless($actor instanceof User && $actor->is_platform_admin, 403);

        $query = $request->string('q')->trim()->limit(100)->toString();
        $status = InstitutionStatus::tryFrom($request->string('status')->toString());
        $now = now();

        $institutionsQuery = Institution::query()
            ->select(['id', 'name', 'slug', 'status', 'updated_at'])
            ->withCount([
                'memberships as verified_campus_admins_count' => fn ($membershipQuery) => $membershipQuery
                    ->where('role', InstitutionMembershipRole::CampusAdmin)
                    ->where('status', InstitutionMembershipStatus::Verified),
                'privilegedInvitations as open_invitations_count' => fn ($invitationQuery) => $invitationQuery
                    ->where('status', InvitationStatus::Issued)
                    ->where('expires_at', '>', $now),
            ])
            ->orderBy('name');

        if ($query !== '') {
            $institutionsQuery->where(function ($institutionQuery) use ($query): void {
                $institutionQuery
                    ->where('name', 'like', '%'.$query.'%')
                    ->orWhere('slug', 'like', '%'.$query.'%');
            });
        }

        if ($status !== null) {
            $institutionsQuery->where('status', $status);
        }

        $institutions = $institutionsQuery->get();

        $invitations = PrivilegedInvitation::query()
            ->with('institution:id,name')
            ->select([
                'id',
                'institution_id',
                'phone',
                'status',
                'expires_at',
                'delivery_status',
                'created_at',
            ])
            ->latest('created_at')
            ->limit(12)
            ->get();

        $recruiterOrganizations = RecruiterOrganization::query()
            ->select(['id', 'name', 'industry', 'status', 'created_at'])
            ->with([
                'entitlements' => fn ($entitlementQuery) => $entitlementQuery
                    ->where('status', RecruiterEntitlementStatus::Active)
                    ->where('starts_at', '<=', $now)
                    ->where(function ($activeEntitlementQuery) use ($now): void {
                        $activeEntitlementQuery
                            ->whereNull('ends_at')
                            ->orWhere('ends_at', '>=', $now);
                    }),
            ])
            ->withCount([
                'memberships as active_memberships_count' => fn ($membershipQuery) => $membershipQuery
                    ->where('status', RecruiterMembershipStatus::Active),
                'entitlements as active_entitlements_count' => fn ($entitlementQuery) => $entitlementQuery
                    ->where('status', RecruiterEntitlementStatus::Active)
                    ->where('starts_at', '<=', $now)
                    ->where(function ($activeEntitlementQuery) use ($now): void {
                        $activeEntitlementQuery
                            ->whereNull('ends_at')
                            ->orWhere('ends_at', '>=', $now);
                    }),
            ])
            ->latest('created_at')
            ->limit(8)
            ->get();

        $outboxTotals = MessageOutbox::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentFailedOutbox = MessageOutbox::query()
            ->select([
                'id',
                'purpose',
                'status',
                'attempts',
                'max_attempts',
                'updated_at',
            ])
            ->where('status', MessageStatus::Failed)
            ->latest('updated_at')
            ->limit(8)
            ->get();

        $recentAuditLogs = AuditLog::query()
            ->select([
                'id',
                'institution_id',
                'actor_id',
                'operation',
                'reason',
                'created_at',
            ])
            ->with([
                'actor:id,name',
                'institution:id,name',
            ])
            ->latest('created_at')
            ->limit(12)
            ->get();

        return Inertia::render('platform/operations', [
            'filters' => [
                'q' => $query,
                'status' => $status !== null ? $status->value : 'all',
            ],
            'summary' => [
                'pendingInstitutions' => Institution::query()
                    ->where('status', InstitutionStatus::Pending)
                    ->count(),
                'openInvitations' => PrivilegedInvitation::query()
                    ->where('status', InvitationStatus::Issued)
                    ->where('expires_at', '>', $now)
                    ->count(),
                'pendingRecruiterOrganizations' => RecruiterOrganization::query()
                    ->where('status', RecruiterOrganizationStatus::Pending)
                    ->count(),
                'failedMessages' => (int) ($outboxTotals->get(MessageStatus::Failed->value) ?? 0),
            ],
            'institutions' => $institutions
                ->map(fn (Institution $institution): array => [
                    'id' => $institution->getKey(),
                    'name' => $institution->name,
                    'slug' => $institution->slug,
                    'status' => $institution->status->value,
                    'verifiedCampusAdminsCount' => (int) $institution->getAttribute('verified_campus_admins_count'),
                    'openInvitationsCount' => (int) $institution->getAttribute('open_invitations_count'),
                    'updatedAt' => $institution->updated_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
            'invitations' => $invitations
                ->map(fn (PrivilegedInvitation $invitation): array => [
                    'id' => $invitation->getKey(),
                    'institutionName' => $invitation->institution->name,
                    'phoneMasked' => PhoneIdentity::mask($invitation->phone),
                    'status' => $invitation->status->value,
                    'deliveryStatus' => $invitation->delivery_status,
                    'expiresAt' => $invitation->expires_at->toIso8601String(),
                    'createdAt' => $invitation->created_at->toIso8601String(),
                    'canRevoke' => $invitation->status === InvitationStatus::Issued
                        && $invitation->expires_at->isFuture(),
                ])
                ->values()
                ->all(),
            'recruiterOrganizations' => $recruiterOrganizations
                ->map(fn (RecruiterOrganization $organization): array => [
                    'id' => $organization->getKey(),
                    'name' => $organization->name,
                    'industry' => $organization->industry,
                    'status' => $organization->status->value,
                    'activeMembershipsCount' => (int) $organization->getAttribute('active_memberships_count'),
                    'activeEntitlementsCount' => (int) $organization->getAttribute('active_entitlements_count'),
                    'createdAt' => $organization->created_at->toIso8601String(),
                    'activeEntitlements' => $organization->entitlements
                        ->map(fn (RecruiterEntitlement $entitlement): array => [
                            'id' => $entitlement->getKey(),
                            'scope' => $entitlement->scope->value,
                            'status' => $entitlement->status->value,
                            'startsAt' => $entitlement->starts_at->toIso8601String(),
                            'endsAt' => $entitlement->ends_at?->toIso8601String(),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
            'provider' => [
                'totals' => collect(MessageStatus::cases())
                    ->mapWithKeys(fn (MessageStatus $messageStatus): array => [
                        $messageStatus->value => (int) ($outboxTotals->get($messageStatus->value) ?? 0),
                    ])
                    ->all(),
                'recentFailures' => $recentFailedOutbox
                    ->map(fn (MessageOutbox $outbox): array => [
                        'id' => $outbox->getKey(),
                        'purpose' => $outbox->purpose->value,
                        'attempts' => $outbox->attempts,
                        'maxAttempts' => $outbox->max_attempts,
                        'updatedAt' => $outbox->updated_at->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ],
            'auditLogs' => $recentAuditLogs
                ->map(fn (AuditLog $auditLog): array => [
                    'id' => $auditLog->getKey(),
                    'operation' => $auditLog->operation,
                    'reason' => $auditLog->reason,
                    'actorName' => $auditLog->actor_id === null
                        ? 'Sistem'
                        : $auditLog->actor->name,
                    'institutionName' => $auditLog->institution_id === null
                        ? null
                        : $auditLog->institution->name,
                    'createdAt' => $auditLog->created_at->toIso8601String(),
                ])
                ->values()
                ->all(),
        ]);
    }
}
