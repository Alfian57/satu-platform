<?php

use App\Enums\InstitutionMembershipRole;
use App\Enums\RecruiterMembershipRole;
use App\Models\InstitutionMembership;
use App\Models\RecruiterMembership;
use App\Models\User;
use Database\Seeders\RoleUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('seeds one user account for each platform role', function () {
    $this->seed(RoleUserSeeder::class);

    // 1. Platform Admin
    $admin = User::where('username', 'admin')->first();
    expect($admin)->not->toBeNull()
        ->and($admin->is_platform_admin)->toBeTrue();

    // 2. Operator Kampus (Campus Admin)
    $operator = User::where('username', 'operator_kampus')->first();
    expect($operator)->not->toBeNull()
        ->and($operator->is_platform_admin)->toBeFalse();

    $operatorMembership = InstitutionMembership::where('user_id', $operator->id)->first();
    expect($operatorMembership)->not->toBeNull()
        ->and($operatorMembership->role)->toBe(InstitutionMembershipRole::CampusAdmin);

    // 3. Mahasiswa (Student)
    $student = User::where('username', 'mahasiswa')->first();
    expect($student)->not->toBeNull();

    $studentMembership = InstitutionMembership::where('user_id', $student->id)->first();
    expect($studentMembership)->not->toBeNull()
        ->and($studentMembership->role)->toBe(InstitutionMembershipRole::Student);

    // 4. Perekrut (Recruiter)
    $recruiter = User::where('username', 'perekrut')->first();
    expect($recruiter)->not->toBeNull();

    $recruiterMembership = RecruiterMembership::where('user_id', $recruiter->id)->first();
    expect($recruiterMembership)->not->toBeNull()
        ->and($recruiterMembership->role)->toBe(RecruiterMembershipRole::Owner);
});
