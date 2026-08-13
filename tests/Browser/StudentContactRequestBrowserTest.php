<?php

use App\Actions\Consent\ConsentRecorder;
use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Talent\RespondContactRequest;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\ConsentRecord;
use App\Models\Institution;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Support\Carbon;

test('student accept uses a confirmation that explains the shared contact data and records consent', function () {
    $context = contactRequestBrowserContext();
    $request = $context['contactRequest'];

    $this->actingAs($context['student']);

    $page = visit(route('student.contact-requests.index'))
        ->resize(390, 844)
        ->waitForText('Permintaan diterima')
        ->assertSee('Acme Talent')
        ->assertSee('Engineering Discussion')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 't08-student-contact-requests-mobile-390x844');

    $page
        ->click("@accept-request-{$request->getKey()}")
        ->waitForText('Konfirmasi pembagian kontak')
        ->assertSee('nomor WhatsApp terverifikasi')
        ->assertSee('membagikan nama dan nomor WhatsApp terverifikasi')
        ->screenshot(true, 't08-student-accept-confirm-mobile-390x844')
        ->click("@confirm-share-{$request->getKey()}")
        ->waitForText('Diterima')
        ->assertSee('Acme Talent')
        ->resize(1366, 900)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 't08-student-contact-accepted-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($request->refresh()->status)->toBe(ContactRequestStatus::Accepted);

    $consent = app(ConsentRecorder::class)->current(
        $context['student'],
        RespondContactRequest::CONSENT_PURPOSE,
    );

    expect($consent)->not->toBeNull()
        ->and($consent->isGrant())->toBeTrue();
});

test('student decline requires destructive confirmation and records no consent', function () {
    $context = contactRequestBrowserContext();
    $request = $context['contactRequest'];

    $this->actingAs($context['student']);

    visit(route('student.contact-requests.index'))
        ->resize(1366, 900)
        ->waitForText('Permintaan diterima')
        ->click("@decline-request-{$request->getKey()}")
        ->waitForText('Konfirmasi penolakan')
        ->assertSee('tidak membagikan kontak')
        ->screenshot(true, 't08-student-decline-confirm-desktop-1366x900')
        ->click("@confirm-decline-{$request->getKey()}")
        ->waitForText('Ditolak')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($request->refresh()->status)->toBe(ContactRequestStatus::Declined);

    $consent = ConsentRecord::query()
        ->forUser($context['student'])
        ->forPurpose(RespondContactRequest::CONSENT_PURPOSE)
        ->latestEvent()
        ->first();

    expect($consent)->toBeNull();
});

/**
 * @return array{institution: Institution, student: User, recruiter: User, organization: RecruiterOrganization, contactRequest: RecruiterContactRequest}
 */
function contactRequestBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Kontak',
    ]);
    $student = User::factory()->create(['name' => 'Student Browser Kontak']);
    $recruiter = User::factory()->create(['name' => 'Recruiter Browser Kontak']);
    $organization = RecruiterOrganization::factory()->create([
        'name' => 'Acme Talent',
        'status' => RecruiterOrganizationStatus::Verified,
    ]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $organization->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $organization,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $candidate = TalentCandidateProjection::factory()->create([
        'user_id' => $student->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $contactRequest = RecruiterContactRequest::factory()->create([
        'recruiter_organization_id' => $organization->id,
        'recruiter_user_id' => $recruiter->id,
        'talent_candidate_projection_id' => $candidate->id,
        'candidate_user_id' => $student->id,
        'purpose' => 'Engineering Discussion',
        'status' => ContactRequestStatus::Pending,
    ]);

    return compact(
        'institution',
        'student',
        'recruiter',
        'organization',
        'contactRequest',
    );
}
