<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Notifications\CandidateContactRequestedNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class SendContactRequest
{
    public function __construct(
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Send a purpose-bound contact request from an entitled recruiter organization to a candidate.
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        int $candidateProjectionId,
        string $purpose,
        ?string $message = null,
    ): RecruiterContactRequest {
        if (trim($purpose) === '') {
            throw new InvalidArgumentException('Contact request purpose is required.');
        }

        if (! $recruiter->is_platform_admin) {
            $isMember = $organization->memberships()
                ->where('user_id', $recruiter->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->exists();

            if (! $isMember) {
                throw new AuthorizationException('You are not an active member of this recruiter organization.');
            }
        }

        $hasEntitlement = $this->verifyEntitlement->check(
            $organization,
            RecruiterEntitlementScope::CandidateSearch
        );

        if (! $hasEntitlement) {
            throw new AuthorizationException('Recruiter organization does not hold an active candidate search entitlement.');
        }

        $projection = TalentCandidateProjection::query()
            ->where('id', $candidateProjectionId)
            ->where('is_visible', true)
            ->first();

        if ($projection === null) {
            throw new InvalidArgumentException('Target candidate projection is not found or has been withdrawn.');
        }

        // Deduplication check: no duplicate pending request for same org & candidate projection
        $existingPending = RecruiterContactRequest::query()
            ->where('recruiter_organization_id', $organization->id)
            ->where('talent_candidate_projection_id', $projection->id)
            ->where('status', ContactRequestStatus::Pending)
            ->where('expires_at', '>', Carbon::now())
            ->exists();

        if ($existingPending) {
            throw new InvalidArgumentException('A pending contact request already exists for this candidate.');
        }

        return DB::transaction(function () use ($recruiter, $organization, $projection, $purpose, $message) {
            $contactRequest = RecruiterContactRequest::query()->create([
                'recruiter_organization_id' => $organization->id,
                'recruiter_user_id' => $recruiter->id,
                'talent_candidate_projection_id' => $projection->id,
                'candidate_user_id' => $projection->user_id,
                'purpose' => trim($purpose),
                'message' => $message !== null ? trim($message) : null,
                'status' => ContactRequestStatus::Pending,
                'expires_at' => Carbon::now()->addDays(7),
            ]);

            $candidateUser = User::find($projection->user_id);
            if ($candidateUser !== null) {
                $candidateUser->notify(new CandidateContactRequestedNotification($contactRequest));
            }

            $this->auditRecorder->record(
                operation: 'recruiter_contact_request.created',
                auditable: $contactRequest,
                actor: $recruiter,
                before: [],
                after: [
                    'recruiter_organization_id' => $organization->id,
                    'candidate_user_id' => $projection->user_id,
                    'purpose' => $contactRequest->purpose,
                    'status' => ContactRequestStatus::Pending->value,
                ],
                reason: 'Purpose-bound contact request sent to candidate.',
            );

            return $contactRequest;
        });
    }
}
