<?php

namespace App\Http\Middleware;

use App\Actions\Auth\ResolveUserWorkspace;
use App\Actions\Profile\ResolveStudentMembership;
use App\Actions\Profile\StudentActivationSummary;
use App\Enums\WorkspaceRole;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(
        private readonly ResolveUserWorkspace $resolveUserWorkspace,
        private readonly ResolveStudentMembership $resolveStudentMembership,
        private readonly StudentActivationSummary $activationSummary,
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
     * @return array{id: int, name: string, workspace: array<string, mixed>, created_at: mixed, updated_at: mixed}|null
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
                'created_at',
                'updated_at',
            ]),
            'workspace' => $this->resolveUserWorkspace
                ->handle(
                    $user,
                    $this->routeInstitution($request),
                )
                ->toArray(),
        ];
    }

    private function routeInstitution(Request $request): ?Institution
    {
        $institution = $request->route('institution');

        return $institution instanceof Institution ? $institution : null;
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

        $membership = $this->resolveStudentMembership->handle($user,
            $request->routeIs('student-profiles.edit') && $request->filled('institution_id') ? $request->integer('institution_id') : null,
        );

        if ($membership === null) {
            return null;
        }

        return [
            'institutionName' => $membership->institution->name,
            'status' => $membership->status->value,
        ];
    }

    /**
     * @return array<string, mixed>|null
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

        $summary = $this->activationSummary->handle($user);
        if ($request->routeIs('student-profiles.edit') && $summary['membershipStatus'] === 'verified') {
            $summary['required'] = false;
        }

        return $summary;
    }
}
