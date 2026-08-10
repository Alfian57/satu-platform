<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContactRequestStatus;
use App\Models\RecruiterContactRequest;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class RespondContactRequest
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Candidate accepts or declines a contact request.
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $candidateUser,
        int $contactRequestId,
        bool $accept,
    ): RecruiterContactRequest {
        $contactRequest = RecruiterContactRequest::query()->find($contactRequestId);

        if ($contactRequest === null) {
            throw new InvalidArgumentException('Contact request not found.');
        }

        if ($contactRequest->candidate_user_id !== $candidateUser->id) {
            throw new AuthorizationException('You are not authorized to respond to this contact request.');
        }

        if ($contactRequest->status !== ContactRequestStatus::Pending) {
            throw new InvalidArgumentException('This contact request is no longer pending.');
        }

        if (Carbon::now()->greaterThan($contactRequest->expires_at)) {
            $contactRequest->update(['status' => ContactRequestStatus::Expired]);
            throw new InvalidArgumentException('This contact request has expired.');
        }

        return DB::transaction(function () use ($candidateUser, $contactRequest, $accept) {
            $newStatus = $accept ? ContactRequestStatus::Accepted : ContactRequestStatus::Declined;

            $contactRequest->update([
                'status' => $newStatus,
                'responded_at' => Carbon::now(),
            ]);

            $this->auditRecorder->record(
                operation: 'recruiter_contact_request.responded',
                auditable: $contactRequest,
                actor: $candidateUser,
                before: ['status' => ContactRequestStatus::Pending->value],
                after: ['status' => $newStatus->value],
                reason: $accept ? 'Candidate accepted contact request.' : 'Candidate declined contact request.',
            );

            return $contactRequest;
        });
    }
}
