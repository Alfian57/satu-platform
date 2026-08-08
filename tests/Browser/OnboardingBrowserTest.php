<?php

use App\Enums\InstitutionStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;

test('student can submit an affiliation request from the onboarding ledger', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'empty')
        ->select('institution_id', (string) $institution->id)
        ->press('Kirim permintaan')
        ->assertSee('Permintaanmu sedang ditinjau')
        ->assertSee('Permintaan afiliasi berhasil dikirim dan menunggu tinjauan.')
        ->assertPresent('@membership-outcome-announcement')
        ->assertDataAttribute('@onboarding-root', 'membership-state', 'pending')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

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
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->assertSee('Ajukan kembali afiliasimu')
        ->assertSelected('institution_id', (string) $institution->id)
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
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->select('institution_id', (string) $institution->id);

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
    $this->actingAs($user);

    $page = visit(route('onboarding.show'))
        ->assertSelected('institution_id', (string) $institution->id);

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
        ->select('institution_id', (string) $institution->id);

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
    $this->actingAs($user);

    visit(route('onboarding.show'))
        ->keys('#institution_id', 'ArrowDown')
        ->assertSelected('institution_id', (string) $institution->id)
        ->keys('#institution_id', 'Tab')
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
    $longName = str_repeat('UniversitasTanpaPemisah', 6).'æ±äº¬ðŸš€Ù…Ø±Ø­Ø¨Ø§';
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


