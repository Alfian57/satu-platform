<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\StudentProfile;
use App\Models\User;

final class StudentActivationSummary
{
    public function __construct(
        private readonly ResolveConfiguredUniversity $resolveUniversity,
        private readonly ResolveStudentMembership $resolveMembership,
    ) {}

    /** @return array<string, mixed> */
    public function handle(User $user): array
    {
        $university = null;
        $universityState = 'ready';
        try {
            $university = $this->resolveUniversity->handle();
        } catch (InvalidUniversityConfiguration $exception) {
            $universityState = $exception->state;
        }
        $membership = $university === null ? null : $this->resolveMembership->handle($user);
        $membership?->loadMissing('affiliationRequest');
        $affiliation = $membership?->affiliationRequest;
        $affiliation?->loadMissing('profileDraft');
        $activeRoster = $affiliation === null ? null : InstitutionRoster::query()->where('institution_id', $affiliation->institution_id)
            ->active()->latest('activated_at')->latest('id')->first(['id']);
        $profile = $membership?->status === InstitutionMembershipStatus::Verified
            ? StudentProfile::query()->withCount(['skills', 'availabilityWindows'])
                ->whereBelongsTo($user)->where('institution_id', $membership->institution_id)->first()
            : null;
        $academicDraft = $profile === null && $affiliation !== null
            ? ($affiliation->profileDraft === null
                ? []
                : $affiliation->profileDraft->academic_profile)
            : [];
        $phoneVerified = $user->phoneNumbers()->verified()->exists();

        return [
            'required' => $university !== null && (
                $membership === null
                || $membership->status === InstitutionMembershipStatus::Unverified
                || ($membership->status === InstitutionMembershipStatus::Pending && $affiliation?->status === AffiliationRequestStatus::RevisionRequired)
                || ($membership->status === InstitutionMembershipStatus::Verified && $profile === null)
            ),
            'universityState' => $universityState,
            'institutionId' => $university?->getKey(),
            'institutionName' => $university?->name,
            'membershipStatus' => $membership?->status->value ?? 'unverified',
            'affiliationStatus' => $affiliation?->status->value,
            'matchResult' => $affiliation?->match_result->value,
            'needsRosterRefresh' => $affiliation?->isStaleAgainst($activeRoster) ?? false,
            'phoneVerified' => $phoneVerified,
            'hasLegacyAffiliation' => $university !== null && InstitutionMembership::query()->whereBelongsTo($user)
                ->where('role', InstitutionMembershipRole::Student)->where('institution_id', '!=', $university->getKey())->exists(),
            'canSubmitAffiliation' => $university !== null && $phoneVerified && $membership?->status !== InstitutionMembershipStatus::Suspended,
            'profileId' => $profile?->getKey(),
            'studyProgram' => $profile !== null
                ? $profile->study_program
                : ($academicDraft['study_program'] ?? ''),
            'faculty' => $profile !== null
                ? $profile->faculty
                : ($academicDraft['faculty'] ?? ''),
            'admissionYear' => $profile !== null
                ? $profile->admission_year
                : ($academicDraft['admission_year'] ?? null),
            'academicOptions' => config('university.faculties', []),
            'bio' => $profile->bio ?? '',
            'skillsCount' => $profile === null ? 0 : (int) $profile->skills_count,
            'availabilityCount' => $profile === null ? 0 : (int) $profile->availability_windows_count,
            'nim' => $affiliation->nim ?? $membership->institutional_identifier ?? '',
        ];
    }
}
