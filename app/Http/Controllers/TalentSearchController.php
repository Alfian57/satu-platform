<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Actions\Talent\SearchTalentCandidates;
use App\Enums\RecruiterEntitlementScope;
use App\Models\Institution;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\TalentCandidateProjection;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TalentSearchController extends Controller
{
    public function __construct(
        private readonly SearchTalentCandidates $searchAction,
        private readonly VerifyRecruiterEntitlement $verifyEntitlement,
        private readonly RecruiterSafeCandidateSerializer $serializer,
    ) {}

    /**
     * Display URL-addressable talent search.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        /** @var RecruiterMembership|null $membership */
        $membership = RecruiterMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $organization = $membership?->organization;

        if ($organization === null && ! $user->is_platform_admin) {
            return Inertia::render('talent/search', [
                'candidates' => [
                    'data' => [],
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 25,
                ],
                'filters' => [],
                'entitlement' => [
                    'has_entitlement' => false,
                    'status' => 'no_organization',
                ],
                'institutions' => [],
                'savedCandidateIds' => [],
            ]);
        }

        /** @var RecruiterOrganization $activeOrg */
        $activeOrg = $organization ?? RecruiterOrganization::query()->firstOrCreate(
            ['name' => 'Platform Admin Org'],
            ['status' => 'verified']
        );

        $hasEntitlement = $this->verifyEntitlement->check(
            $activeOrg,
            RecruiterEntitlementScope::CandidateSearch
        );

        $query = $request->query('query');
        $skills = $request->query('skills');
        $badges = $request->query('badges');
        $availability = $request->query('availability');
        $institutionId = $request->query('institution_id');

        $skillsArray = is_array($skills) ? $skills : ($skills !== null && $skills !== '' ? explode(',', (string) $skills) : null);
        $badgesArray = is_array($badges) ? $badges : ($badges !== null && $badges !== '' ? explode(',', (string) $badges) : null);

        $candidatesData = [
            'data' => [],
            'total' => 0,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 25,
        ];

        if ($hasEntitlement) {
            try {
                $paginator = $this->searchAction->execute(
                    recruiter: $user,
                    organization: $activeOrg,
                    query: is_string($query) ? $query : null,
                    skills: $skillsArray,
                    badges: $badgesArray,
                    availabilityStatus: is_string($availability) ? $availability : null,
                    institutionId: is_numeric($institutionId) ? (int) $institutionId : null,
                    perPage: 25,
                    page: is_numeric($request->query('page')) ? (int) $request->query('page') : 1,
                );

                $candidatesData = [
                    'data' => $paginator->items(),
                    'total' => $paginator->total(),
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                ];
            } catch (AuthorizationException) {
                $hasEntitlement = false;
            }
        }

        $savedCandidateIds = RecruiterSavedCandidate::query()
            ->where('recruiter_organization_id', $activeOrg->id)
            ->where('user_id', $user->id)
            ->pluck('talent_candidate_projection_id')
            ->all();

        $activeEntitlement = $activeOrg->entitlements()
            ->where('status', 'active')
            ->first();

        $institutions = Institution::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('talent/search', [
            'candidates' => $candidatesData,
            'filters' => [
                'query' => $query ?? '',
                'skills' => $skillsArray ?? [],
                'badges' => $badgesArray ?? [],
                'availability' => $availability ?? '',
                'institution_id' => $institutionId ?? '',
            ],
            'entitlement' => [
                'has_entitlement' => $hasEntitlement,
                'status' => $hasEntitlement ? 'active' : ($activeEntitlement ? 'expired' : 'missing'),
                'expires_at' => $activeEntitlement?->ends_at?->toIso8601String(),
            ],
            'institutions' => $institutions,
            'savedCandidateIds' => $savedCandidateIds,
        ]);
    }

    /**
     * Display candidate profile detail with provenance and contact consequence notice.
     */
    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        assert($user !== null);

        $projection = TalentCandidateProjection::query()
            ->with('institution')
            ->where('id', $id)
            ->where('is_visible', true)
            ->firstOrFail();

        /** @var RecruiterMembership|null $membership */
        $membership = RecruiterMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        $organization = $membership?->organization;

        if ($organization === null && ! $user->is_platform_admin) {
            abort(403, 'Anda bukan anggota aktif dari organization perekrut.');
        }

        /** @var RecruiterOrganization $activeOrg */
        $activeOrg = $organization ?? RecruiterOrganization::query()->firstOrCreate(
            ['name' => 'Platform Admin Org'],
            ['status' => 'verified']
        );

        $hasEntitlement = $this->verifyEntitlement->check(
            $activeOrg,
            RecruiterEntitlementScope::CandidateSearch
        );

        if (! $hasEntitlement) {
            abort(403, 'Organization perekrut tidak memiliki hak akses pencarian kandidat yang aktif.');
        }

        $isSaved = RecruiterSavedCandidate::query()
            ->where('recruiter_organization_id', $activeOrg->id)
            ->where('user_id', $user->id)
            ->where('talent_candidate_projection_id', $projection->id)
            ->exists();

        $serializedCandidate = $this->serializer->toArray($projection);

        return Inertia::render('talent/candidate-detail', [
            'candidate' => $serializedCandidate,
            'isSaved' => $isSaved,
            'contactConsequenceNotice' => 'Nomor telepon dan kontak langsung hanya terbuka setelah kandidat menyetujui permintaan kontak.',
        ]);
    }
}
