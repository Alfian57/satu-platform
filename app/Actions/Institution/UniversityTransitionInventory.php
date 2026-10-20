<?php

namespace App\Actions\Institution;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InvitationStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class UniversityTransitionInventory
{
    public function __construct(private readonly ResolveConfiguredUniversity $resolveUniversity) {}

    /**
     * @return array{configuration_state: string, configured_slug: string|null, configured_institution_id: int|null, institutions: list<array<string, int|string|bool>>, platform_admin_user_ids: list<int>, multi_institution_admin_user_ids: list<int>}
     */
    public function handle(): array
    {
        $slug = null;
        $target = null;
        $state = 'ready';

        try {
            $slug = $this->resolveUniversity->slug();
            $target = $this->resolveUniversity->handle();
        } catch (InvalidUniversityConfiguration $error) {
            $state = $error->state;
        }

        $portfolios = PortfolioEntry::query()->select('institution_id')
            ->selectRaw('COUNT(*) as entry_count')->groupBy('institution_id')->pluck('entry_count', 'institution_id');
        $institutions = Institution::query()->orderBy('id')->withCount([
            'memberships', 'rosters', 'studentProfiles', 'projects', 'contributions',
            'memberships as verified_admins_count' => static fn (Builder $query): Builder => $query
                ->where('role', InstitutionMembershipRole::CampusAdmin)
                ->where('status', InstitutionMembershipStatus::Verified)->whereNotNull('verified_at'),
            'privilegedInvitations as pending_invitations_count' => static fn (Builder $query): Builder => $query
                ->where('status', InvitationStatus::Issued)->where('expires_at', '>', now()),
        ])->get()->map(static fn (Institution $institution): array => [
            'id' => $institution->id,
            'name' => $institution->name,
            'slug' => $institution->slug,
            'status' => $institution->status->value,
            'is_target' => $target?->id === $institution->id,
            'memberships' => (int) $institution->getAttribute('memberships_count'),
            'verified_admins' => (int) $institution->getAttribute('verified_admins_count'),
            'pending_invitations' => (int) $institution->getAttribute('pending_invitations_count'),
            'rosters' => (int) $institution->getAttribute('rosters_count'),
            'profiles' => (int) $institution->getAttribute('student_profiles_count'),
            'projects' => (int) $institution->getAttribute('projects_count'),
            'contributions' => (int) $institution->getAttribute('contributions_count'),
            'portfolios' => (int) $portfolios->get($institution->id, 0),
        ])->all();

        return [
            'configuration_state' => $state,
            'configured_slug' => $slug,
            'configured_institution_id' => $target?->id,
            'institutions' => array_values($institutions),
            'platform_admin_user_ids' => array_values(User::query()->where('is_platform_admin', true)->orderBy('id')
                ->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all()),
            'multi_institution_admin_user_ids' => array_values(InstitutionMembership::query()->where('role', InstitutionMembershipRole::CampusAdmin)
                ->select('user_id')->groupBy('user_id')->havingRaw('COUNT(DISTINCT institution_id) > 1')->orderBy('user_id')
                ->pluck('user_id')->map(static fn (mixed $id): int => (int) $id)->all()),
        ];
    }
}
