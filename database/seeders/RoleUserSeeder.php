<?php

namespace Database\Seeders;

use App\Enums\ContactRequestStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionStatus;
use App\Enums\PortfolioVisibility;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleUserSeeder extends Seeder
{
    /**
     * Seed 1 account for each role in SATU Platform.
     * All accounts use password: 'password'
     */
    public function run(): void
    {
        $password = Hash::make('password');

        // 1. Institution (Kampus Demo)
        $institution = Institution::firstOrCreate(
            ['slug' => 'universitas-satu'],
            [
                'name' => 'Universitas SATU',
                'status' => InstitutionStatus::Active,
                'verified_at' => now(),
            ]
        );

        // 2. Platform Admin
        $admin = User::firstOrCreate(
            ['username' => 'admin_satu'],
            [
                'name' => 'Admin Platform SATU',
                'password' => $password,
                'is_platform_admin' => true,
            ]
        );

        if (! PhoneNumber::where('user_id', $admin->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281211111111')->create(['user_id' => $admin->id]);
        }

        // 3. Campus Operator / Campus Admin
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
                'verified_by' => $admin->id,
            ]
        );

        // 4. Mahasiswa
        $student = User::firstOrCreate(
            ['username' => 'mahasiswa'],
            [
                'name' => 'Budi Mahasiswa',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );

        if (! PhoneNumber::where('user_id', $student->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281233333333')->create(['user_id' => $student->id]);
        }

        InstitutionMembership::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'user_id' => $student->id,
            ],
            [
                'role' => InstitutionMembershipRole::Student,
                'status' => InstitutionMembershipStatus::Verified,
                'verification_method' => InstitutionMembershipVerificationMethod::RosterExactMatch,
                'verified_at' => now(),
                'verified_by' => $campusVerifier->id,
            ]
        );

        StudentProfile::firstOrCreate(
            [
                'user_id' => $student->id,
                'institution_id' => $institution->id,
            ],
            [
                'nim' => '2024001',
                'study_program' => 'Teknik Informatika',
                'academic_year' => 2024,
                'bio' => 'Mahasiswa aktif Teknik Informatika yang passionate di bidang Web Development dan Cloud Computing.',
                'portfolio_visibility' => PortfolioVisibility::Recruiter,
                'recruiter_discoverable' => true,
            ]
        );

        // ============================================================
        // 5. Recruiter (Perekrut)
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
            ['name' => 'PT Talent Indonesia'],
            [
                'industry' => 'Teknologi Informasi',
                'website' => 'https://talentindonesia.example.com',
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
                'reason' => 'Default demo entitlement for recruiter role',
            ]
        );

        // Seed demo talent candidate projections for search demonstration
        $candidate1 = TalentCandidateProjection::firstOrCreate(
            ['user_id' => $student->id, 'institution_id' => $institution->id],
            [
                'headline' => 'Full-Stack Developer & UI/UX Specialist',
                'bio' => 'Mahasiswa semester akhir Teknik Informatika dengan rekam jejak pembuatan sistem web enterprise, arsitektur REST API teruji, dan desain interface yang aksesibel.',
                'skills' => ['React', 'TypeScript', 'Laravel', 'TailwindCSS', 'REST API', 'Figma'],
                'badges' => ['Top Contributor 2026', 'Best Capstone Project'],
                'contributions' => [
                    [
                        'id' => 1,
                        'title' => 'Sistem Monitoring Energi Cerdas',
                        'role' => 'Lead Frontend Engineer',
                        'status' => 'verified',
                        'published_at' => now()->subDays(10)->toIso8601String(),
                    ],
                    [
                        'id' => 2,
                        'title' => 'SATU Collaboration Hub',
                        'role' => 'Full-Stack Developer',
                        'status' => 'verified',
                        'published_at' => now()->subDays(5)->toIso8601String(),
                    ],
                ],
                'availability_status' => 'available',
                'is_visible' => true,
                'verified_at' => now()->subDays(5),
            ]
        );

        // Additional demo student candidate
        $student2 = User::firstOrCreate(
            ['username' => 'siti_rahma'],
            [
                'name' => 'Siti Rahma',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );
        if (! PhoneNumber::where('user_id', $student2->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281255555555')->create(['user_id' => $student2->id]);
        }
        $candidate2 = TalentCandidateProjection::firstOrCreate(
            ['user_id' => $student2->id, 'institution_id' => $institution->id],
            [
                'headline' => 'Backend Engineer & Cloud Architecture',
                'bio' => 'Spesialis perancangan microservices, optimalisasi database relasional skala besar, dan pipeline CI/CD otomatis.',
                'skills' => ['PHP', 'Laravel', 'PostgreSQL', 'Docker', 'Redis', 'AWS'],
                'badges' => ['Verified Contributor', 'Hackathon Finalist'],
                'contributions' => [
                    [
                        'id' => 3,
                        'title' => 'High-Throughput Notification Gateway',
                        'role' => 'Backend Architect',
                        'status' => 'verified',
                        'published_at' => now()->subDays(15)->toIso8601String(),
                    ],
                ],
                'availability_status' => 'open_to_offers',
                'is_visible' => true,
                'verified_at' => now()->subDays(12),
            ]
        );

        // Seed demo contact requests
        if (! RecruiterContactRequest::where('recruiter_user_id', $recruiter->id)->exists()) {
            RecruiterContactRequest::create([
                'recruiter_organization_id' => $recruiterOrg->id,
                'recruiter_user_id' => $recruiter->id,
                'talent_candidate_projection_id' => $candidate1->id,
                'candidate_user_id' => $student->id,
                'purpose' => 'Tawaran Proyek Frontend Web Enterprise',
                'message' => 'Halo Budi, tim kami sangat terkesan dengan portofolio SATU Collaboration Hub Anda dan ingin mengundang Anda dalam proyek modern frontend.',
                'status' => ContactRequestStatus::Pending,
                'created_at' => now()->subDays(2),
                'expires_at' => now()->addDays(5),
            ]);

            RecruiterContactRequest::create([
                'recruiter_organization_id' => $recruiterOrg->id,
                'recruiter_user_id' => $recruiter->id,
                'talent_candidate_projection_id' => $candidate2->id,
                'candidate_user_id' => $student2->id,
                'purpose' => 'Eksplorasi Peran Cloud Backend Engineer',
                'message' => 'Halo Siti, kami ingin berdiskusi mengenai arsitektur sistem skala besar untuk kebutuhan platform kami.',
                'status' => ContactRequestStatus::Accepted,
                'created_at' => now()->subDays(6),
                'expires_at' => now()->addDays(1),
                'responded_at' => now()->subDays(4),
            ]);
        }
    }
}
