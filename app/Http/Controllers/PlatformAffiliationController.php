<?php

namespace App\Http\Controllers;

use App\Enums\AffiliationRequestStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAffiliationController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $search = $request->string('q')->trim()->limit(100)->toString();
        $status = InstitutionStatus::tryFrom($request->string('status')->toString());

        $institutions = Institution::query()
            ->select(['id', 'name', 'slug', 'status', 'updated_at'])
            ->withCount([
                'memberships',
                'affiliationRequests',
                'affiliationRequests as pending_affiliations_count' => fn ($query) => $query
                    ->where('status', AffiliationRequestStatus::PendingReview),
                'affiliationRequests as verified_affiliations_count' => fn ($query) => $query
                    ->where('status', AffiliationRequestStatus::Verified),
                'rosters as active_rosters_count' => fn ($query) => $query
                    ->whereNotNull('activated_at'),
            ])
            ->orderByDesc('pending_affiliations_count')
            ->orderBy('name')
            ->get();

        return Inertia::render('platform/affiliations', [
            'filters' => [
                'q' => $search,
                'status' => $status->value ?? 'all',
            ],
            'summary' => [
                'institutions' => $institutions->count(),
                'activeInstitutions' => $institutions
                    ->where('status', InstitutionStatus::Active)
                    ->count(),
                'pendingAffiliations' => $institutions->sum('pending_affiliations_count'),
                'institutionsWithQueue' => $institutions
                    ->where('pending_affiliations_count', '>', 0)
                    ->count(),
            ],
            'institutions' => $institutions
                ->map(fn (Institution $institution): array => [
                    'id' => $institution->getKey(),
                    'name' => $institution->name,
                    'slug' => $institution->slug,
                    'status' => $institution->status->value,
                    'membershipsCount' => (int) $institution->getAttribute('memberships_count'),
                    'affiliationsCount' => (int) $institution->getAttribute('affiliation_requests_count'),
                    'pendingAffiliationsCount' => (int) $institution->getAttribute('pending_affiliations_count'),
                    'verifiedAffiliationsCount' => (int) $institution->getAttribute('verified_affiliations_count'),
                    'hasActiveRoster' => (int) $institution->getAttribute('active_rosters_count') > 0,
                    'updatedAt' => $institution->updated_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ]);
    }
}
