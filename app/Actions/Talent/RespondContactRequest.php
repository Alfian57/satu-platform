<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Enums\ContactRequestStatus;
use App\Models\RecruiterContactRequest;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class RespondContactRequest
{
    public const CONSENT_PURPOSE = 'contact.handoff';

    public function __construct(
        private readonly AuditRecorder $auditRecorder,
        private readonly ConsentRecorder $consentRecorder,
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
            throw new InvalidArgumentException('Permintaan kontak tidak ditemukan.');
        }

        if ($contactRequest->candidate_user_id !== $candidateUser->id) {
            throw new AuthorizationException('Anda tidak berwenang menanggapi permintaan kontak ini.');
        }

        if ($contactRequest->status !== ContactRequestStatus::Pending) {
            throw new InvalidArgumentException('Permintaan kontak ini tidak lagi berstatus pending.');
        }

        if (Carbon::now()->greaterThan($contactRequest->expires_at)) {
            $contactRequest->update(['status' => ContactRequestStatus::Expired]);
            throw new InvalidArgumentException('Permintaan kontak ini sudah kedaluwarsa.');
        }

        return DB::transaction(function () use ($candidateUser, $contactRequest, $accept) {
            $newStatus = $accept ? ContactRequestStatus::Accepted : ContactRequestStatus::Declined;

            $contactRequest->update([
                'status' => $newStatus,
                'responded_at' => Carbon::now(),
            ]);

            if ($accept) {
                $this->consentRecorder->grant(
                    $candidateUser,
                    self::CONSENT_PURPOSE,
                    'v1',
                    'student.contact_response',
                );
            }

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
