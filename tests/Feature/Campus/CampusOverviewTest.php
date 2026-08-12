<?php

use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function campusAdminUser(Institution $institution): User
{
    $admin = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($admin)
        ->for($institution)
        ->create();

    return $admin;
}

test('authorized campus admin can view institution scoped overview metrics', function () {
    $institution = Institution::factory()->active()->create(['name' => 'Universitas Gajah SATU']);
    $admin = campusAdminUser($institution);

    // Create memberships
    $student = User::factory()->create();
    StudentProfile::factory()->for($student)->create(['study_program' => 'Teknik Informatika']);
    InstitutionMembership::factory()->verifiedByApprovedDomain()->for($student)->for($institution)->create();

    // Create project
    Project::factory()->for($institution)->open()->create();

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.overview.show', $institution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/overview')
            ->where('institution.name', 'Universitas Gajah SATU')
            ->where('metrics.memberships.total', 2) // admin + student
            ->where('metrics.memberships.verified', 2)
            ->where('metrics.projects.total', 1)
            ->where('metrics.projects.active', 1)
            ->has('programDistribution')
            ->has('members.items')
        );
});

test('campus overview metrics enforce strict institution isolation', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $adminA = campusAdminUser($institutionA);

    // Add projects to Institution B
    Project::factory()->count(3)->for($institutionB)->open()->create();

    // Admin A accessing Institution B overview should be forbidden
    $this->actingAs($adminA)
        ->get(route('campus.overview.show', $institutionB))
        ->assertForbidden();

    // Admin A accessing Institution A overview shows 0 projects from B
    $this->withoutVite()
        ->actingAs($adminA)
        ->get(route('campus.overview.show', $institutionA))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.projects.total', 0)
        );
});

test('unverified students cannot access campus overview', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    InstitutionMembership::factory()->for($student)->for($institution)->create(['status' => 'unverified']);

    $this->actingAs($student)
        ->get(route('campus.overview.show', $institution))
        ->assertForbidden();
});

test('overview supports date and program filtering', function () {
    $institution = Institution::factory()->active()->create();
    $admin = campusAdminUser($institution);

    $studentIT = User::factory()->create();
    StudentProfile::factory()->for($studentIT)->create(['study_program' => 'Teknik Informatika']);
    InstitutionMembership::factory()->verifiedByApprovedDomain()->for($studentIT)->for($institution)->create();

    $studentSI = User::factory()->create();
    StudentProfile::factory()->for($studentSI)->create(['study_program' => 'Sistem Informasi']);
    InstitutionMembership::factory()->verifiedByApprovedDomain()->for($studentSI)->for($institution)->create();

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('campus.overview.show', [$institution, 'program' => 'Teknik Informatika']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.program', 'Teknik Informatika')
            ->where('members.pagination.total', 1)
            ->where('members.items.0.program', 'Teknik Informatika')
        );
});
