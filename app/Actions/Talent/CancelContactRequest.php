<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class CancelContactRequest
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Recruiter cancels a pending contact request.
     *
     * @throws AuthorizationException|InvalidArgumentException
     */
    public function execute(
        User $recruiter,
        RecruiterOrganization $organization,
        int $contactRequestId,
    ): RecruiterContactRequest {
        if (! $recruiter->is_platform_admin) {
            $isMember = $organization->memberships()
                ->where('user_id', $recruiter->id)
                ->where('status', RecruiterMembershipStatus::Active)
                ->exists();

            if (! $isMember) {
                throw new AuthorizationException('Anda bukan anggota aktif dari organization perekrut ini.');
            }
        }

        $contactRequest = RecruiterContactRequest::query()
            ->where('id', $contactRequestId)
            ->where('recruiter_organization_id', $organization->id)
            ->first();

        if ($contactRequest === null) {
            throw new InvalidArgumentException('Permintaan kontak tidak ditemukan untuk organization ini.');
        }

        if ($contactRequest->status !== ContactRequestStatus::Pending) {
            throw new InvalidArgumentException('Hanya permintaan kontak berstatus pending yang dapat dibatalkan.');
        }

        return DB::transaction(function () use ($recruiter, $contactRequest) {
            $contactRequest->update([
                'status' => ContactRequestStatus::Canceled,
            ]);

            $this->auditRecorder->record(
                operation: 'recruiter_contact_request.canceled',
                auditable: $contactRequest,
                actor: $recruiter,
                before: ['status' => ContactRequestStatus::Pending->value],
                after: ['status' => ContactRequestStatus::Canceled->value],
                reason: 'Recruiter canceled pending contact request.',
            );

            return $contactRequest;
        });
    }
}
