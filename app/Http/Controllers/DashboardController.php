<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\ResolveUserWorkspace;
use App\Actions\Matching\RecommendationQuery;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\ProjectStatus;
use App\Enums\WorkspaceRole;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Matching\RecommendationSerializer;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly RecommendationQuery $recommendationQuery,
        private readonly RecommendationSerializer $recommendationSerializer,
        private readonly ResolveUserWorkspace $resolveUserWorkspace,
    ) {}

    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $workspace = $this->resolveUserWorkspace->handle($user);

        if ($workspace->role !== WorkspaceRole::Student) {
            return to_route($workspace->routeName(), $workspace->routeParameters());
        }

        $membership = $this->activeMembership($user);
        $institution = $membership?->institution;
        $hasVerifiedMembership = $membership?->status === InstitutionMembershipStatus::Verified;
        $profile = $hasVerifiedMembership && $institution !== null
            ? $this->profileFor($user, $institution)
            : null;
        $previewRecommendation = $this->previewRecommendation(
            $user,
            $institution,
            $profile,
            $hasVerifiedMembership,
        );
        $firstActiveProject = $hasVerifiedMembership && $institution !== null
            ? $this->activeProjectsQuery($user, $institution)->first()
            : null;

        return Inertia::render('dashboard', [
            'institution' => $institution === null ? null : [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
            'profileReadiness' => $this->profileReadiness($profile, $hasVerifiedMembership),
            'nextAction' => $this->nextAction(
                $membership,
                $profile,
                $previewRecommendation,
                $firstActiveProject,
            ),
            'reviewQueue' => $this->reviewQueue($membership),
            'dashboardNotice' => $this->dashboardNotice($request, $membership, $previewRecommendation),
            'refreshedAt' => now()->toIso8601String(),
            'activeProjects' => Inertia::defer(function () use (
                $user,
                $institution,
                $hasVerifiedMembership,
            ): array {
                return $this->activeProjects(
                    $user,
                    $institution,
                    $hasVerifiedMembership,
                );
            }),
            'recommendations' => Inertia::defer(function () use (
                $user,
                $institution,
                $profile,
                $hasVerifiedMembership,
            ): array {
                return $this->recommendations(
                    $user,
                    $institution,
                    $profile,
                    $hasVerifiedMembership,
                );
            }),
        ]);
    }

    private function activeMembership(User $user): ?InstitutionMembership
    {
        return InstitutionMembership::query()
            ->with('institution:id,name,status')
            ->whereBelongsTo($user)
            ->where('role', InstitutionMembershipRole::Student)
            ->whereIn('status', array_map(
                static fn (InstitutionMembershipStatus $status): string => $status->value,
                InstitutionMembershipStatus::cases(),
            ))
            ->whereRelation('institution', 'status', InstitutionStatus::Active)
            ->orderByRaw(
                'CASE WHEN status = ? THEN 0 WHEN status = ? THEN 1 ELSE 2 END',
                [
                    InstitutionMembershipStatus::Verified->value,
                    InstitutionMembershipStatus::Pending->value,
                ],
            )
            ->latest('requested_at')
            ->latest('id')
            ->first();
    }

    private function profileFor(User $user, Institution $institution): ?StudentProfile
    {
        return StudentProfile::query()
            ->withCount(['skills', 'availabilityWindows'])
            ->whereBelongsTo($user)
            ->whereBelongsTo($institution)
            ->first();
    }

    private function previewRecommendation(
        User $user,
        ?Institution $institution,
        ?StudentProfile $profile,
        bool $hasVerifiedMembership,
    ): ?Recommendation {
        if (
            ! $hasVerifiedMembership
            || $institution === null
            || ! $this->profileIsReady($profile)
        ) {
            return null;
        }

        return $this->recommendationQuery
            ->execute($user, $institution, perPage: 1)
            ->paginator
            ->first();
    }

    /**
     * @return array{state: string, profileId: int|null, skillsCount: int, availabilityCount: int}
     */
    private function profileReadiness(?StudentProfile $profile, bool $hasVerifiedMembership): array
    {
        if (! $hasVerifiedMembership) {
            return [
                'state' => 'unavailable',
                'profileId' => null,
                'skillsCount' => 0,
                'availabilityCount' => 0,
            ];
        }

        $skillsCount = $profile === null ? 0 : (int) $profile->skills_count;
        $availabilityCount = $profile === null ? 0 : (int) $profile->availability_windows_count;

        return [
            'state' => $profile === null
                ? 'missing'
                : ($this->profileIsReady($profile) ? 'ready' : 'incomplete'),
            'profileId' => $profile?->getKey(),
            'skillsCount' => $skillsCount,
            'availabilityCount' => $availabilityCount,
        ];
    }

    /** @return array<string, mixed> */
    private function nextAction(
        ?InstitutionMembership $membership,
        ?StudentProfile $profile,
        ?Recommendation $recommendation,
        ?Project $activeProject,
    ): array {
        if ($membership === null) {
            return $this->action(
                reference: 'AFF-START',
                category: 'Afiliasi kampus',
                statusLabel: 'Belum terhubung',
                statusTone: 'pending',
                title: 'Hubungkan afiliasi kampus untuk membuka alur student',
                facts: [
                    [
                        'label' => 'Status',
                        'value' => 'Belum ada afiliasi kampus terverifikasi',
                        'icon' => 'building',
                        'tone' => 'pending',
                    ],
                    [
                        'label' => 'Berikutnya',
                        'value' => 'Ajukan atau periksa data afiliasi kampus',
                        'icon' => 'profile',
                    ],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Atur afiliasi'],
            );
        }

        if ($membership->status === InstitutionMembershipStatus::Pending) {
            return $this->action(
                reference: 'AFF-'.$membership->getKey(),
                category: 'Afiliasi kampus',
                statusLabel: 'Menunggu tinjauan',
                statusTone: 'pending',
                title: 'Lengkapi profil sambil menunggu afiliasi ditinjau',
                facts: [
                    [
                        'label' => 'Afiliasi',
                        'value' => $membership->institution->name,
                        'icon' => 'building',
                        'tone' => 'pending',
                    ],
                    [
                        'label' => 'Tetap tersedia',
                        'value' => 'Perbarui data profil dan lihat informasi yang terbuka',
                        'icon' => 'profile',
                    ],
                    [
                        'label' => 'Menunggu verifikasi',
                        'value' => 'Recommendation dan aksi yang membutuhkan afiliasi aktif',
                        'icon' => 'file',
                        'tone' => 'muted',
                    ],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            );
        }

        if ($membership->status === InstitutionMembershipStatus::Unverified) {
            return $this->action(
                reference: 'AFF-'.$membership->getKey(),
                category: 'Afiliasi kampus',
                statusLabel: 'Perlu diverifikasi',
                statusTone: 'pending',
                title: 'Selesaikan verifikasi afiliasi kampusmu',
                facts: [
                    [
                        'label' => 'Afiliasi',
                        'value' => $membership->institution->name,
                        'icon' => 'building',
                        'tone' => 'pending',
                    ],
                    [
                        'label' => 'Berikutnya',
                        'value' => 'Periksa data afiliasi dan lanjutkan verifikasi',
                        'icon' => 'profile',
                    ],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            );
        }

        if ($membership->status === InstitutionMembershipStatus::Suspended) {
            return $this->action(
                reference: 'AFF-'.$membership->getKey(),
                category: 'Afiliasi kampus',
                statusLabel: 'Akses ditangguhkan',
                statusTone: 'correction',
                title: 'Periksa kembali status afiliasi kampusmu',
                facts: [
                    [
                        'label' => 'Afiliasi',
                        'value' => $membership->institution->name,
                        'icon' => 'building',
                        'tone' => 'correction',
                    ],
                    [
                        'label' => 'Berikutnya',
                        'value' => 'Hubungi pengelola kampus melalui alur afiliasi',
                        'icon' => 'profile',
                    ],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Periksa status'],
            );
        }

        if (! $this->profileIsReady($profile)) {
            $profileState = $profile === null ? 'Belum dibuat' : 'Belum lengkap';

            return $this->action(
                reference: 'PROFIL-START',
                category: 'Kesiapan profil',
                statusLabel: 'Perlu dilengkapi',
                statusTone: 'correction',
                title: 'Lengkapi profil untuk membuka recommendation yang dapat dijelaskan',
                facts: [
                    [
                        'label' => 'Profil',
                        'value' => $profileState,
                        'icon' => 'profile',
                        'tone' => 'correction',
                    ],
                    [
                        'label' => 'Yang dibutuhkan',
                        'value' => 'Skill dan ketersediaan waktu',
                        'icon' => 'file',
                    ],
                    [
                        'label' => 'Setelah selesai',
                        'value' => 'Alasan kecocokan project dapat ditampilkan',
                        'icon' => 'calendar',
                    ],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Lengkapi profil'],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi project'],
            );
        }

        if ($recommendation !== null) {
            $view = $this->recommendationView($recommendation);
            $firstReason = $view['reasons'][0] ?? 'Alasan kecocokan tersedia pada detail project.';

            return $this->action(
                reference: 'REC-'.str_pad((string) $recommendation->getKey(), 4, '0', STR_PAD_LEFT),
                category: 'Recommendation project',
                statusLabel: 'Peluang baru',
                statusTone: $view['isStale'] ? 'pending' : 'verified',
                title: 'Tinjau peluang yang paling relevan sekarang',
                recordedAt: $recommendation->created_at,
                facts: [
                    [
                        'label' => 'Project',
                        'value' => $view['title'],
                        'icon' => 'file',
                    ],
                    [
                        'label' => 'Alasan utama',
                        'value' => $firstReason,
                        'icon' => 'profile',
                    ],
                    [
                        'label' => 'Versi pencocokan',
                        'value' => $view['scoreVersion'] ?? 'Belum tersedia',
                        'icon' => 'calendar',
                        'tone' => $view['isStale'] ? 'pending' : 'verified',
                    ],
                ],
                primaryAction: [
                    'key' => 'project',
                    'label' => 'Tinjau project',
                    'projectId' => $view['projectId'],
                ],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi project lain'],
            );
        }

        if ($activeProject !== null) {
            return $this->action(
                reference: 'PROJ-'.str_pad((string) $activeProject->getKey(), 4, '0', STR_PAD_LEFT),
                category: 'Project aktif',
                statusLabel: 'Bisa dilanjutkan',
                statusTone: 'verified',
                title: 'Lanjutkan project yang sedang kamu kelola',
                facts: [
                    [
                        'label' => 'Project',
                        'value' => $activeProject->title,
                        'icon' => 'file',
                    ],
                    [
                        'label' => 'Batas waktu',
                        'value' => $this->formatDate($activeProject->deadline),
                        'dateTime' => $activeProject->deadline->toIso8601String(),
                        'icon' => 'calendar',
                        'tone' => $activeProject->deadline->isPast() ? 'correction' : 'default',
                    ],
                    [
                        'label' => 'Berikutnya',
                        'value' => 'Periksa detail project dan peran yang tersedia',
                        'icon' => 'profile',
                    ],
                ],
                primaryAction: [
                    'key' => 'project',
                    'label' => 'Buka project',
                    'projectId' => $activeProject->getKey(),
                ],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi project lain'],
            );
        }

        return $this->action(
            reference: 'DISCOVERY-START',
            category: 'Project discovery',
            statusLabel: 'Profil siap',
            statusTone: 'verified',
            title: 'Temukan project yang sesuai dengan kesiapanmu',
            facts: [
                [
                    'label' => 'Profil',
                    'value' => 'Siap digunakan untuk pencocokan',
                    'icon' => 'profile',
                    'tone' => 'verified',
                ],
                [
                    'label' => 'Recommendation',
                    'value' => 'Belum ada peluang aktif yang dapat ditampilkan',
                    'icon' => 'file',
                ],
                [
                    'label' => 'Berikutnya',
                    'value' => 'Bandingkan project dan kebutuhan perannya',
                    'icon' => 'calendar',
                ],
            ],
            primaryAction: ['key' => 'projects', 'label' => 'Jelajahi project'],
            secondaryAction: ['key' => 'onboarding', 'label' => 'Periksa profil'],
        );
    }

    /**
     * @param  list<array<string, mixed>>  $facts
     * @param  array<string, mixed>|null  $primaryAction
     * @param  array<string, mixed>|null  $secondaryAction
     * @return array<string, mixed>
     */
    private function action(
        string $reference,
        string $category,
        string $statusLabel,
        string $statusTone,
        string $title,
        array $facts,
        ?array $primaryAction = null,
        ?array $secondaryAction = null,
        ?CarbonInterface $recordedAt = null,
    ): array {
        $recordedAt ??= now();

        return [
            'reference' => $reference,
            'category' => $category,
            'recordedAt' => $recordedAt->isToday()
                ? 'Hari ini'
                : $this->formatDate($recordedAt),
            'recordedAtIso' => $recordedAt->toIso8601String(),
            'statusLabel' => $statusLabel,
            'statusTone' => $statusTone,
            'title' => $title,
            'facts' => $facts,
            'primaryAction' => $primaryAction,
            'secondaryAction' => $secondaryAction,
        ];
    }

    /**
     * @return array{state: string, count?: int, itemLabel?: string, statusLabel?: string, title?: string, description?: string}
     */
    private function reviewQueue(?InstitutionMembership $membership): array
    {
        if ($membership?->status === InstitutionMembershipStatus::Suspended) {
            return [
                'state' => 'unavailable',
                'title' => 'Validasi kontribusi belum dapat ditampilkan',
                'description' => 'Periksa status afiliasi kampus untuk memulihkan akses.',
            ];
        }

        return [
            'state' => 'unavailable',
            'title' => 'Validasi kontribusi belum tersedia',
            'description' => 'Ringkasan ini akan muncul setelah modul validasi kontribusi tersedia pada akunmu.',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function dashboardNotice(
        Request $request,
        ?InstitutionMembership $membership,
        ?Recommendation $recommendation,
    ): ?array {
        $issue = (string) $request->session()->get('dashboard_issue', '');

        if ($issue === 'recommendation_stale') {
            return [
                'tone' => 'stale',
                'title' => 'Recommendation berubah',
                'description' => 'Versi pencocokan sudah diperbarui. Muat ulang ringkasan sebelum memberi feedback.',
                'action' => ['key' => 'refresh', 'label' => 'Muat ulang ringkasan'],
            ];
        }

        if ($membership?->status === InstitutionMembershipStatus::Pending) {
            return [
                'tone' => 'pending',
                'title' => 'Afiliasi kampus sedang ditinjau',
                'description' => 'Profil tetap dapat dilengkapi. Aksi yang membutuhkan afiliasi aktif akan tersedia setelah verifikasi.',
                'action' => ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            ];
        }

        if ($recommendation !== null && $this->recommendationIsStale($recommendation)) {
            return [
                'tone' => 'stale',
                'title' => 'Recommendation perlu disegarkan',
                'description' => 'Versi pencocokan pada item ini sudah tidak aktif. Muat ulang untuk menyelaraskan alasan kecocokan terbaru.',
                'timestamp' => 'Dibuat '.$this->formatDate($recommendation->created_at),
                'timestampIso' => $recommendation->created_at->toIso8601String(),
                'action' => ['key' => 'refresh', 'label' => 'Muat ulang ringkasan'],
            ];
        }

        return null;
    }

    /** @return array<string, mixed> */
    private function activeProjects(
        User $user,
        ?Institution $institution,
        bool $hasVerifiedMembership,
    ): array {
        if (! $hasVerifiedMembership || $institution === null) {
            return [
                'state' => 'forbidden',
                'title' => 'Project aktif belum dapat ditampilkan',
                'description' => 'Verifikasi afiliasi kampus untuk melihat project yang kamu kelola.',
                'action' => ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            ];
        }

        $query = $this->activeProjectsQuery($user, $institution);
        $totalCount = (clone $query)->count();
        $projects = $query->limit(3)->get()->map(
            fn (Project $project): array => [
                'id' => $project->getKey(),
                'index' => str_pad((string) $project->getKey(), 2, '0', STR_PAD_LEFT),
                'name' => $project->title,
                'nextTask' => 'Periksa detail project dan peran yang tersedia',
                'deadline' => $this->formatShortDate($project->deadline),
                'deadlineIso' => $project->deadline->toIso8601String(),
                'deadlineTone' => $project->deadline->isPast() ? 'correction' : 'neutral',
            ],
        )->values()->all();

        if ($projects === []) {
            return [
                'state' => 'empty',
                'title' => 'Belum ada project aktif',
                'description' => 'Project aktif yang kamu kelola akan tersusun di sini.',
                'action' => ['key' => 'projects', 'label' => 'Jelajahi project'],
            ];
        }

        return [
            'state' => 'ready',
            'projects' => $projects,
            'totalCount' => $totalCount,
            'remainingActionLabel' => $totalCount > count($projects)
                ? 'Lihat '.($totalCount - count($projects)).' project lainnya'
                : null,
        ];
    }

    /** @return Builder<Project> */
    private function activeProjectsQuery(User $user, Institution $institution): Builder
    {
        return Project::query()
            ->select([
                'projects.id',
                'projects.institution_id',
                'projects.owner_id',
                'projects.title',
                'projects.status',
                'projects.deadline',
            ])
            ->forInstitution($institution)
            ->whereBelongsTo($user, 'owner')
            ->whereIn('status', [
                ProjectStatus::Open->value,
                ProjectStatus::Forming->value,
                ProjectStatus::Full->value,
            ])
            ->orderBy('deadline')
            ->orderBy('id');
    }

    /** @return array<string, mixed> */
    private function recommendations(
        User $user,
        ?Institution $institution,
        ?StudentProfile $profile,
        bool $hasVerifiedMembership,
    ): array {
        if (! $hasVerifiedMembership || $institution === null) {
            return [
                'state' => 'forbidden',
                'title' => 'Recommendation menunggu afiliasi terverifikasi',
                'description' => 'Periksa afiliasi kampus untuk membuka pencocokan project.',
                'action' => ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            ];
        }

        if (! $this->profileIsReady($profile)) {
            return [
                'state' => 'empty',
                'title' => 'Recommendation belum tersedia',
                'description' => 'Lengkapi skill dan ketersediaan agar alasan kecocokan dapat dijelaskan.',
                'action' => ['key' => 'onboarding', 'label' => 'Lengkapi profil'],
            ];
        }

        $recommendation = $this->recommendationQuery
            ->execute($user, $institution, perPage: 1)
            ->paginator
            ->first();

        if (! $recommendation instanceof Recommendation) {
            return [
                'state' => 'empty',
                'title' => 'Belum ada recommendation project',
                'description' => 'Belum ada project dengan alasan kecocokan yang dapat ditampilkan. Kamu tetap dapat menjelajahi project secara langsung.',
                'action' => ['key' => 'projects', 'label' => 'Jelajahi project'],
            ];
        }

        return [
            'state' => 'ready',
            'recommendation' => $this->recommendationView($recommendation),
        ];
    }

    /**
     * @return array{id: int, projectId: int|null, title: string, role: string, reasons: list<string>, scoreVersion: string|null, isStale: bool, createdAt: string, expiresAt: string|null}
     */
    private function recommendationView(Recommendation $recommendation): array
    {
        $summary = $this->recommendationSerializer->summary(
            $recommendation,
            MatchScoreVersion::current()?->getKey(),
        );
        $project = $recommendation->project;
        $role = $project->roles->first();

        return [
            'id' => (int) $recommendation->getKey(),
            'projectId' => (int) $project->getKey(),
            'title' => $project->title,
            'role' => $role === null ? 'Peran sesuai kebutuhan project' : $role->title,
            'reasons' => array_values(array_map(
                static fn (array $reason): string => $reason['reason'],
                $summary['top_reasons'],
            )),
            'scoreVersion' => $summary['score_version']['version'],
            'isStale' => (bool) $summary['is_stale'],
            'createdAt' => $recommendation->created_at->toIso8601String(),
            'expiresAt' => $summary['expires_at'],
        ];
    }

    private function profileIsReady(?StudentProfile $profile): bool
    {
        return $profile !== null
            && (int) $profile->skills_count > 0
            && (int) $profile->availability_windows_count > 0;
    }

    private function recommendationIsStale(Recommendation $recommendation): bool
    {
        return $recommendation->isStaleAgainst(MatchScoreVersion::current()?->getKey());
    }

    private function formatDate(CarbonInterface $date): string
    {
        return $date->locale('id')->translatedFormat('d F Y');
    }

    private function formatShortDate(CarbonInterface $date): string
    {
        return $date->isToday()
            ? 'Hari ini'
            : $date->locale('id')->isoFormat('D MMM');
    }
}
