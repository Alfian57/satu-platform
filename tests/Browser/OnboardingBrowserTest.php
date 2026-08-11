<?php

use App\Enums\InstitutionStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;

test('student can submit an affiliation request from the onboarding ledger', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'empty')
        ->select('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-001')
        ->press('Kirim permintaan')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertSee('Permintaan afiliasi berhasil dikirim dan menunggu tinjauan.')
        ->assertPresent('@membership-outcome-announcement')
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'pending')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('verified student can save a minimum profile from the onboarding ledger', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->wait(0.2)
        ->assertSee('Lengkapi profilmu dengan ritmemu sendiri')
        ->click('#skill-taxonomy-search')
        ->assertSee('Ketik nama untuk mencari.')
        ->fill('#profile-bio', 'Saya sedang mengembangkan produk kolaborasi kampus.')
        ->fill('#study-program', 'Informatika')
        ->select('#study-year', '3')
        ->press('Simpan profil inti')
        ->wait(0.3)
        ->assertSee('Perubahan bagian ini sudah tersimpan.')
        ->assertSee('Profil tersimpan')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect(StudentProfile::query()->whereBelongsTo($user, 'user')->whereBelongsTo($institution, 'institution')->exists())
        ->toBeTrue();
});

test('student can resume a profile, update its basics, and save visibility choices', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    $profile = StudentProfile::factory()->for($user)->for($institution)->create([
        'bio' => 'Bio sebelum dilanjutkan.',
        'study_program' => 'Informatika',
        'study_year' => 2,
    ]);
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->wait(0.3)
        ->assertValue('#profile-bio', 'Bio sebelum dilanjutkan.')
        ->assertValue('#study-program', 'Informatika')
        ->assertSelected('#study-year', '2')
        ->fill('#profile-bio', 'Bio yang diperbarui dari sesi onboarding.')
        ->press('Simpan profil inti')
        ->wait(0.3)
        ->assertSee('Perubahan bagian ini sudah tersimpan.')
        ->radio('portfolio_visibility', 'recruiter')
        ->check('#recruiter-discoverable')
        ->press('Simpan visibilitas')
        ->wait(0.3)
        ->assertSee('Perubahan bagian ini sudah tersimpan.')
        ->assertRadioSelected('portfolio_visibility', 'recruiter')
        ->assertChecked('#recruiter-discoverable')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($profile->refresh()->bio)->toBe(
        'Bio yang diperbarui dari sesi onboarding.',
    )
        ->and($profile->portfolio_visibility->value)->toBe('recruiter')
        ->and($profile->recruiter_discoverable)->toBeTrue();
});

test('stale profile drafts stay visible and recover by loading the latest data', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    $profile = StudentProfile::factory()->for($user)->for($institution)->create([
        'bio' => 'Bio versi pertama.',
        'study_program' => 'Informatika',
        'study_year' => 2,
    ]);
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->wait(0.3)
        ->fill('#profile-bio', 'Draft lokal yang belum disimpan.');

    Carbon::setTestNow($profile->updated_at->copy()->addSecond());
    $profile->forceFill(['bio' => 'Bio terbaru dari sesi lain.'])->save();
    Carbon::setTestNow();

    $page->press('Simpan profil inti')
        ->assertSee('Data profil berubah')
        ->assertValue('#profile-bio', 'Draft lokal yang belum disimpan.')
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="profile-action-recovery-focus"]\')',
            true,
        )
        ->press('Muat data terbaru')
        ->wait(0.4)
        ->assertValue('#profile-bio', 'Bio terbaru dari sesi lain.')
        ->assertDontSee('Data profil berubah')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('profile network failure preserves the draft and offers a focused retry', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    $profile = StudentProfile::factory()->for($user)->for($institution)->create([
        'bio' => 'Bio awal.',
        'study_program' => 'Informatika',
        'study_year' => 2,
    ]);
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->wait(0.3)
        ->fill('#profile-bio', 'Draft saat koneksi terputus.');

    $page->script(<<<'JS'
        () => {
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.send = function () {
                XMLHttpRequest.prototype.send = originalSend;
                window.queueMicrotask(() => {
                    this.dispatchEvent(new ProgressEvent('error'));
                });
            };
        }
        JS);

    $page->press('Simpan profil inti')
        ->assertSee('Perubahan belum tersimpan')
        ->assertValue('#profile-bio', 'Draft saat koneksi terputus.')
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="profile-action-recovery-focus"]\')',
            true,
        )
        ->press('Coba simpan lagi')
        ->wait(0.3)
        ->assertSee('Perubahan bagian ini sudah tersimpan.')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    expect($profile->refresh()->bio)->toBe('Draft saat koneksi terputus.');
});

