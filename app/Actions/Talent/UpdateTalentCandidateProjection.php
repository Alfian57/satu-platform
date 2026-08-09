<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Audit\AuditRecorder;
use App\Models\Institution;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class UpdateTalentCandidateProjection
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Idempotently update or withdraw a talent candidate portfolio projection.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws AuthorizationException
     */
    public function execute(
        User $actor,
        User $targetUser,
        Institution $institution,
        array $data,
    ): TalentCandidateProjection {
        if ($actor->id !== $targetUser->id) {
            $isCampusAdmin = $institution->memberships()
                ->where('user_id', $actor->id)
                ->where('role', 'campus_admin')
                ->exists();

            if (! $isCampusAdmin && ! $actor->is_platform_admin) {
                throw new AuthorizationException('You are not authorized to update this candidate projection.');
            }
        }

        return DB::transaction(function () use ($actor, $targetUser, $institution, $data) {
            $projection = TalentCandidateProjection::query()->updateOrCreate(
                ['user_id' => $targetUser->id],
                [
                    'institution_id' => $institution->id,
                    'headline' => isset($data['headline']) ? (string) $data['headline'] : null,
                    'bio' => isset($data['bio']) ? (string) $data['bio'] : null,
                    'skills' => isset($data['skills']) && is_array($data['skills']) ? array_values($data['skills']) : [],
                    'badges' => isset($data['badges']) && is_array($data['badges']) ? array_values($data['badges']) : [],
                    'contributions' => isset($data['contributions']) && is_array($data['contributions']) ? array_values($data['contributions']) : [],
                    'is_visible' => isset($data['is_visible']) ? (bool) $data['is_visible'] : true,
                    'availability_status' => isset($data['availability_status']) ? (string) $data['availability_status'] : 'available',
                    'verified_at' => isset($data['verified_at']) ? Carbon::parse((string) $data['verified_at']) : Carbon::now(),
                ]
            );

            $this->auditRecorder->record(
                operation: 'talent_candidate_projection.updated',
                auditable: $projection,
                actor: $actor,
                institution: $institution,
                before: [],
                after: [
                    'is_visible' => $projection->is_visible,
                    'availability_status' => $projection->availability_status,
                ],
                reason: 'Talent candidate projection updated idempotently.',
            );

            return $projection;
        });
    }
}
