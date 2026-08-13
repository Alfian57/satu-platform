<?php

declare(strict_types=1);

namespace App\Actions\Talent;

use App\Actions\Portfolio\RebuildTalentCandidateProjection;
use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * @deprecated Projections are derived from approved portfolio entries. Use the
 * portfolio approval and visibility flows instead of supplying projection data.
 */
final class UpdateTalentCandidateProjection
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
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
        if ($data !== []) {
            throw new AuthorizationException(
                'Candidate projections are derived from approved portfolio entries and cannot accept manual data.',
            );
        }

        $profile = StudentProfile::query()
            ->where('user_id', $targetUser->getKey())
            ->where('institution_id', $institution->getKey())
            ->first();

        $allowedRoles = $actor->getKey() === $targetUser->getKey()
            ? [InstitutionMembershipRole::Student]
            : [InstitutionMembershipRole::CampusAdmin];

        if (
            ! $actor->is_platform_admin
            && ($profile === null
                || $this->institutionContextResolver->resolve($actor, $profile, $allowedRoles) === null)
        ) {
            throw new AuthorizationException('You are not authorized to rebuild this candidate projection.');
        }

        return $this->rebuildProjection->handle($targetUser, $institution)
            ?? throw new AuthorizationException('Student profile is required before rebuilding a projection.');
    }
}