test('profile validation errors return focus to an accessible error summary', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    StudentProfile::factory()->for($user)->for($institution)->create([
        'bio' => 'Bio awal.',
        'study_program' => 'Informatika',
        'study_year' => 2,
    ]);
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->wait(0.3)
        ->fill('#study-program', str_repeat('Program studi ', 22))
        ->press('Simpan profil inti')
        ->assertPresent('@profile-error-summary')
        ->wait(0.1)
        ->assertScript(
            "document.activeElement?.matches('[data-test=\"profile-error-summary\"]')",
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('profile onboarding remains readable at supported viewports', function (
    int $width,
    int $height,
    ?string $filename,
) {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->resize($width, $height)
        ->assertPresent('@student-profile')
        ->assertSee('Visibilitas dan persetujuan')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    if ($filename !== null) {
        $page->screenshot(true, $filename);
    }
})->with([
    'mobile' => [320, 800, 'i20-profile-mobile-320x800'],
    'tablet' => [768, 1024, null],
    'small laptop' => [1366, 768, null],
    'desktop' => [1536, 960, 'i20-profile-desktop-1536x960'],
]);

test('pending affiliation is read only and explains the verification boundary', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertSee(
            'rekam kontribusi belum dapat diverifikasi institusi sampai afiliasi disetujui',
        )
        ->assertMissing('#institution_id')
        ->assertMissing('@onboarding-submit')
        ->assertSee('Lanjutkan ke dashboard')
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'pending')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('a rejected affiliation can be corrected and retried', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Ajukan kembali afiliasimu')
        ->assertSelected('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-002')
        ->press('Ajukan kembali')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'pending')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    expect($membership->refresh()->status->value)->toBe('pending');
});

test('rapid submission is blocked in the client and idempotent on the server', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->assertScript(
            'getComputedStyle(document.querySelector(\'#institution_id\')).cursor',
            'pointer',
        )
        ->assertScript(
            'getComputedStyle(document.querySelector(\'[data-test="onboarding-submit"]\')).cursor',
            'not-allowed',
        )
        ->select('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-003')
        ->assertScript(
            'getComputedStyle(document.querySelector(\'[data-test="onboarding-submit"]\')).cursor',
            'pointer',
        );

    $page->script(<<<'JS'
        () => {
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.send = function (body) {
                XMLHttpRequest.prototype.send = originalSend;
                window.setTimeout(() => originalSend.call(this, body), 400);
            };
        }
        JS);

    $page->script(<<<'JS'
        () => {
            const submit = document.querySelector('[data-test="onboarding-submit"]');
            submit.click();
            submit.click();
        }
        JS);

    $page->assertDisabled('#institution_id')
        ->assertDisabled('@onboarding-submit')
        ->assertSee('Mengirim permintaan')
        ->assertScript(
            'getComputedStyle(document.querySelector(\'[data-test="onboarding-submit"]\')).cursor',
            'not-allowed',
        )
        ->wait(0.6)
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    expect(InstitutionMembership::query()->whereBelongsTo($user)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'institution_membership.requested')->count())
        ->toBe(1);
});

test('a network failure preserves the selection and offers a focused retry', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->select('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-004');

    $page->script(<<<'JS'
        () => {
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.send = function () {
                XMLHttpRequest.prototype.send = originalSend;
                window.queueMicrotask(() => {
                    this.dispatchEvent(new ProgressEvent('error'));
                });
            };
        }
        JS);

    $page->press('Kirim permintaan')
        ->assertSee('Permintaan belum terkirim')
        ->assertSee('Pilihan kampusmu tetap tersimpan')
        ->assertSelected('institution_id', (string) $institution->id)
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="onboarding-recovery-focus"]\')',
            true,
        )
        ->press('Coba kirim lagi')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    expect(InstitutionMembership::query()->whereBelongsTo($user)->count())->toBe(1);
});

