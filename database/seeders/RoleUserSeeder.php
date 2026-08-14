<?php

namespace Database\Seeders;

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
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
                'timezone' => 'Asia/Jakarta',
                'locale' => 'id',
            ]
        );

        // ============================================================
        // ROLE 1: Platform Admin
        // ============================================================
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Platform Admin SATU',
                'password' => $password,
                'is_platform_admin' => true,
            ]
        );
        $admin->update(['is_platform_admin' => true]);

        if (! PhoneNumber::where('user_id', $admin->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281211111111')->create(['user_id' => $admin->id]);
        }

        // ============================================================
        // ROLE 2: Operator Kampus (Campus Admin)
        // ============================================================
        $operator = User::firstOrCreate(
            ['username' => 'operator_kampus'],
            [
                'name' => 'Operator Kampus SATU',
                'password' => $password,
                'is_platform_admin' => false,
            ]
        );

        if (! PhoneNumber::where('user_id', $operator->id)->exists()) {
            PhoneNumber::factory()->forNumber('+6281222222222')->create(['user_id' => $operator->id]);
        }

        InstitutionMembership::firstOrCreate(
            [
                'institution_id' => $institution->id,
                'user_id' => $operator->id,
                'role' => InstitutionMembershipRole::CampusAdmin,
            ],
            [
                'status' => InstitutionMembershipStatus::Verified,
                'verification_method' => InstitutionMembershipVerificationMethod::ApprovedDomain,
                'requested_at' => now(),
                'verified_at' => now(),
            ]
        );

        // ============================================================
        // ROLE 3: Mahasiswa (Student)
        // ============================================================
        $student = User::firstOrCreate(
            ['username' => 'mahasiswa'],
            [
                'name' => 'Mahasiswa SATU',
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
                'role' => InstitutionMembershipRole::Student,
            ],
            [
                'status' => InstitutionMembershipStatus::Verified,
                'verification_method' => InstitutionMembershipVerificationMethod::RosterExactMatch,
                'requested_at' => now(),
                'verified_at' => now(),
            ]
        );

        if (! StudentProfile::where('user_id', $student->id)->where('institution_id', $institution->id)->exists()) {
            StudentProfile::factory()->create([
                'institution_id' => $institution->id,
                'user_id' => $student->id,
                'bio' => 'Mahasiswa Informatika Universitas SATU.',
                'study_program' => 'Informatika',
                'study_year' => 3,
                'portfolio_visibility' => PortfolioVisibility::Recruiter,
                'recruiter_discoverable' => true,
                'public_identifier' => (string) Str::ulid(),
            ]);
        }

        // ============================================================
        // ROLE 4: Perekrut (Recruiter)
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
    }
}
