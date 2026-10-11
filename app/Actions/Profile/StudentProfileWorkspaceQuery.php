<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Models\Contribution;
use App\Models\InstitutionMembership;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

final class StudentProfileWorkspaceQuery
{
    public function __construct(private readonly ResolveStudentMembership $resolveMembership) {}

    /** @return array{membership: InstitutionMembership|null, profile: StudentProfile|null, approvedSources: list<array<string, mixed>>} */
    public function execute(User $user, ?int $institutionId = null): array
    {
        $membership = $this->resolveMembership->handle($user, $institutionId);
        if ($institutionId !== null && $membership === null) {
            throw new AuthorizationException;
        }
        if ($membership?->status !== InstitutionMembershipStatus::Verified) {
            return ['membership' => $membership, 'profile' => null, 'approvedSources' => []];
        }

        Gate::forUser($user)->authorize('create', [StudentProfile::class, $membership->institution]);
        $profile = StudentProfile::query()->whereBelongsTo($user)->where('institution_id', $membership->institution_id)->first();
        if ($profile !== null) {
            Gate::forUser($user)->authorize('view', $profile);
        }
        $sources = Contribution::query()
            ->select(['id', 'institution_id', 'owner_id', 'project_id', 'status', 'current_version_id', 'updated_at'])
            ->where('institution_id', $membership->institution_id)->whereBelongsTo($user, 'owner')
            ->where('status', ContributionStatus::Approved)
            ->whereHas('currentVersion', fn ($versions) => $versions->whereColumn('contribution_id', 'contributions.id'))
            ->whereHas('currentVersion.reviews', fn ($reviews) => $reviews->where('decision', ContributionReviewDecision::Approved))
            ->with(['currentVersion:id,contribution_id,claim,version_number', 'project:id,institution_id,owner_id,title,status'])
            ->latest('updated_at')->latest('id')->limit(5)->get()
            ->map(static fn (Contribution $contribution): array => [
                'id' => $contribution->getKey(),
                'title' => $contribution->currentVersion->claim,
                'version' => $contribution->currentVersion->version_number,
                'can_view' => Gate::forUser($user)->allows('view', $contribution),
                'verification_label' => 'Kontribusi disetujui kampus',
            ])->values()->all();

        return ['membership' => $membership, 'profile' => $profile, 'approvedSources' => array_values($sources)];
    }
}
