<?php

namespace App\Http\Middleware;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\InstitutionMembership;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
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
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()?->only([
                    'id',
                    'name',
                    'email',
                    'email_verified_at',
                    'created_at',
                    'updated_at',
                ]),
            ],
            'shell' => [
                'institutionMembership' => fn (): ?array => $this->institutionMembershipSummary($request),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
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
}
