<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

final class UnsaveCandidate
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Unsave a candidate projection for a recruiter organization idempotently.
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        int $candidateProjectionId,
    ): bool {
        if (! $recruiter->is_platform_admin) {
            $isMember = $organization->memberships()
                ->where('user_id', $recruiter->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->exists();

            if (! $isMember) {
                throw new AuthorizationException('Anda bukan anggota aktif dari organization perekrut ini.');
            }
        }

        return DB::transaction(function () use ($recruiter, $organization, $candidateProjectionId) {
            $saved = RecruiterSavedCandidate::query()
                ->where('recruiter_organization_id', $organization->id)
                ->where('talent_candidate_projection_id', $candidateProjectionId)
                ->first();

            if ($saved === null) {
                return true;
            }

            $this->auditRecorder->record(
                operation: 'talent_candidate.unsaved',
                auditable: $saved,
                actor: $recruiter,
                before: [
                    'recruiter_organization_id' => $organization->id,
                    'talent_candidate_projection_id' => $candidateProjectionId,
                ],
                after: [],
                reason: 'Candidate removed from recruiter organization saved list.',
            );

            $saved->delete();

            return true;
        });
    }
}
