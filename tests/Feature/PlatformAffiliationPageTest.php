<?php

use App\Enums\AffiliationRequestStatus;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('platform admin receives the cross institution affiliation overview', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $activeInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    Institution::factory()->create(['name' => 'Kampus Menunggu']);

    AffiliationRequest::factory()
        ->count(2)
        ->for($activeInstitution)
        ->create();
    AffiliationRequest::factory()
        ->for($activeInstitution)
        ->create(['status' => AffiliationRequestStatus::Verified]);

    $this->actingAs($platformAdmin)
        ->get(route('platform.affiliations.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('platform/affiliations')
                ->where('filters', ['q' => '', 'status' => 'all'])
                ->where('summary.institutions', 2)
                ->where('summary.activeInstitutions', 1)
                ->where('summary.pendingAffiliations', 2)
                ->where('summary.institutionsWithQueue', 1)
                ->has('institutions', 2)
                ->where('institutions.0.name', 'Universitas SATU')
                ->where('institutions.0.pendingAffiliationsCount', 2)
                ->where('institutions.0.verifiedAffiliationsCount', 1)
                ->missing('institutions.0.nim')
                ->missing('institutions.0.phone')
                ->missing('institutions.0.users')
                ->missing('institutions.0.affiliationRequests'),
        );
});

test('regular users cannot open the platform affiliation overview', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('platform.affiliations.index'))
        ->assertForbidden();
});
