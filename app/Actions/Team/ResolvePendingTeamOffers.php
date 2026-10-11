<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TeamInvitationStatus;
use App\Enums\TeamJoinRequestStatus;
use App\Models\Project;
use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Notifications\TeamInvitationRespondedNotification;
use App\Notifications\TeamJoinRequestRespondedNotification;

final class ResolvePendingTeamOffers
{
    public function __construct(private readonly AuditRecorder $audit) {}

    /** Dipanggil setelah penerimaan, di dalam transaksi yang memegang lock proyek. */
    public function handle(Project $project, User $member, User $actor): void
    {
        $reason = 'Keanggotaan aktif telah terbentuk melalui jalur lain. Tawaran ini berakhir, bukan penolakan kemampuan.';
        $requests = TeamJoinRequest::query()->whereBelongsTo($project)->whereBelongsTo($member, 'requester')->pending()->lockForUpdate()->get();
        foreach ($requests as $request) {
            $request->forceFill(['status' => TeamJoinRequestStatus::Expired, 'pending_key' => null, 'responded_at' => now(), 'response_reason' => $reason])->save();
            $this->audit->record(operation: 'team.join_request.superseded', auditable: $request, actor: $actor, institution: $project->institution, before: ['status' => 'pending'], after: ['status' => 'expired', 'project_id' => $project->getKey(), 'requester_id' => $member->getKey()], reason: $reason);
            $member->notify(new TeamJoinRequestRespondedNotification($request, $actor, 'expired'));
        }
        $invitations = TeamInvitation::query()->whereBelongsTo($project)->whereBelongsTo($member, 'invitee')->pending()->lockForUpdate()->get();
        foreach ($invitations as $invitation) {
            $invitation->forceFill(['status' => TeamInvitationStatus::Expired, 'pending_key' => null, 'responded_at' => now(), 'response_reason' => $reason])->save();
            $this->audit->record(operation: 'team.invitation.superseded', auditable: $invitation, actor: $actor, institution: $project->institution, before: ['status' => 'pending'], after: ['status' => 'expired', 'project_id' => $project->getKey(), 'invitee_id' => $member->getKey()], reason: $reason);
            $member->notify(new TeamInvitationRespondedNotification($invitation, $actor, 'expired'));
        }
    }
}
