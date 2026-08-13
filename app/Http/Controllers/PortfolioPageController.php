<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Portfolio\PortfolioEntrySerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class PortfolioPageController extends Controller
{
    public function index(Request $request, PortfolioEntrySerializer $serializer): Response
    {
        $user = $this->user($request);
        $profile = $this->activeProfile($user);

        return Inertia::render('portfolio/index', [
            'profile' => $this->profilePayload($profile),
            'permissions' => [
                'can_manage' => $profile !== null,
            ],
            'entries' => Inertia::defer(
                fn (): array => $this->entries($profile, $serializer),
                rescue: true,
            ),
        ]);
    }

    public function show(
        Request $request,
        PortfolioEntry $portfolioEntry,
        PortfolioEntrySerializer $serializer,
    ): Response {
        $user = $this->user($request);
        Gate::forUser($user)->authorize('view', $portfolioEntry);

        $isOwner = $portfolioEntry->user_id === $user->getKey();
        $profile = $isOwner
            ? StudentProfile::query()
                ->with('institution:id,name')
                ->where('user_id', $portfolioEntry->user_id)
                ->where('institution_id', $portfolioEntry->institution_id)
                ->first()
            : null;

        return Inertia::render('portfolio/show', [
            'entry' => $serializer->toArray($portfolioEntry),
            'profile' => $this->profilePayload($profile),
            'permissions' => [
                'can_manage' => $isOwner
                    && Gate::forUser($user)->allows('update', $portfolioEntry),
                'can_manage_profile' => $profile !== null,
            ],
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function entries(
        ?StudentProfile $profile,
        PortfolioEntrySerializer $serializer,
    ): array {
        if ($profile === null) {
            return [];
        }

        return array_values(
            PortfolioEntry::query()
                ->where('user_id', $profile->user_id)
                ->where('institution_id', $profile->institution_id)
                ->with([
                    'contribution:id,institution_id,owner_id,status,current_version_id',
                    'sourceVersion:id,contribution_id,version_number',
                ])
                ->latest('updated_at')
                ->latest('id')
                ->limit(100)
                ->get()
                ->map(fn (PortfolioEntry $entry): array => $serializer->toArray($entry))
                ->values()
                ->all(),
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private function profilePayload(?StudentProfile $profile): ?array
    {
        if ($profile === null) {
            return null;
        }

        return [
            'id' => $profile->getKey(),
            'institution' => [
                'id' => $profile->institution->getKey(),
                'name' => $profile->institution->name,
            ],
            'portfolio_visibility' => $profile->portfolio_visibility->value,
            'recruiter_discoverable' => $profile->recruiter_discoverable,
            'updated_at' => $profile->updated_at->toIso8601String(),
        ];
    }

    private function activeProfile(User $user): ?StudentProfile
    {
        $membership = InstitutionMembership::query()
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::Student)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->latest('verified_at')
            ->latest('id')
            ->first();

        if ($membership === null) {
            return null;
        }

        return StudentProfile::query()
            ->with('institution:id,name')
            ->whereBelongsTo($user)
            ->whereBelongsTo($membership->institution)
            ->first();
    }

    private function user(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
