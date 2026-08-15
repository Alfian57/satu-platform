<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class SaveCandidate
{
    public function __construct(
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Save a candidate projection for an entitled recruiter organization idempotently.
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        int $candidateProjectionId,
    ): RecruiterSavedCandidate {
        if (! $recruiter->is_platform_admin) {
            $isMember = $organization->memberships()
                ->where('user_id', $recruiter->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->exists();

            if (! $isMember) {
                throw new AuthorizationException('Anda bukan anggota aktif dari organization perekrut ini.');
            }
        }

        $hasEntitlement = $this->verifyEntitlement->check(
            $organization,
            RecruiterEntitlementScope::CandidateSearch
        );

        if (! $hasEntitlement) {
            throw new AuthorizationException('Organization perekrut tidak memiliki hak akses pencarian kandidat yang aktif.');
        }

        $projection = TalentCandidateProjection::query()
            ->where('id', $candidateProjectionId)
            ->where('is_visible', true)
            ->first();

        if ($projection === null) {
            throw new InvalidArgumentException('Proyeksi kandidat target tidak ditemukan atau telah ditarik.');
        }

        return DB::transaction(function () use ($recruiter, $organization, $projection) {
            $saved = RecruiterSavedCandidate::query()->firstOrCreate(
                [
                    'recruiter_organization_id' => $organization->id,
                    'user_id' => $recruiter->id,
                    'talent_candidate_projection_id' => $projection->id,
                ]
            );

            $this->auditRecorder->record(
                operation: 'talent_candidate.saved',
                auditable: $saved,
                actor: $recruiter,
                before: [],
                after: [
                    'recruiter_organization_id' => $organization->id,
                    'talent_candidate_projection_id' => $projection->id,
                ],
                reason: 'Candidate saved to recruiter organization workspace.',
            );

            return $saved;
        });
    }
}
