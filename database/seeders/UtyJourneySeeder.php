<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Attachment\UploadAttachment;
use App\Actions\Consent\ConsentRecorder;
use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Actions\Gamification\RebuildLeaderboardProjections;
use App\Actions\Institution\ProvisionFirstUniversityAdmin;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Actions\Profile\CreateStudentProfile;
use App\Actions\Profile\UpdateStudentProfileVisibility;
use App\Actions\Project\CreateProject;
use App\Actions\Project\OpenProject;
use App\Actions\Project\TransitionProjectStatus;
use App\Actions\Roster\ImportRoster;
use App\Actions\Task\AssignTask;
use App\Actions\Task\CreateTask;
use App\Actions\Task\TransitionTaskStatus;
use App\Actions\Team\AcceptTeamJoinRequest;
use App\Actions\Team\RejectTeamJoinRequest;
use App\Actions\Team\RequestToJoinTeam;
use App\Enums\AttachmentPurpose;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionStatus;
use App\Enums\PortfolioVisibility;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Events\ContributionApproved;
use App\Events\InstitutionMembershipRequested;
use App\Events\InstitutionMembershipReviewed;
use App\Events\MatchingInputsChanged;
use App\Events\WorkspaceAttachmentChanged;
use App\Events\WorkspaceTaskChanged;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\SkillTaxonomy;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Support\Contribution\ContributionSnapshot;
use App\Support\PhoneIdentity;
use App\Support\Portfolio\PortfolioPrivacyRevision;
use App\Support\Task\TaskSnapshot;
use App\Support\Team\TeamDecisionSnapshot;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class UtyJourneySeeder extends Seeder
{
    public const DATASET = 'uty-journey-synthetic-v3';

    public const PREVIOUS_DATASET = 'uty-core-flow-synthetic-v1';

    public const PREVIOUS_V2_DATASET = 'uty-journey-synthetic-v2';

    public const SLUG = 'universitas-teknologi-yogyakarta';

    public const PASSWORD = 'password';

    public const ACCOUNTS = [
        'mahasiswa' => 'Nadia. Data synthetic',
        'pemula' => 'Dina. Data synthetic',
        'pemilik' => 'Siti. Data synthetic',
        'anggota' => 'Budi. Data synthetic',
        'pelamar' => 'Raka. Data synthetic',
        'admin' => 'Admin Universitas UTY. Data synthetic',
        'admin_kedua' => 'Admin Universitas UTY kedua. Data synthetic',
        'afiliasi' => 'Alya. Data synthetic',
        'aktivasi' => 'Farah. Data synthetic',
        'profil' => 'Aldi. Data synthetic',
        'ditolak' => 'Tio. Data synthetic',
        'portofolio' => 'Maya. Data synthetic',
    ];

    public function __construct(
        private readonly ResolveConfiguredUniversity $resolveUniversity,
        private readonly ProvisionFirstUniversityAdmin $provisionAdmin,
        private readonly CreateStudentProfile $createProfile,
        private readonly SubmitAffiliationRequest $submitAffiliation,
        private readonly ImportRoster $importRoster,
        private readonly ConsentRecorder $consents,
        private readonly CreateProject $createProject,
        private readonly OpenProject $openProject,
        private readonly TransitionProjectStatus $transitionProject,
        private readonly RequestToJoinTeam $requestJoin,
        private readonly AcceptTeamJoinRequest $acceptJoin,
        private readonly RejectTeamJoinRequest $rejectJoin,
        private readonly CreateTask $createTask,
        private readonly AssignTask $assignTask,
        private readonly TransitionTaskStatus $transitionTask,
        private readonly UploadAttachment $uploadAttachment,
        private readonly CreateContribution $createContribution,
        private readonly SubmitContribution $submitContribution,
        private readonly ReviewContribution $reviewContribution,
        private readonly ReviseContribution $reviseContribution,
        private readonly UpdatePortfolioEntryVisibility $updateEntryVisibility,
        private readonly UpdateStudentProfileVisibility $updateProfileVisibility,
        private readonly AwardVerifiedContributionXp $awardXp,
        private readonly RebuildLeaderboardProjections $rebuildLeaderboards,
    ) {}

    public function run(): void
    {
        $this->ensureSafeTarget();
        if (DB::transactionLevel() !== 0) {
            throw new RuntimeException('Jalankan seeder di luar transaksi lain agar notifikasi commit tetap terisolasi.');
        }
        $existing = Institution::query()->where('slug', self::SLUG)->first();
        $existingDataset = $existing?->settings['demo_dataset'] ?? null;
        if ($existing !== null) {
            if (! in_array($existingDataset, [self::DATASET, self::PREVIOUS_DATASET, self::PREVIOUS_V2_DATASET], true) || ! ($existing->settings['demo_seed_complete'] ?? false)) {
                throw new RuntimeException('Slug kampus uji sudah dipakai dataset lain atau belum lengkap. Tidak menimpa data.');
            }
            if ($existingDataset === self::DATASET && ($existing->settings['demo_leaderboard_complete'] ?? false)) {
                $this->command->info('Dataset sudah tersedia. Perubahan selama uji dipertahankan; tidak ada reset atau duplikasi.');

                return;
            }
        }
        foreach (array_keys(self::ACCOUNTS) as $index => $role) {
            if ($existingDataset === self::PREVIOUS_DATASET && $index < 8) {
                $this->existingAccount($role, $index);

                continue;
            }
            if (in_array($existingDataset, [self::DATASET, self::PREVIOUS_V2_DATASET], true)) {
                $this->existingAccount($role, $index);

                continue;
            }
            if (User::query()->where('username', 'uty_'.$role)->exists()
                || PhoneNumber::query()->where('number_hash', PhoneIdentity::hash($this->phone($index)))->exists()) {
                throw new RuntimeException('Identitas akun uji sudah dipakai. Tidak mengubah akun atau nomor existing.');
            }
        }
        $originalConfig = [
            'queue.default' => config('queue.default'),
            'broadcasting.default' => config('broadcasting.default'),
        ];
        config()->set(['queue.default' => 'sync', 'broadcasting.default' => 'null']);
        try {
            Event::fakeFor(fn () => DB::transaction(function () use ($existing, $existingDataset): void {
                if ($existing === null) {
                    $this->seedDataset();
                    $this->seedLeaderboard(Institution::query()->where('slug', self::SLUG)->sole());

                    return;
                }
                $campus = Institution::query()->whereKey($existing->getKey())->lockForUpdate()->firstOrFail();
                if (($campus->settings['demo_dataset'] ?? null) !== $existingDataset || ! ($campus->settings['demo_seed_complete'] ?? false)) {
                    throw new RuntimeException('Dataset berubah saat pembaruan. Jalankan ulang untuk membaca keadaan terbaru.');
                }
                if ($existingDataset === self::PREVIOUS_DATASET) {
                    $this->seedJourneyScenarios($campus);
                }
                if ($existingDataset !== self::DATASET) {
                    $this->updateSeedAccountPasswords();
                }
                $this->seedLeaderboard($campus);
                $this->markComplete($campus);
            }), [
                MatchingInputsChanged::class, ContributionApproved::class,
                WorkspaceTaskChanged::class, WorkspaceAttachmentChanged::class,
                InstitutionMembershipRequested::class, InstitutionMembershipReviewed::class,
            ]);
        } finally {
            config()->set($originalConfig);
        }
        $this->command->info('Dataset alur inti dibuat. Hanya notifikasi database, tanpa OTP/WhatsApp atau provider akademik.');
        $this->command->info('Akun UTY: '.implode(', ', array_map(fn (string $role): string => 'uty_'.$role, array_keys(self::ACCOUNTS))));
        $this->command->info('Password akun synthetic: '.self::PASSWORD);
        $this->command->info('Uji aktivasi: uty_aktivasi memakai NIM UI-DEMO-9. uty_profil sudah berafiliasi, tetapi belum mengisi profil.');
        $this->command->warn('Versi/bobot pencocokan global tidak diubah. Tanpa versi aktif, gunakan penelusuran peluang.');
    }

    private function ensureSafeTarget(): void
    {
        if ($this->resolveUniversity->slug() !== self::SLUG) {
            throw new RuntimeException('Seeder UTY memerlukan SATU_UNIVERSITY_SLUG=universitas-teknologi-yogyakarta. Tidak mengubah konfigurasi atau kampus lain.');
        }
        $connection = DB::connection();
        $memoryTest = app()->environment('testing') && $connection->getDriverName() === 'sqlite'
            && $connection->getConfig('database') === ':memory:';
        $localMysql = app()->isLocal() && $connection->getDriverName() === 'mysql'
            && in_array($connection->getConfig('host'), ['localhost', '127.0.0.1', '::1'], true);
        if (! $memoryTest && ! $localMysql) {
            throw new RuntimeException('Seeder UI hanya untuk MySQL lokal atau SQLite di memori. Production/staging ditolak.');
        }
        foreach (['local', 'private'] as $disk) {
            if (config('filesystems.disks.'.$disk.'.driver') !== 'local') {
                throw new RuntimeException('Berkas synthetic hanya boleh disimpan pada disk lokal privat.');
            }
        }
    }

    private function seedDataset(): void
    {
        $this->call(SkillTaxonomySeeder::class);
        $campus = Institution::query()->create([
            'name' => 'Universitas Teknologi Yogyakarta', 'slug' => self::SLUG,
            'status' => InstitutionStatus::Active,
            'settings' => ['demo_dataset' => self::DATASET, 'demo_seed_complete' => false],
        ]);
        $password = Hash::make(self::PASSWORD);
        $users = [];
        foreach (array_slice(self::ACCOUNTS, 0, 8, true) as $role => $name) {
            $users[$role] = User::factory()->create([
                'name' => $name, 'username' => 'uty_'.$role, 'password' => $password,
                'is_platform_admin' => false,
            ]);
            $this->consents->grant($users[$role], 'registration.terms', 'v1', 'demo.uty_core_flow');
        }
        $roster = "nim,nama,program_studi,angkatan,semester,nomor_whatsapp\n";
        foreach (array_keys(array_slice(self::ACCOUNTS, 0, 8, true)) as $index => $role) {
            PhoneNumber::factory()->forNumber($this->phone($index))->create(['user_id' => $users[$role]->getKey()]);
            if (in_array($role, ['mahasiswa', 'pemula', 'pemilik', 'anggota', 'pelamar'], true)) {
                $roster .= 'UI-DEMO-'.($index + 1).','.$users[$role]->name.',Informatika,2026,UI-Synthetic,'.$this->phone($index)."\n";
            }
        }
        $this->provisionAdmin->handle($users['admin']->id, 'Provisioning awal UTY untuk data synthetic lokal, bukan identitas atau verifikasi kampus nyata.', true);
        InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin($users['admin'])
            ->create(['institution_id' => $campus->getKey(), 'user_id' => $users['admin_kedua']->getKey()]);
        $rosterPath = 'demo/uty-core-flow/'.Str::uuid().'/roster.csv';
        DB::afterRollBack(fn () => Storage::disk('local')->delete($rosterPath));
        if (! Storage::disk('local')->put($rosterPath, $roster)) {
            throw new RuntimeException('Roster synthetic tidak tersimpan. Transaksi dibatalkan.');
        }
        $this->importRoster->commit($users['admin'], $campus, $rosterPath, 'UI-Synthetic');
        foreach (array_keys(array_slice(self::ACCOUNTS, 0, 8, true)) as $index => $role) {
            if (in_array($role, ['admin', 'admin_kedua'], true)) {
                continue;
            }
            $this->submitAffiliation->handle($users[$role], $campus, $role === 'afiliasi' ? 'UI-DEMO-BELUM-COCOK' : 'UI-DEMO-'.($index + 1));
        }
        $design = $this->taxonomy('Desain antarmuka. Data synthetic', 'design');
        $frontend = $this->taxonomy('Frontend. Data synthetic', 'software');
        $interest = $this->taxonomy('Layanan kampus. Data synthetic', 'interest');
        foreach (['mahasiswa', 'pemilik', 'anggota', 'pelamar'] as $role) {
            $this->createProfile->handle($users[$role], $campus, [
                'bio' => 'Tertarik bekerja pada layanan kampus. Data synthetic untuk uji UI, bukan hasil pilot.',
                'study_program' => 'Informatika', 'study_year' => 1,
                'skills' => [['taxonomy_id' => $design->getKey(), 'proficiency' => 'beginner']],
                'interests' => [$interest->getKey()],
                'availability_windows' => [
                    ['day_of_week' => 2, 'starts_at' => '15:00', 'ends_at' => '17:00', 'timezone' => 'Asia/Jakarta'],
                    ['day_of_week' => 4, 'starts_at' => '15:00', 'ends_at' => '17:00', 'timezone' => 'Asia/Jakarta'],
                ],
            ]);
        }
        $this->createProfile->handle($users['pemula'], $campus, [
            'study_program' => 'Informatika', 'study_year' => 1,
            'bio' => 'Belum punya karya. Ingin belajar melalui peran pemula. Data synthetic.',
            'interests' => [$interest->getKey()],
        ]);
        $owner = $users['pemilik'];
        $beginner = $this->project($owner, $campus, $design, '01. Ruang Baca Kampus', 4, true);
        $technical = $this->project($owner, $campus, $frontend, '02. Portal Kegiatan Kampus', 3, false);
        $workspace = $this->project($owner, $campus, $design, '03. Arsip Karya Mahasiswa', 4, true);
        $full = $this->project($owner, $campus, $design, '04. Peran yang Sudah Penuh', 1, true);
        $closed = $this->project($owner, $campus, $design, '05. Proyek Ditutup', 2, true);
        $this->project($owner, $campus, $design, '06. Draft Proyek Pemilik', 2, true, false);
        $this->transitionProject->handle($owner, $closed, ProjectStatus::Closed, reason: 'Contoh peluang ditutup. Data synthetic.');
        $this->join($users['pelamar'], $beginner);
        $declined = $this->join($users['pelamar'], $technical);
        $this->rejectJoin->handle($owner, $declined, 'Peran memerlukan pengalaman frontend; tersedia jalur pemula pada proyek lain. Data synthetic.', $this->joinRevision($declined));
        foreach ([$workspace, $full] as $project) {
            $request = $this->join($users['anggota'], $project);
            $this->acceptJoin->handle($owner, $request, 'Bekal dan ketersediaan sesuai kebutuhan peran. Keputusan synthetic.', $this->joinRevision($request));
        }
        $workspace = $workspace->fresh();
        foreach ([TaskStatus::Todo, TaskStatus::InProgress, TaskStatus::Blocked] as $index => $status) {
            $task = $this->createTask->handle($owner, $workspace, [
                'title' => ($index + 1).'. '.match ($status) {
                    TaskStatus::Todo => 'Susun daftar kebutuhan pengguna',
                    TaskStatus::InProgress => 'Rancang navigasi arsip',
                    default => 'Konfirmasi sumber materi kampus',
                },
                'description' => 'Contoh pekerjaan untuk mencoba papan tugas. Data synthetic.',
                'due_at' => now()->addDays(7)->toIso8601String(),
            ]);
            if ($status !== TaskStatus::Blocked) {
                $this->assignTask->handle($owner, $task, $users['anggota'], TaskSnapshot::revision($task));
            }
            if ($status !== TaskStatus::Todo) {
                $this->transitionTask->handle($owner, $task->fresh(), $status, TaskSnapshot::revision($task->fresh()));
            }
        }
        foreach (['draft', 'pending', 'revision', 'approved'] as $index => $state) {
            $task = $this->createTask->handle($owner, $workspace, [
                'title' => ($index + 4).'. Hasil rancangan '.$state,
                'description' => 'Tugas sumber untuk contoh kontribusi '.$state.'. Data synthetic.',
            ]);
            $this->assignTask->handle($owner, $task, $users['anggota'], TaskSnapshot::revision($task));
            $task = $this->transitionTask->handle($users['anggota'], $task->fresh(), TaskStatus::Done, TaskSnapshot::revision($task->fresh()));
            $proof = $this->uploadAttachment->handle($users['anggota'], $workspace,
                UploadedFile::fake()->createWithContent('bukti-'.$state.'.txt', "Data synthetic. Contoh bukti rancangan {$state}, bukan karya mahasiswa nyata.\n"), purpose: AttachmentPurpose::Evidence);
            $contribution = $this->createContribution->handle($users['anggota'], $workspace, [
                'task_id' => $task->getKey(), 'claim' => 'Rancangan arsip: '.$state.'. Data synthetic',
                'summary' => 'Menyusun alur dan alasan keputusan rancangan individual. Contoh untuk pengujian UI.',
                'declaration' => 'Pernyataan individual synthetic. Bukan validasi hasil pilot.',
                'evidence' => [$proof->getKey()],
            ]);
            if ($state === 'draft') {
                continue;
            }
            $contribution = $this->submitContribution->handle($users['anggota'], $contribution, ContributionSnapshot::revision($contribution));
            if (in_array($state, ['revision', 'approved'], true)) {
                $this->reviewContribution->handle($contribution, $users['admin'],
                    $state === 'revision' ? ContributionReviewDecision::Revision : ContributionReviewDecision::Approved,
                    1, ContributionSnapshot::revision($contribution),
                    $state === 'revision' ? 'Jelaskan alasan pemilihan navigasi pada versi perbaikan. Data synthetic.' : 'Bukti contoh sesuai klaim individual. Data synthetic.');
            }
        }
        $this->seedJourneyScenarios($campus);
        $this->markComplete($campus);
    }

    private function existingAccount(string $role, int $index): User
    {
        $user = User::query()->where('username', 'uty_'.$role)
            ->whereHas('phoneNumbers', fn ($query) => $query->where('number_hash', PhoneIdentity::hash($this->phone($index))))
            ->first();

        if ($user === null) {
            throw new RuntimeException('Identitas dataset UTY sebelumnya berubah atau tidak lengkap. Tidak mengambil alih akun existing.');
        }

        return $user;
    }

    private function updateSeedAccountPasswords(): void
    {
        $password = Hash::make(self::PASSWORD);
        foreach (array_keys(self::ACCOUNTS) as $index => $role) {
            $user = $this->existingAccount($role, $index);
            $user->forceFill(['password' => $password])->save();
        }
    }

    private function seedLeaderboard(Institution $campus): void
    {
        $member = $this->existingAccount('anggota', 3);
        $portfolioOwner = $this->existingAccount('portofolio', 11);
        $projectOwner = $this->existingAccount('pemilik', 2);
        $contributions = Contribution::query()->whereBelongsTo($campus)
            ->whereIn('owner_id', [$member->getKey(), $portfolioOwner->getKey()])
            ->where('status', ContributionStatus::Approved)
            ->whereHas('project', fn ($query) => $query->where('institution_id', $campus->getKey())
                ->where('owner_id', $projectOwner->getKey())->where('title', 'like', '%. Data synthetic'))
            ->orderBy('id')->get();
        foreach ($contributions as $contribution) {
            $this->awardXp->handle($contribution);
        }
        $semester = $campus->rosters()->active()->latest('activated_at')->latest('id')->value('semester');
        if (is_string($semester) && $semester !== '') {
            $this->rebuildLeaderboards->handle($campus, $semester);
        }
        $campus->forceFill(['settings' => [...($campus->settings ?? []), 'demo_leaderboard_complete' => true]])->save();
    }

    private function seedJourneyScenarios(Institution $campus): void
    {
        $users = [
            'pemilik' => $this->existingAccount('pemilik', 2),
            'admin' => $this->existingAccount('admin', 5),
            'admin_kedua' => $this->existingAccount('admin_kedua', 6),
        ];
        $password = Hash::make(self::PASSWORD);
        foreach (self::ACCOUNTS as $role => $name) {
            $index = (int) array_search($role, array_keys(self::ACCOUNTS), true);
            if ($index < 8) {
                continue;
            }
            $users[$role] = User::factory()->create([
                'name' => $name, 'username' => 'uty_'.$role, 'password' => $password,
                'is_platform_admin' => false,
            ]);
            PhoneNumber::factory()->forNumber($this->phone($index))->create(['user_id' => $users[$role]->getKey()]);
            $this->consents->grant($users[$role], 'registration.terms', 'v1', 'demo.uty_journey');
        }

        $roster = "nim,nama,program_studi,angkatan,semester,nomor_whatsapp\n";
        foreach (array_keys(self::ACCOUNTS) as $index => $role) {
            if (in_array($role, ['admin', 'admin_kedua', 'afiliasi'], true)) {
                continue;
            }
            $roster .= 'UI-DEMO-'.($index + 1).','.self::ACCOUNTS[$role].','.$this->studyProgram($role).',2026,UI-Synthetic,'.$this->phone($index)."\n";
        }
        $rosterPath = 'demo/uty-journey/'.Str::uuid().'/roster.csv';
        DB::afterRollBack(fn () => Storage::disk('local')->delete($rosterPath));
        if (! Storage::disk('local')->put($rosterPath, $roster)) {
            throw new RuntimeException('Roster perjalanan UTY tidak tersimpan. Transaksi dibatalkan.');
        }
        $this->importRoster->commit($users['admin'], $campus, $rosterPath, 'UI-Synthetic');
        foreach (['profil', 'ditolak', 'portofolio'] as $role) {
            $index = (int) array_search($role, array_keys(self::ACCOUNTS), true);
            $this->submitAffiliation->handle($users[$role], $campus, 'UI-DEMO-'.($index + 1));
        }

        $design = $this->taxonomy('Desain antarmuka. Data synthetic', 'design');
        $writing = $this->taxonomy('Dokumentasi proyek. Data synthetic', 'management');
        $interest = $this->taxonomy('Layanan kampus. Data synthetic', 'interest');
        foreach (['ditolak', 'portofolio'] as $role) {
            $this->createProfile->handle($users[$role], $campus, [
                'study_program' => $this->studyProgram($role), 'study_year' => 1,
                'bio' => 'Belajar membuat layanan kampus bersama rekan lintas program studi. Data synthetic.',
                'skills' => [['taxonomy_id' => $design->getKey(), 'proficiency' => 'beginner']],
                'interests' => [$interest->getKey()],
                'availability_windows' => [['day_of_week' => 2, 'starts_at' => '15:00', 'ends_at' => '17:00', 'timezone' => 'Asia/Jakarta']],
            ]);
        }
        $owner = $users['pemilik'];
        $workspace = $this->project($owner, $campus, $design, '07. Layanan Peminjaman Buku', 4, true);
        $opportunity = $this->createProject->handle($owner, $campus, [
            'title' => '08. Panduan Kampus untuk Mahasiswa Baru. Data synthetic',
            'description' => 'Menyusun panduan layanan kampus yang mudah dipahami bersama mahasiswa lintas program studi. Data synthetic, bukan program resmi UTY.',
            'capacity' => 4, 'deadline' => now()->addDays(45),
            'roles' => [
                ['title' => 'Perancang panduan pemula', 'capacity' => 2, 'accepts_beginners' => true,
                    'selection_criteria' => 'Mau belajar menyusun informasi dan tersedia Selasa sore. Tidak wajib karya sebelumnya.',
                    'skills' => [['taxonomy_id' => $design->getKey(), 'proficiency' => 'beginner']]],
                ['title' => 'Penulis dokumentasi pemula', 'capacity' => 2, 'accepts_beginners' => true,
                    'selection_criteria' => 'Mau belajar menulis instruksi singkat dan memeriksa sumber informasi.',
                    'skills' => [['taxonomy_id' => $writing->getKey(), 'proficiency' => 'beginner']]],
            ],
        ]);
        $this->openProject->handle($owner, $opportunity, reason: 'Peluang lintas program studi untuk demonstrasi synthetic.');
        foreach (['ditolak', 'portofolio'] as $role) {
            $request = $this->join($users[$role], $workspace);
            $this->acceptJoin->handle($owner, $request, 'Minat, bekal dasar dan waktu sesuai peran pemula. Keputusan synthetic.', $this->joinRevision($request));
        }

        $this->reviewedWork($owner, $users['ditolak'], $users['admin'], $workspace,
            'Ringkasan kebutuhan peminjaman buku', ContributionReviewDecision::Rejected,
            'Bukti yang diajukan belum mendukung klaim wawancara pengguna. Contoh penolakan beralasan, bukan penilaian seluruh kemampuan mahasiswa. Data synthetic.');
        $this->reviewedWork($owner, $users['portofolio'], $users['admin'], $workspace,
            'Struktur informasi peminjaman', ContributionReviewDecision::Approved,
            'Bukti struktur informasi sesuai bagian pekerjaan individual. Data synthetic.');
        $campusWork = $this->reviewedWork($owner, $users['portofolio'], $users['admin_kedua'], $workspace,
            'Panduan pengembalian buku', ContributionReviewDecision::Approved,
            'Bukti panduan sesuai klaim individual yang diajukan. Data synthetic.');
        $publicWork = $this->reviewedWork($owner, $users['portofolio'], $users['admin'], $workspace,
            'Rancangan alur peminjaman buku', ContributionReviewDecision::Revision,
            'Tambahkan alasan keputusan desain dan hubungan bukti dengan pekerjaan individual. Data synthetic.');
        $proof = $this->uploadAttachment->handle($users['portofolio'], $workspace->fresh(),
            UploadedFile::fake()->createWithContent('rancangan-perbaikan.txt', "Data synthetic. Rancangan alur peminjaman buku versi kedua.\nPilihan buku, pengajuan pinjaman dan pengambilan dipisahkan agar urutan pekerjaan jelas.\nPekerjaan individual Maya pada contoh, bukan karya nyata atau hasil uji pengguna.\n"),
            purpose: AttachmentPurpose::Evidence);
        $publicWork = $this->reviseContribution->handle($users['portofolio'], $publicWork->fresh(), [
            'expected_revision' => ContributionSnapshot::revision($publicWork->fresh()),
            'summary' => 'Merancang alur memilih buku, mengajukan pinjaman dan mengambil buku, disertai alasan pemisahan langkah. Data synthetic.',
            'evidence' => [$proof->getKey()],
        ]);
        $publicWork = $this->submitContribution->handle($users['portofolio'], $publicWork, ContributionSnapshot::revision($publicWork));
        $this->reviewContribution->handle($publicWork, $users['admin_kedua'], ContributionReviewDecision::Approved,
            2, ContributionSnapshot::revision($publicWork->fresh()), 'Bukti versi kedua mendukung klaim individual. Data synthetic.');

        $profile = $users['portofolio']->studentProfiles()->where('institution_id', $campus->getKey())->sole();
        $this->updateProfileVisibility->handle($users['portofolio'], $profile, ['portfolio_visibility' => PortfolioVisibility::Public->value, 'expected_privacy_revision' => PortfolioPrivacyRevision::for($profile)]);
        foreach ([[$campusWork, PortfolioVisibility::Private], [$publicWork, PortfolioVisibility::Public]] as [$work, $visibility]) {
            $entry = PortfolioEntry::query()->where('contribution_id', $work->getKey())->sole();
            $this->updateEntryVisibility->handle($users['portofolio'], $entry, ['visibility' => $visibility->value, 'expected_privacy_revision' => PortfolioPrivacyRevision::for($entry)]);
        }
    }

    private function reviewedWork(User $owner, User $student, User $reviewer, Project $project, string $title, ContributionReviewDecision $decision, string $reason): Contribution
    {
        $task = $this->createTask->handle($owner, $project->fresh(), [
            'title' => $title, 'description' => 'Kerjakan bagian individual dan jelaskan hasilnya. Data synthetic.',
            'due_at' => now()->addDays(7)->toIso8601String(),
        ]);
        $this->assignTask->handle($owner, $task, $student, TaskSnapshot::revision($task));
        $task = $this->transitionTask->handle($student, $task->fresh(), TaskStatus::Done, TaskSnapshot::revision($task->fresh()));
        $proof = $this->uploadAttachment->handle($student, $project->fresh(),
            UploadedFile::fake()->createWithContent(Str::slug($title).'.txt', "Data synthetic. {$title}.\nContoh bukti privat untuk {$student->name}.\nBerkas ini dapat dibuka untuk menguji peninjauan, bukan karya atau identitas mahasiswa nyata.\n"),
            purpose: AttachmentPurpose::Evidence);
        $contribution = $this->createContribution->handle($student, $project->fresh(), [
            'task_id' => $task->getKey(), 'claim' => $title.'. Data synthetic',
            'summary' => 'Menyusun '.$title.' sebagai bagian pekerjaan individual dalam proyek layanan kampus. Data synthetic.',
            'declaration' => 'Pernyataan individual privat untuk pengujian. Data synthetic, bukan hasil pilot.',
            'evidence' => [$proof->getKey()],
        ]);
        $contribution = $this->submitContribution->handle($student, $contribution, ContributionSnapshot::revision($contribution));
        $this->reviewContribution->handle($contribution, $reviewer, $decision, 1, ContributionSnapshot::revision($contribution), $reason);

        return $contribution->refresh();
    }

    private function markComplete(Institution $campus): void
    {
        $campus->forceFill(['settings' => [
            ...($campus->settings ?? []), 'demo_dataset' => self::DATASET, 'demo_seed_complete' => true,
        ]])->save();
    }

    private function studyProgram(string $role): string
    {
        return match ($role) {
            'portofolio' => 'Desain Komunikasi Visual',
            'ditolak' => 'Sistem Informasi',
            default => 'Informatika',
        };
    }

    private function taxonomy(string $name, string $category): SkillTaxonomy
    {
        return SkillTaxonomy::query()->firstOrCreate(['name' => $name], [
            'category' => $category, 'description' => 'Katalog contoh synthetic untuk pengujian alur inti.',
            'is_verified' => true,
        ]);
    }

    private function project(User $owner, Institution $campus, SkillTaxonomy $skill, string $title, int $capacity, bool $beginners, bool $open = true): Project
    {
        $project = $this->createProject->handle($owner, $campus, [
            'title' => $title.'. Data synthetic',
            'description' => 'Membuat layanan kampus sederhana dengan tugas individual dan pendampingan. Data synthetic untuk uji sistem.',
            'capacity' => $capacity, 'deadline' => now()->addDays(30),
            'roles' => [[
                'title' => $beginners ? 'Perancang antarmuka pemula' : 'Pengembang frontend',
                'description' => 'Membantu membuat hasil kerja yang dapat diperiksa.',
                'capacity' => $capacity, 'accepts_beginners' => $beginners,
                'selection_criteria' => $beginners ? 'Minat belajar, dasar rancangan dan waktu yang sesuai. Tidak perlu karya terdahulu.' : 'Pengalaman frontend dan ketersediaan pengerjaan.',
                'skills' => [['taxonomy_id' => $skill->getKey(), 'proficiency' => $beginners ? 'beginner' : 'intermediate']],
            ]],
        ]);

        return $open ? $this->openProject->handle($owner, $project, reason: 'Peluang synthetic untuk pengujian UI.') : $project;
    }

    private function join(User $student, Project $project): TeamJoinRequest
    {
        return $this->requestJoin->handle($student, $project->fresh(), $project->roles()->firstOrFail()->getKey(),
            "Minat: Belajar membuat layanan kampus.\nKemampuan relevan: Dasar rancangan dan ingin mengembangkan kemampuan.\nKetersediaan: Selasa dan Kamis sore. Data synthetic.");
    }

    private function joinRevision(TeamJoinRequest $request): string
    {
        return TeamDecisionSnapshot::revision($request->fresh(), TeamDecisionSnapshot::context($request->project->fresh()));
    }

    private function phone(int $index): string
    {
        return '+62813994000'.str_pad((string) $index, 2, '0', STR_PAD_LEFT);
    }
}