test('an expired session explains safe recovery without losing a retry selection', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    $this->withSession(['onboarding_recovery' => 'session_expired']);
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Sesi halaman sudah berakhir')
        ->assertSee('Permintaan belum diproses')
        ->assertSelected('institution_id', (string) $institution->id)
        ->assertSeeLink('Masuk kembali')
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="onboarding-recovery-focus"]\')',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('permission loss during retry is safe and keeps the local choice', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->assertSelected('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-005');

    $page->script(<<<'JS'
        () => {
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.send = function () {
                XMLHttpRequest.prototype.send = originalSend;
                Object.defineProperty(this, 'status', { value: 403 });
                Object.defineProperty(this, 'responseText', {
                    value: 'Forbidden',
                });
                Object.defineProperty(this, 'getAllResponseHeaders', {
                    value: () => 'content-type: text/html\r\n',
                });
                window.queueMicrotask(() => {
                    this.dispatchEvent(new Event('load'));
                });
            };
        }
        JS);

    $page->press('Ajukan kembali')
        ->assertSee('Izin afiliasi berubah')
        ->assertSee('Permintaan tidak diproses')
        ->assertSelected('institution_id', (string) $institution->id)
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="onboarding-recovery-focus"]\')',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    expect($membership->refresh()->status->value)->toBe('unverified')
        ->and(AuditLog::query()->count())->toBe(0);
});

test('suspended affiliation hides the request action and provides a safe destination', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->suspended()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Afiliasimu sedang ditangguhkan')
        ->assertSee('Hubungi pengelola kampus untuk tindak lanjut')
        ->assertMissing('#institution_id')
        ->assertMissing('@onboarding-submit')
        ->assertSeeLink('Lanjutkan ke dashboard')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('validation failure returns focus to the same error summary every time', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    Institution::factory()->active()->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->select('institution_id', (string) $institution->id)
        ->fill('nim', 'SATU-BROWSER-006');

    $institution->update(['status' => InstitutionStatus::Suspended]);

    $page->press('Kirim permintaan')
        ->assertSee('Permintaan belum dapat dikirim')
        ->assertSee('Kampus yang dipilih sedang tidak tersedia')
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="onboarding-error-summary"]\')',
            true,
        )
        ->press('Kirim permintaan')
        ->wait(0.1)
        ->assertScript(
            'document.activeElement?.matches(\'[data-test="onboarding-error-summary"]\')',
            true,
        );
});

test('student can complete the affiliation request with a keyboard', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    PhoneNumber::factory()->for($user)->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->keys('#institution_id', 'ArrowDown')
        ->assertSelected('institution_id', (string) $institution->id)
        ->keys('#institution_id', 'Tab')
        ->assertScript('document.activeElement?.matches(\'#nim\')', true)
        ->typeSlowly('#nim', 'SATU-BROWSER-007', 10)
        ->keys('#nim', 'Tab')
        ->assertScript(
            'document.activeElement?.textContent?.includes(\'Lanjutkan nanti\')',
            true,
        )
        ->keys('Lanjutkan nanti', 'Tab')
        ->assertScript(
            'document.activeElement?.textContent?.includes(\'Kirim permintaan\')',
            true,
        )
        ->keys('button[type="submit"]', 'Enter')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

test('onboarding supports dark mode without accessibility or overflow defects', function () {
    $user = User::factory()->create();
    Institution::factory()->active()->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->inDarkMode()
        ->resize(1366, 768)
        ->assertSee('Hubungkan akunmu dengan kampus')
        ->assertScript(
            'document.documentElement.classList.contains(\'dark\')',
            true,
        )
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('onboarding remains readable at the supported phase viewports', function (int $width, int $height) {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->resize($width, $height)
        ->assertSee('Ajukan kembali afiliasimu')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
})->with([
    'compact mobile' => [320, 800],
    'small laptop' => [1366, 768],
]);

test('long multilingual institution names remain readable at mobile width and 200 percent zoom', function (
    int $width,
    int $height,
    int $zoom,
) {
    $user = User::factory()->create();
    $longName = str_repeat('UniversitasTanpaPemisah', 6).'ÃƒÂ¦Ã‚ÂÃ‚Â±ÃƒÂ¤Ã‚ÂºÃ‚Â¬ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±ÃƒËœÃ‚Â­ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§';
    $institution = Institution::factory()->active()->create([
        'name' => $longName,
    ]);
    InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))->resize($width, $height);

    if ($zoom === 2) {
        $page->script('() => { document.body.style.zoom = "2"; }');
    }

    $page->assertSee($longName)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
})->with([
    'mobile 320' => [320, 800, 1],
    'effective 320 at 200 percent zoom' => [640, 900, 2],
]);

test('empty institution state offers a safe next action', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Belum ada kampus yang dapat dipilih')
        ->assertSeeLink('Lanjutkan ke dashboard')
        ->assertDisabled('#institution_id')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
