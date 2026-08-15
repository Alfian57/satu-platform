<?php

namespace App\Http\Middleware;

use App\Actions\Auth\ResolveUserWorkspace;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\WorkspaceRole;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(
        private readonly ResolveUserWorkspace $resolveUserWorkspace,
    ) {}

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $isPublicPortfolio = $request->routeIs('portfolio.share');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $isPublicPortfolio
                    ? null
                    : fn (): ?array => $this->authenticatedUserSummary($request),
            ],
            'shell' => [
                'institutionMembership' => $isPublicPortfolio
                    ? null
                    : fn (): ?array => $this->institutionMembershipSummary($request),
            ],
            'onboarding' => $isPublicPortfolio
                ? null
                : fn (): ?array => $this->studentOnboardingSummary($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{id: int, name: string, username: string, is_platform_admin: bool, workspace: array<string, mixed>, created_at: mixed, updated_at: mixed}|null
     */
    private function authenticatedUserSummary(Request $request): ?array
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return null;
        }

        return [
            ...$user->only([
                'id',
                'name',
                'username',
                'created_at',
                'updated_at',
            ]),
            'is_platform_admin' => (bool) $user->is_platform_admin,
            'workspace' => $this->resolveUserWorkspace
                ->handle(
                    $user,
                    $this->routeInstitution($request),
                    $this->routeWorkspaceRole($request),
                )
                ->toArray(),
        ];
    }

    private function routeInstitution(Request $request): ?Institution
    {
        $institution = $request->route('institution');

        return $institution instanceof Institution ? $institution : null;
    }

    private function routeWorkspaceRole(Request $request): ?WorkspaceRole
    {
        if ($request->routeIs('recruiter.*')) {
            return WorkspaceRole::Recruiter;
        }

        if ($request->routeIs('campus.*')) {
            return WorkspaceRole::CampusAdmin;
        }

        return null;
    }

    /**
     * @return array{institutionName: string, status: string}|null
     */
    private function institutionMembershipSummary(Request $request): ?array
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        $memberships = $user->institutionMemberships()
            ->with('institution:id,name,status')
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->where('role', InstitutionMembershipRole::Student)
            ->latest('requested_at')
            ->latest('id')
            ->get();

        $membership = $memberships->first(
            fn (InstitutionMembership $membership): bool => $membership->status === InstitutionMembershipStatus::Verified,
        ) ?? $memberships->first();

        if ($membership === null) {
            return null;
        }

        return [
            'institutionName' => $membership->institution->name,
            'status' => $membership->status->value,
        ];
    }

    /**
     * @return array{required: bool, institutionId: int|null, institutionName: string|null, membershipStatus: string, profileId: int|null, studyProgram: string, studyYear: int, bio: string, skillsCount: int, availabilityCount: int, institutions: array<int, array{id: int, name: string}>, nim: string}|null
     */
    private function studentOnboardingSummary(Request $request): ?array
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        $workspace = $this->resolveUserWorkspace->handle($user);

        if ($workspace->role !== WorkspaceRole::Student) {
            return null;
        }

        $membership = $user->institutionMemberships()
            ->with(['institution:id,name,status', 'affiliationRequest'])
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->where('role', InstitutionMembershipRole::Student)
            ->latest('requested_at')
            ->latest('id')
            ->first();

        $institutionId = $membership?->institution_id;
        $institutionName = $membership?->institution?->name;

        if ($institutionId === null) {
            $defaultInstitution = Institution::query()
                ->where('status', InstitutionStatus::Active)
                ->first(['id', 'name']);
            $institutionId = $defaultInstitution?->getKey();
            $institutionName = $defaultInstitution?->name;
        }

        $institutions = Institution::query()
            ->where('status', InstitutionStatus::Active)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Institution $inst): array => [
                'id' => (int) $inst->getKey(),
                'name' => (string) $inst->name,
            ])
            ->values()
            ->all();

        $profile = $institutionId !== null
            ? StudentProfile::query()
                ->withCount(['skills', 'availabilityWindows'])
                ->whereBelongsTo($user)
                ->where('institution_id', $institutionId)
                ->first()
            : null;

        $isReady = $profile !== null
            && ! empty($profile->study_program)
            && (int) $profile->skills_count > 0
            && (int) $profile->availability_windows_count > 0;

        return [
            'required' => ! $isReady,
            'institutionId' => $institutionId,
            'institutionName' => $institutionName,
            'membershipStatus' => $membership?->status->value ?? 'unverified',
            'profileId' => $profile?->getKey(),
            'studyProgram' => $profile !== null ? (string) $profile->study_program : '',
            'studyYear' => $profile !== null ? (int) $profile->study_year : 1,
            'bio' => $profile !== null ? (string) $profile->bio : '',
            'skillsCount' => $profile === null ? 0 : (int) $profile->skills_count,
            'availabilityCount' => $profile === null ? 0 : (int) $profile->availability_windows_count,
            'institutions' => $institutions,
            'nim' => (string) ($membership?->affiliationRequest->nim ?? ''),
        ];
    }
}
