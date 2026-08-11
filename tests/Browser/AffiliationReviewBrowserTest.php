<?php

use App\Actions\Affiliations\AcquireAffiliationReviewLock;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\User;

function browserAffiliationReviewer(Institution $institution): User
{
    $reviewer = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();

    return $reviewer;
}

function browserPendingAffiliation(Institution $institution): AffiliationRequest
{
    $student = User::factory()->create();
    PhoneNumber::factory()->for($student)->create();
    $membership = InstitutionMembership::factory()
        ->pending()
        ->for($student)
        ->for($institution)
        ->create();

    return AffiliationRequest::factory()
        ->for($institution)
        ->for($student, 'user')
        ->create([
            'institution_membership_id' => $membership->getKey(),
        ]);
}

test('campus reviewer can lock and approve an affiliation from the docket', function () {
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    $reviewer = browserAffiliationReviewer($institution);
    $request = browserPendingAffiliation($institution);
    $this->actingAs($reviewer);

    visit(route('campus.affiliations.index', $institution))
        ->assertSee('Review afiliasi Universitas SATU')
        ->assertSee('@'.$request->user->username)
        ->press('Tinjau')
        ->assertSee('Berkas AF-'.$request->getKey())
        ->assertSee('Setujui afiliasi')
        ->press('@affiliation-decision-submit')
        ->assertSee('Keputusan tersimpan')
        ->assertSee('Tidak ada berkas pada filter ini')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($request->membership->refresh()->status->value)->toBe('verified');
});

test('campus review distinguishes empty and concurrent lock states', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = browserAffiliationReviewer($institution);
    $otherReviewer = browserAffiliationReviewer($institution);
    $request = browserPendingAffiliation($institution);
    app(AcquireAffiliationReviewLock::class)->handle($request, $otherReviewer);
    $this->actingAs($reviewer);

    visit(route('campus.affiliations.index', $institution))
        ->assertSee('Sedang ditinjau @'.$otherReviewer->username)
        ->assertSee('Sedang ditinjau')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    $request->delete();

    visit(route('campus.affiliations.index', $institution))
        ->assertSee('Tidak ada berkas pada filter ini')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('campus review produces responsive evidence without overflow', function (
    int $width,
    int $height,
    string $filename,
) {
    $institution = Institution::factory()->active()->create([
        'name' => 'Institut Teknologi SATU Nusantara',
    ]);
    $reviewer = browserAffiliationReviewer($institution);
    browserPendingAffiliation($institution);
    browserPendingAffiliation($institution);
    $this->actingAs($reviewer);

    visit(route('campus.affiliations.index', $institution))
        ->resize($width, $height)
        ->assertPresent('@affiliation-review-root')
        ->assertSee('Antrean pemeriksaan')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, $filename);
})->with([
    'mobile' => [320, 800, 'i06-affiliation-mobile-320x800'],
    'tablet' => [768, 1024, 'i06-affiliation-tablet-768x1024'],
    'small laptop' => [1366, 768, 'i06-affiliation-laptop-1366x768'],
    'desktop' => [1536, 960, 'i06-affiliation-desktop-1536x960'],
]);

test('deferred queue exposes a stable ten row skeleton before content', function () {
    $institution = Institution::factory()->active()->create();
    $reviewer = browserAffiliationReviewer($institution);
    browserPendingAffiliation($institution);
    $this->actingAs($reviewer);

    $page = visit(route('campus.affiliations.index', $institution))
        ->resize(1366, 768)
        ->assertPresent('@affiliation-queue-skeleton')
        ->screenshot(false, 'i06-affiliation-deferred-skeleton-1366x768');

    $page->waitForText('Antrean pemeriksaan')
        ->assertMissing('@affiliation-queue-skeleton')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});
