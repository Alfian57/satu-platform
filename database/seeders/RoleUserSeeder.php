<?php

namespace Database\Seeders;

use App\Enums\ContactRequestStatus;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionRosterStatus;
use App\Enums\InstitutionStatus;
use App\Enums\PortfolioVerificationLevel;
use App\Enums\PortfolioVisibility;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamMembershipStatus;
use App\Models\AffiliationRequest;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RoleUserSeeder extends Seeder
{
    /**
     * Seed comprehensive presentation-ready data for SATU Platform.
     * All accounts use password: 'password'
     */
    public function run(): void
    {
        $password = Hash::make('password');

        // ============================================================
        // 0. Seed Canonical Skill Taxonomies (85 skills)
        // ============================================================
        $this->call(SkillTaxonomySeeder::class);

        // ============================================================
        // 1. Institution: Universitas SATU (Main Presentation Tenant)
        // ============================================================
        $institution = Institution::firstOrCreate(
            ['slug' => 'universitas-satu'],
            [
                'name' => 'Universitas SATU',
                'status' => InstitutionStatus::Active,
            ]
        );

        InstitutionDomain::firstOrCreate(
            ['institution_id' => $institution->id, 'domain' => 'satu.ac.id'],
            ['status' => \App\Enums\InstitutionDomainStatus::Verified, 'verified_at' => now()]
        );

        // ============================================================
        // 2. Platform Admin (Role: platform_admin)
        // ============================================================
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin Platform SATU',
                'password' => $password,
                'is_platform_admin' => true,
            ]
        );

        if (! PhoneNumber::where('user_id', $admin->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281211111111')->create(['user_id' => $admin->id]);
        }

        // ============================================================
        // 3. Campus Operator / Admin (Role: campus_admin)
        // ============================================================
        $campusVerifier = User::firstOrCreate(
            ['username' => 'operator_kampus'],
            [
                'name' => 'Operator Kampus SATU',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );

        if (! PhoneNumber::where('user_id', $campusVerifier->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281222222222')->create(['user_id' => $campusVerifier->id]);
        }

        InstitutionMembership::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'user_id' => $campusVerifier->id,
            ],
            [
                'role' => InstitutionMembershipRole::CampusAdmin,
                'status' => InstitutionMembershipStatus::Verified,
                'verification_method' => InstitutionMembershipVerificationMethod::ApprovedDomain,
                'verified_at' => now(),
                'reviewed_by_id' => $admin->id,
            ]
        );

        // Create Academic Roster for Universitas SATU
        $roster = InstitutionRoster::firstOrCreate(
            ['institution_id' => $institution->id, 'semester' => '2026-S1'],
            [
                'source_filename' => 'roster_mahasiswa_2026_s1.csv',
                'checksum' => hash('sha256', 'universitas-satu-roster-2026'),
                'total_rows' => 50,
                'valid_rows' => 50,
                'error_rows' => 0,
                'status' => InstitutionRosterStatus::Active,
                'imported_by' => $campusVerifier->id,
                'activated_at' => now(),
            ]
        );

        // ============================================================
        // 4. Mahasiswa Demo Presenter: Budi Mahasiswa (username: mahasiswa)
        // Note: Profile intentionally EMPTY so Onboarding Modal triggers on Dashboard!
        // ============================================================
        $budiPhone = '+6281233333333';
        $budi = User::firstOrCreate(
            ['username' => 'mahasiswa'],
            [
                'name' => 'Budi Mahasiswa',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );

        if (! PhoneNumber::where('user_id', $budi->id)->exists()) {
            PhoneNumber::factory()->forNumber($budiPhone)->create(['user_id' => $budi->id]);
        }

        $budiRosterRow = InstitutionRosterRow::firstOrCreate(
            ['roster_id' => $roster->id, 'nim' => '2024001001'],
            [
                'nama' => 'Budi Mahasiswa',
                'program_studi' => 'Teknik Informatika',
                'angkatan' => '2024',
                'semester' => '2026-S1',
                'phone_hash' => PhoneIdentity::hash($budiPhone),
                'phone_encrypted' => $budiPhone,
                'is_active' => true,
            ]
        );

        $budiMembership = InstitutionMembership::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'user_id' => $budi->id,
            ],
            [
                'role' => InstitutionMembershipRole::Student,
                'status' => InstitutionMembershipStatus::Verified,
                'verification_method' => InstitutionMembershipVerificationMethod::RosterExactMatch,
                'verified_at' => now(),
                'reviewed_by_id' => $campusVerifier->id,
            ]
        );

        AffiliationRequest::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'user_id' => $budi->id,
            ],
            [
                'status' => \App\Enums\AffiliationRequestStatus::Approved,
                'match_result' => \App\Enums\AffiliationMatchResult::ExactMatch,
                'roster_id' => $roster->id,
                'roster_row_id' => $budiRosterRow->id,
                'submitted_at' => now()->subDays(30),
                'resolved_at' => now()->subDays(30),
                'resolved_by_id' => $campusVerifier->id,
            ]
        );

        // Explicitly DELETE any existing StudentProfile for Budi to guarantee clean onboarding trigger!
        StudentProfile::where('user_id', $budi->id)->delete();

        // ============================================================
        // 5. Peer Students in Universitas SATU (Rich Ecosystem Data)
        // ============================================================
        $students = [
            [
                'username' => 'siti_rahma',
                'name' => 'Siti Rahma',
                'phone' => '+6281255555555',
                'nim' => '2024001002',
                'program' => 'Teknik Informatika',
                'year' => 3,
                'bio' => 'Spesialis perancangan arsitektur microservices, backend Laravel, dan pipeline CI/CD.',
                'skills' => ['Laravel', 'PHP', 'PostgreSQL', 'Docker', 'Redis', 'RESTful API'],
                'headline' => 'Backend Engineer & Cloud Architecture',
            ],
            [
                'username' => 'ahmad_fauzi',
                'name' => 'Ahmad Fauzi',
                'phone' => '+6281266666666',
                'nim' => '2024001003',
                'program' => 'Sistem Informasi',
                'year' => 3,
                'bio' => 'Fokus pada pengembangan antarmuka web modern dengan React, TypeScript, dan Next.js.',
                'skills' => ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Figma', 'UI/UX Design'],
                'headline' => 'Frontend Developer & UI Specialist',
            ],
            [
                'username' => 'dewi_lestari',
                'name' => 'Dewi Lestari',
                'phone' => '+6281277777777',
                'nim' => '2024001004',
                'program' => 'Desain Komunikasi Visual',
                'year' => 2,
                'bio' => 'Desainer interaksi digital dengan pengalaman merancang design system dan user research.',
                'skills' => ['Figma', 'UI/UX Design', 'Design System', 'User Research', 'Prototyping'],
                'headline' => 'Product Designer & Design System Lead',
            ],
            [
                'username' => 'rian_pratama',
                'name' => 'Rian Pratama',
                'phone' => '+6281288888888',
                'nim' => '2024001005',
                'program' => 'Teknik Komputer',
                'year' => 3,
                'bio' => 'Pengembang sistem kecerdasan buatan, computer vision, dan integrasi perangkat IoT.',
                'skills' => ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision', 'Internet of Things (IoT)'],
                'headline' => 'AI Engineer & IoT Specialist',
            ],
        ];

        $studentUsers = [];

        foreach ($students as $data) {
            $user = User::firstOrCreate(
                ['username' => $data['username']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                    'is_platform_admin' => false,
                ]
            );

            if (! PhoneNumber::where('user_id', $user->id)->exists()) {
                PhoneNumber::factory()->forNumber($data['phone'])->create(['user_id' => $user->id]);
            }

            InstitutionMembership::firstOrCreate(
                [
                    'institution_id' => $institution->id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => InstitutionMembershipRole::Student,
                    'status' => InstitutionMembershipStatus::Verified,
                    'verification_method' => InstitutionMembershipVerificationMethod::RosterExactMatch,
                    'verified_at' => now(),
                    'reviewed_by_id' => $campusVerifier->id,
                ]
            );

            $profile = StudentProfile::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'institution_id' => $institution->id,
                ],
                [
                    'public_identifier' => 'SID-' . strtoupper(Str::random(8)),
                    'study_program' => $data['program'],
                    'study_year' => $data['year'],
                    'bio' => $data['bio'],
                    'portfolio_visibility' => PortfolioVisibility::Recruiter,
                    'recruiter_discoverable' => true,
                ]
            );

            TalentCandidateProjection::firstOrCreate(
                ['user_id' => $user->id, 'institution_id' => $institution->id],
                [
                    'headline' => $data['headline'],
                    'bio' => $data['bio'],
                    'skills' => $data['skills'],
                    'badges' => ['Verified Contributor', 'Top Collaborator'],
                    'availability_status' => 'open_to_offers',
                    'is_visible' => true,
                    'verified_at' => now()->subDays(10),
                ]
            );

            $studentUsers[$data['username']] = $user;
        }

        // ============================================================
        // 6. Realistic Collaboration Projects in Universitas SATU
        // ============================================================
        
        // Project 1: AI Plant Identifier
        $project1 = Project::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'title' => 'Sistem Pengenalan Citra Tanaman Herbal Berbasis AI',
            ],
            [
                'owner_id' => $studentUsers['siti_rahma']->id,
                'description' => 'Pengembangan sistem computer vision terintegrasi mobile untuk klasifikasi spesies tanaman obat tropis dan khasiat medisnya.',
                'status' => ProjectStatus::Open,
                'visibility' => ProjectVisibility::Institution,
                'capacity' => 4,
                'deadline' => now()->addMonths(2),
            ]
        );

        $role1_1 = ProjectRole::firstOrCreate(
            ['project_id' => $project1->id, 'title' => 'AI Engineer'],
            [
                'description' => 'Melatih model klasifikasi gambar deep learning dan membangun API inferensi.',
                'capacity' => 1,
            ]
        );

        $role1_2 = ProjectRole::firstOrCreate(
            ['project_id' => $project1->id, 'title' => 'Frontend Developer'],
            [
                'description' => 'Membangun antarmuka interaktif dashboard web dan modul kamera web realtime.',
                'capacity' => 1,
            ]
        );

        $role1_3 = ProjectRole::firstOrCreate(
            ['project_id' => $project1->id, 'title' => 'UI/UX Designer'],
            [
                'description' => 'Merancang wireframe, user flow, dan prototype visual di Figma.',
                'capacity' => 1,
            ]
        );

        TeamMembership::firstOrCreate(
            ['project_id' => $project1->id, 'user_id' => $studentUsers['siti_rahma']->id],
            [
                'project_role_id' => $role1_1->id,
                'status' => TeamMembershipStatus::Active,
                'joined_at' => now()->subWeeks(3),
            ]
        );

        TeamMembership::firstOrCreate(
            ['project_id' => $project1->id, 'user_id' => $studentUsers['dewi_lestari']->id],
            [
                'project_role_id' => $role1_3->id,
                'status' => TeamMembershipStatus::Active,
                'joined_at' => now()->subWeeks(2),
            ]
        );

        $task1 = Task::firstOrCreate(
            ['project_id' => $project1->id, 'title' => 'Perancangan Pipeline Training Dataset Tanaman'],
            [
                'description' => 'Koleksi 5.000 citra sampel daun tanaman obat dan augmentasi data.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
                'created_by_id' => $studentUsers['siti_rahma']->id,
                'assigned_to_id' => $studentUsers['siti_rahma']->id,
            ]
        );

        Task::firstOrCreate(
            ['project_id' => $project1->id, 'title' => 'Implementasi Komponen UI Mobile-Responsive'],
            [
                'description' => 'Pengembangan komponen React dengan Tailwind CSS untuk upload gambar.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::Medium,
                'created_by_id' => $studentUsers['siti_rahma']->id,
            ]
        );

        // Verified Contribution for Project 1
        $contrib1 = Contribution::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'project_id' => $project1->id,
                'owner_id' => $studentUsers['siti_rahma']->id,
            ],
            [
                'status' => ContributionStatus::Approved,
            ]
        );

        ContributionVersion::firstOrCreate(
            ['contribution_id' => $contrib1->id, 'version_number' => 1],
            [
                'created_by_id' => $studentUsers['siti_rahma']->id,
                'task_id' => $task1->id,
                'claim' => 'Penyelesaian Pipeline Model Computer Vision Akurasi 96.4%',
                'summary' => 'Berhasil membangun arsitektur model Convolutional Neural Network dan mengoptimasi waktu inferensi di bawah 120ms.',
            ]
        );

        ContributionReview::firstOrCreate(
            ['contribution_id' => $contrib1->id, 'reviewer_id' => $campusVerifier->id],
            [
                'decision' => ContributionReviewDecision::Approved,
                'feedback' => 'Kontribusi sangat solid, hasil evaluasi model teruji dengan metodologi valid.',
                'reviewed_at' => now()->subDays(5),
            ]
        );

        PortfolioEntry::firstOrCreate(
            [
                'user_id' => $studentUsers['siti_rahma']->id,
                'contribution_id' => $contrib1->id,
            ],
            [
                'institution_id' => $institution->id,
                'title' => 'Arsitektur Pipeline Computer Vision Tanaman Obat',
                'description' => 'Penyelesaian pipeline model machine learning dengan akurasi 96.4% yang divalidasi resmi oleh kampus.',
                'verification_level' => PortfolioVerificationLevel::InstitutionVerified,
                'verified_at' => now()->subDays(5),
            ]
        );

        // Project 2: Green Campus Logistics
        $project2 = Project::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'title' => 'Platform Agregator Logistik Kampus Ramah Lingkungan',
            ],
            [
                'owner_id' => $studentUsers['ahmad_fauzi']->id,
                'description' => 'Sistem optimasi distribusi pengantaran paket internal universitas menggunakan armada listrik kampus untuk mereduksi emisi karbon.',
                'status' => ProjectStatus::Open,
                'visibility' => ProjectVisibility::Institution,
                'capacity' => 3,
                'deadline' => now()->addWeeks(6),
            ]
        );

        $role2_1 = ProjectRole::firstOrCreate(
            ['project_id' => $project2->id, 'title' => 'Fullstack Developer'],
            [
                'description' => 'Membangun arsitektur backend Laravel RESTful API dan state management frontend.',
                'capacity' => 1,
            ]
        );

        $role2_2 = ProjectRole::firstOrCreate(
            ['project_id' => $project2->id, 'title' => 'UI/UX Designer'],
            [
                'description' => 'Merancang antarmuka dispatch order dan dashboard kurir kampus.',
                'capacity' => 1,
            ]
        );

        TeamMembership::firstOrCreate(
            ['project_id' => $project2->id, 'user_id' => $studentUsers['ahmad_fauzi']->id],
            [
                'project_role_id' => $role2_1->id,
                'status' => TeamMembershipStatus::Active,
                'joined_at' => now()->subWeeks(1),
            ]
        );

        $task2 = Task::firstOrCreate(
            ['project_id' => $project2->id, 'title' => 'Perancangan Skema Database Rute Logistik'],
            [
                'description' => 'Desain database relasional untuk tracking lokasi dan status pengantaran.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
                'created_by_id' => $studentUsers['ahmad_fauzi']->id,
                'assigned_to_id' => $studentUsers['ahmad_fauzi']->id,
            ]
        );

        // Pending Contribution for Project 2 (Waiting for review by Campus Operator)
        $contrib2 = Contribution::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'project_id' => $project2->id,
                'owner_id' => $studentUsers['ahmad_fauzi']->id,
            ],
            [
                'status' => ContributionStatus::PendingReview,
            ]
        );

        ContributionVersion::firstOrCreate(
            ['contribution_id' => $contrib2->id, 'version_number' => 1],
            [
                'created_by_id' => $studentUsers['ahmad_fauzi']->id,
                'task_id' => $task2->id,
                'claim' => 'Penyusunan Modul Routing Engine Logistik dan REST API',
                'summary' => 'Menyelesaikan modul kalkulasi jarak rute terpendek antar gedung kampus dan dokumentasi endpoint API.',
            ]
        );

        // Project 3: Carbon Footprint Dashboard
        $project3 = Project::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'title' => 'Dashboard Analisis Jejak Karbon Kampus Hijau',
            ],
            [
                'owner_id' => $studentUsers['dewi_lestari']->id,
                'description' => 'Dashboard monitoring konsumsi energi listrik gedung universitas dan visualisasi emisi CO2 secara realtime.',
                'status' => ProjectStatus::Open,
                'visibility' => ProjectVisibility::Institution,
                'capacity' => 3,
                'deadline' => now()->addMonths(3),
            ]
        );

        ProjectRole::firstOrCreate(
            ['project_id' => $project3->id, 'title' => 'Data Analyst'],
            [
                'description' => 'Menganalisis time-series sensor konsumsi daya per fakultas.',
                'capacity' => 1,
            ]
        );

        ProjectRole::firstOrCreate(
            ['project_id' => $project3->id, 'title' => 'Frontend Engineer'],
            [
                'description' => 'Membangun visualisasi grafik analitik interaktif berbasis chart libraries.',
                'capacity' => 1,
            ]
        );

        // ============================================================
        // 7. Recruiter: Perekrut Talent (username: perekrut)
        // ============================================================
        $recruiter = User::firstOrCreate(
            ['username' => 'perekrut'],
            [
                'name' => 'Perekrut Talent',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );

        if (! PhoneNumber::where('user_id', $recruiter->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281244444444')->create(['user_id' => $recruiter->id]);
        }

        $recruiterOrg = RecruiterOrganization::firstOrCreate(
            ['name' => 'PT Talent Nusantara Inovasi'],
            [
                'industry' => 'Teknologi Informasi & Digital',
                'website' => 'https://talentnusantara.example.com',
                'status' => RecruiterOrganizationStatus::Verified,
            ]
        );

        RecruiterMembership::firstOrCreate(
            [
                'recruiter_organization_id' => $recruiterOrg->id,
                'user_id' => $recruiter->id,
            ],
            [
                'role' => RecruiterMembershipRole::Owner,
                'status' => RecruiterMembershipStatus::Active,
            ]
        );

        RecruiterEntitlement::firstOrCreate(
            [
                'recruiter_organization_id' => $recruiterOrg->id,
                'scope' => RecruiterEntitlementScope::CandidateSearch,
            ],
            [
                'status' => RecruiterEntitlementStatus::Active,
                'starts_at' => now()->subHour(),
                'ends_at' => now()->addYear(),
                'issuer_id' => $admin->id,
                'reason' => 'Default entitlement for demo recruiter organization',
            ]
        );

        $sitiCandidate = TalentCandidateProjection::where('user_id', $studentUsers['siti_rahma']->id)->first();
        if ($sitiCandidate && ! RecruiterContactRequest::where('recruiter_user_id', $recruiter->id)->exists()) {
            RecruiterContactRequest::create([
                'recruiter_organization_id' => $recruiterOrg->id,
                'recruiter_user_id' => $recruiter->id,
                'talent_candidate_projection_id' => $sitiCandidate->id,
                'candidate_user_id' => $studentUsers['siti_rahma']->id,
                'purpose' => 'Eksplorasi Peran Cloud Backend Engineer',
                'message' => 'Halo Siti, kami sangat tertarik dengan portofolio arsitektur pipeline terverifikasi Anda di SATU.',
                'status' => ContactRequestStatus::Accepted,
                'created_at' => now()->subDays(4),
                'expires_at' => now()->addDays(3),
                'responded_at' => now()->subDays(2),
            ]);
        }
    }
}
