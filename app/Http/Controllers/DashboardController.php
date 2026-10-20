<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\ResolveUserWorkspace;
use App\Actions\Matching\RecommendationQuery;
use App\Actions\Profile\ResolveStudentMembership;
use App\Actions\Profile\StudentActivationSummary;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Enums\TeamJoinRequestStatus;
use App\Enums\TeamMembershipStatus;
use App\Enums\WorkspaceRole;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchingRefreshRequest;
use App\Models\MatchScoreVersion;
use App\Models\Project;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use App\Support\Matching\RecommendationSerializer;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly RecommendationQuery $recommendationQuery,
        private readonly RecommendationSerializer $recommendationSerializer,
        private readonly ResolveUserWorkspace $resolveUserWorkspace,
        private readonly ResolveStudentMembership $resolveStudentMembership,
        private readonly MatchingAvailability $matchingAvailability,
        private readonly StudentActivationSummary $activationSummary,
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
        $activation = $this->activationSummary->handle($user);
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
            'nextAction' => $activation['universityState'] !== 'ready' ? $this->action(
                reference: 'ACTIVATION-LOCKED', category: 'Pemulihan aktivasi', statusLabel: 'Belum tersedia', statusTone: 'correction',
                title: 'Aktivasi universitas belum tersedia',
                facts: [
                    ['label' => 'Keadaan', 'value' => 'Universitas belum tersedia atau belum aktif', 'icon' => 'file'],
                    ['label' => 'Data', 'value' => 'Akun dan riwayat tersimpan tidak diubah', 'icon' => 'profile'],
                    ['label' => 'Berikutnya', 'value' => 'Hubungi pengelola SATU, lalu periksa status kembali', 'icon' => 'calendar'],
                ],
                primaryAction: ['key' => 'onboarding', 'label' => 'Periksa status aktivasi'],
            ) : $this->nextAction(
                $membership,
                $profile,
                $previewRecommendation,
                $firstActiveProject,
                $user,
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
        return $this->resolveStudentMembership->handle($user);
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
        User $user,
    ): array {
        if ($membership === null) {
            return $this->action(
                reference: 'AFF-START',
                category: 'Afiliasi kampus',
                statusLabel: 'Belum terhubung',
                statusTone: 'pending',
                title: 'Hubungkan afiliasi kampus untuk mulai berkolaborasi',
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
                title: 'Periksa afiliasi yang sedang ditinjau kampus',
                facts: [
                    [
                        'label' => 'Afiliasi',
                        'value' => $membership->institution->name,
                        'icon' => 'building',
                        'tone' => 'pending',
                    ],
                    [
                        'label' => 'Tetap tersedia',
                        'value' => 'Draft onboarding tetap tersedia, penyimpanan profil menunggu verifikasi',
                        'icon' => 'profile',
                    ],
                    [
                        'label' => 'Menunggu verifikasi',
                        'value' => 'Penyimpanan profil dan menu kolaborasi',
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

        $workAction = $this->workAction($user, $membership->institution);
        if ($workAction !== null) {
            return $workAction;
        }

        if ($activeProject !== null && Gate::forUser($user)->allows('viewAny', [Task::class, $activeProject])) {
            return $this->action(
                reference: 'PROJ-'.$activeProject->getKey(),
                category: 'Pekerjaan saya',
                statusLabel: 'Proyek aktif',
                statusTone: 'neutral',
                title: 'Lanjutkan pekerjaan bersama timmu',
                facts: [
                    ['label' => 'Proyek', 'value' => $activeProject->title, 'icon' => 'file'],
                    ['label' => 'Batas waktu proyek', 'value' => $this->formatDate($activeProject->deadline), 'icon' => 'calendar', 'dateTime' => $activeProject->deadline->toIso8601String()],
                    ['label' => 'Berikutnya', 'value' => 'Buka ruang kerja untuk memeriksa tugas dan bukti pekerjaan', 'icon' => 'user'],
                ],
                primaryAction: ['key' => 'workspace', 'label' => 'Buka ruang kerja', 'projectId' => $activeProject->getKey()],
                secondaryAction: ['key' => 'projects', 'label' => 'Lihat proyek saya', 'view' => 'mine'],
            );
        }

        $pendingRequest = TeamJoinRequest::query()
            ->with('project:id,institution_id,owner_id,title,visibility')
            ->whereBelongsTo($user, 'requester')
            ->where('status', TeamJoinRequestStatus::Pending)
            ->whereHas('project', fn (Builder $projects): Builder => $projects
                ->where('institution_id', $membership->institution_id)
                ->whereIn('status', [ProjectStatus::Open, ProjectStatus::Forming, ProjectStatus::Full])
                ->where('visibility', '!=', 'private'))
            ->oldest('requested_at')
            ->oldest('id')
            ->first();
        if ($pendingRequest !== null && Gate::forUser($user)->allows('view', $pendingRequest)) {
            return $this->action(
                reference: 'JOIN-'.$pendingRequest->getKey(),
                category: 'Pengajuan bergabung',
                statusLabel: 'Menunggu keputusan',
                statusTone: 'pending',
                title: 'Periksa pengajuan bergabungmu',
                recordedAt: $pendingRequest->requested_at,
                facts: [
                    ['label' => 'Proyek', 'value' => $pendingRequest->project->title, 'icon' => 'file'],
                    ['label' => 'Status', 'value' => 'Pengajuan terkirim, belum berarti diterima dalam tim', 'icon' => 'user'],
                ],
                primaryAction: ['key' => 'project', 'label' => 'Lihat status pengajuan', 'projectId' => $pendingRequest->project_id],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi peluang'],
            );
        }

        if (! $this->profileIsReady($profile)) {
            $profileState = $profile === null ? 'Belum dibuat' : 'Belum lengkap';

            return $this->action(
                reference: 'PROFIL-START',
                category: 'Kesiapan profil',
                statusLabel: 'Perlu dilengkapi',
                statusTone: 'correction',
                title: 'Lengkapi profil kemampuan dan kesiapanmu',
                facts: [
                    [
                        'label' => 'Profil',
                        'value' => $profileState,
                        'icon' => 'profile',
                        'tone' => 'correction',
                    ],
                    [
                        'label' => 'Yang dibutuhkan',
                        'value' => 'Keahlian dan ketersediaan waktu',
                        'icon' => 'file',
                    ],
                    [
                        'label' => 'Setelah selesai',
                        'value' => 'Profil siap digunakan untuk mencari peluang',
                        'icon' => 'calendar',
                    ],
                ],
                primaryAction: ['key' => 'profile', 'label' => 'Lengkapi profil kemampuan'],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi proyek'],
            );
        }

        if ($recommendation !== null) {
            $view = $this->recommendationView($recommendation);
            $firstReason = $view['reasons'][0] ?? 'Alasan kecocokan tersedia pada detail proyek.';

            return $this->action(
                reference: 'REC-'.str_pad((string) $recommendation->getKey(), 4, '0', STR_PAD_LEFT),
                category: 'Rekomendasi proyek',
                statusLabel: 'Peluang baru',
                statusTone: $view['isStale'] ? 'pending' : 'verified',
                title: 'Tinjau peluang yang paling relevan sekarang',
                recordedAt: $recommendation->created_at,
                facts: [
                    [
                        'label' => 'Proyek',
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
                    'label' => 'Tinjau proyek',
                    'projectId' => $view['projectId'],
                ],
                secondaryAction: ['key' => 'projects', 'label' => 'Jelajahi proyek lain'],
            );
        }

        return $this->action(
            reference: 'DISCOVERY-START',
            category: 'Peluang kolaborasi',
            statusLabel: 'Profil siap',
            statusTone: 'verified',
            title: 'Temukan proyek yang sesuai dengan kesiapanmu',
            facts: [
                [
                    'label' => 'Profil',
                    'value' => 'Siap digunakan untuk pencocokan',
                    'icon' => 'profile',
                    'tone' => 'verified',
                ],
                [
                    'label' => 'Rekomendasi',
                    'value' => 'Belum ada peluang aktif yang dapat ditampilkan',
                    'icon' => 'file',
                ],
                [
                    'label' => 'Berikutnya',
                    'value' => 'Bandingkan proyek dan kebutuhan perannya',
                    'icon' => 'calendar',
                ],
            ],
            primaryAction: ['key' => 'projects', 'label' => 'Jelajahi proyek'],
            secondaryAction: ['key' => 'profile', 'label' => 'Periksa profil kemampuan'],
        );
    }

    /** @return array<string, mixed>|null */
    private function workAction(User $user, Institution $institution): ?array
    {
        $participatingProjects = $this->activeProjectsQuery($user, $institution)
            ->select('projects.id')->reorder();
        $revision = Contribution::query()
            ->select(['id', 'institution_id', 'owner_id', 'project_id', 'status', 'updated_at'])
            ->with('project:id,institution_id,owner_id,title,status')
            ->where('institution_id', $institution->getKey())
            ->whereBelongsTo($user, 'owner')
            ->where('status', ContributionStatus::Revision)
            ->whereIn('project_id', clone $participatingProjects)
            ->oldest('updated_at')->oldest('id')->first();
        if ($revision !== null && Gate::forUser($user)->allows('update', $revision)) {
            return $this->action(
                reference: 'REV-'.$revision->getKey(),
                category: 'Revisi kontribusi',
                statusLabel: 'Perlu diperbaiki',
                statusTone: 'correction',
                title: 'Tanggapi catatan kampus pada kontribusimu',
                recordedAt: $revision->updated_at,
                facts: [
                    ['label' => 'Proyek', 'value' => $revision->project->title, 'icon' => 'file'],
                    ['label' => 'Berikutnya', 'value' => 'Baca catatan kampus, perbaiki versi, lalu kirim kembali', 'icon' => 'calendar'],
                ],
                primaryAction: ['key' => 'contribution', 'label' => 'Perbaiki kontribusi', 'contributionId' => $revision->getKey()],
                secondaryAction: ['key' => 'projects', 'label' => 'Lihat proyek saya', 'view' => 'mine'],
            );
        }

        $task = Task::query()
            ->select(['id', 'project_id', 'title', 'status', 'due_at', 'updated_at'])
            ->with('project:id,institution_id,owner_id,title,status')
            ->whereIn('project_id', $participatingProjects)
            ->whereRelation('assignments', 'user_id', $user->getKey())
            ->where('status', '!=', TaskStatus::Done)
            ->ordered()->first();
        if ($task !== null && Gate::forUser($user)->allows('view', $task)) {
            return $this->action(
                reference: 'TASK-'.$task->getKey(),
                category: 'Tugas saya',
                statusLabel: $task->status === TaskStatus::Blocked ? 'Perlu tindak lanjut' : 'Belum selesai',
                statusTone: $task->status === TaskStatus::Blocked || $task->isOverdue() ? 'correction' : 'neutral',
                title: $task->status === TaskStatus::Blocked ? 'Periksa tugas yang masih terhambat' : 'Lanjutkan tugas yang menjadi tanggung jawabmu',
                recordedAt: $task->updated_at,
                facts: [
                    ['label' => 'Tugas', 'value' => $task->title, 'icon' => 'file'],
                    ['label' => 'Proyek', 'value' => $task->project->title, 'icon' => 'user'],
                    ['label' => 'Tenggat tugas', 'value' => $task->due_at === null ? 'Belum ditetapkan' : $this->formatDate($task->due_at), 'icon' => 'calendar', 'tone' => $task->isOverdue() ? 'correction' : 'default'],
                ],
                primaryAction: ['key' => 'workspace', 'label' => 'Buka tugas di ruang kerja', 'projectId' => $task->project_id, 'taskId' => $task->getKey()],
                secondaryAction: ['key' => 'projects', 'label' => 'Lihat proyek saya', 'view' => 'mine'],
            );
        }

        return null;
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
            'description' => 'Buka menu Kontribusi untuk melihat status dan catatan kampus pada tiap pengajuan. Ringkasan validasi belum tersedia di Beranda.',
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
                'title' => 'Rekomendasi berubah',
                'description' => 'Versi pencocokan sudah diperbarui. Muat ulang ringkasan sebelum memberi feedback.',
                'action' => ['key' => 'refresh', 'label' => 'Muat ulang ringkasan'],
            ];
        }

        if ($membership?->status === InstitutionMembershipStatus::Pending) {
            return [
                'tone' => 'pending',
                'title' => 'Afiliasi kampus sedang ditinjau',
                'description' => 'Draft onboarding tetap tersedia. Penyimpanan profil dan akses menu kolaborasi menunggu afiliasi terverifikasi.',
                'action' => ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            ];
        }

        if ($recommendation !== null && $this->recommendationIsStale($recommendation)) {
            return [
                'tone' => 'stale',
                'title' => 'Rekomendasi perlu disegarkan',
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
                'title' => 'Proyek aktif belum dapat ditampilkan',
                'description' => 'Verifikasi afiliasi kampus untuk melihat proyek yang kamu kelola atau ikuti.',
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
                'nextTask' => 'Buka ruang kerja untuk memeriksa pekerjaan tim',
                'deadline' => $this->formatShortDate($project->deadline),
                'deadlineIso' => $project->deadline->toIso8601String(),
                'deadlineTone' => $project->deadline->isPast() ? 'correction' : 'neutral',
            ],
        )->values()->all();

        if ($projects === []) {
            return [
                'state' => 'empty',
                'title' => 'Belum ada proyek aktif',
                'description' => 'Proyek yang kamu kelola atau ikuti akan tersusun di sini. Mulai dengan menemukan peluang kolaborasi.',
                'action' => ['key' => 'projects', 'label' => 'Jelajahi proyek'],
            ];
        }

        return [
            'state' => 'ready',
            'projects' => $projects,
            'totalCount' => $totalCount,
            'remainingActionLabel' => $totalCount > count($projects)
                ? 'Lihat '.($totalCount - count($projects)).' proyek lainnya'
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
            ->where(fn (Builder $projects): Builder => $projects
                ->where('owner_id', $user->getKey())
                ->orWhereHas('teamMemberships', fn (Builder $memberships): Builder => $memberships
                    ->where('user_id', $user->getKey())
                    ->where('status', TeamMembershipStatus::Active)))
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
                'title' => 'Rekomendasi menunggu afiliasi terverifikasi',
                'description' => 'Periksa afiliasi kampus untuk membuka pencocokan proyek.',
                'action' => ['key' => 'onboarding', 'label' => 'Periksa afiliasi'],
            ];
        }

        if (! $this->profileIsReady($profile)) {
            return [
                'state' => 'empty',
                'title' => 'Rekomendasi belum tersedia',
                'description' => 'Lengkapi keahlian dan ketersediaan untuk menyiapkan profil pencocokan.',
                'action' => ['key' => 'profile', 'label' => 'Lengkapi profil kemampuan'],
            ];
        }

        $version = MatchScoreVersion::current();
        if (! $this->matchingAvailability->enabled() || ! $this->matchingAvailability->supported($version)) {
            return ['state' => 'unavailable', 'title' => 'Pencocokan dinamis belum diaktifkan', 'description' => 'Konfigurasi dan kebijakan versi perlu disiapkan oleh pengelola. Kamu tetap dapat menjelajahi peluang.', 'action' => ['key' => 'projects', 'label' => 'Jelajahi peluang'], 'canRefresh' => false];
        }
        $refresh = MatchingRefreshRequest::query()->where('institution_id', $institution->getKey())->where('candidate_id', $user->getKey())->first();
        if ($refresh?->status === 'queued') {
            return ['state' => 'processing', 'title' => 'Rekomendasi sedang diperbarui', 'description' => 'Data terbaru sedang diproses. Periksa status atau jelajahi peluang sambil menunggu.', 'action' => ['key' => 'refresh', 'label' => 'Periksa status'], 'canRefresh' => false];
        }
        if ($refresh?->status === 'failed') {
            return ['state' => 'error', 'title' => 'Pembaruan rekomendasi gagal', 'description' => 'Belum ada hasil baru. Minta pembaruan lagi atau tetap jelajahi peluang.', 'action' => ['key' => 'projects', 'label' => 'Jelajahi peluang'], 'canRefresh' => true];
        }
        if ($refresh === null || $refresh->status !== 'ready' || $refresh->version_id !== $version?->getKey() || $refresh->completed_at?->lte(now()->subMinutes((int) config('matching.ttl_minutes', 360)))) {
            return ['state' => 'stale', 'title' => 'Rekomendasi perlu diperbarui', 'description' => 'Belum ada hasil dari data dan versi terbaru. Minta pembaruan untuk membaca peluang aktual.', 'action' => ['key' => 'projects', 'label' => 'Jelajahi peluang'], 'canRefresh' => true];
        }
        $result = $this->recommendationQuery->execute($user, $institution, perPage: 1);
        $recommendation = $result->paginator->first();
        if ($result->staleCount > 0 && $recommendation === null) {
            return ['state' => 'stale', 'title' => 'Data peluang atau profil berubah', 'description' => 'Hasil sebelumnya tidak lagi digunakan. Perbarui rekomendasi atau jelajahi peluang.', 'action' => ['key' => 'projects', 'label' => 'Jelajahi peluang'], 'canRefresh' => true];
        }

        if (! $recommendation instanceof Recommendation) {
            return [
                'state' => 'empty',
                'title' => 'Belum ada rekomendasi proyek',
                'description' => 'Belum ada proyek dengan alasan kecocokan yang dapat ditampilkan. Kamu tetap dapat menjelajahi proyek secara langsung.',
                'action' => ['key' => 'projects', 'label' => 'Jelajahi proyek'],
                'canRefresh' => true,
            ];
        }

        return [
            'state' => 'ready',
            'recommendation' => $this->recommendationView($recommendation),
            'canRefresh' => true,
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

        return [
            'id' => (int) $recommendation->getKey(),
            'projectId' => (int) $project->getKey(),
            'title' => $project->title,
            'role' => $summary['role']['title'] ?? 'Peran sesuai kebutuhan proyek',
            'limitations' => $summary['limitations'],
            'reasonTypes' => array_column($summary['top_reasons'], 'type'),
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
