<?php

use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;

test('registration surface remains usable at mobile and desktop widths', function (int $width, int $height) {
    visit(route('register'))
        ->resize($width, $height)
        ->assertSee('Nama pengguna hanya untuk masuk ke SATU')
        ->assertSee('Nomor WhatsApp')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, "i04-auth-register-{$width}x{$height}");
})->with([
    'mobile 320' => [320, 800],
    'desktop 1366' => [1366, 900],
]);

test('registration OTP step supports one-time-code input and focus', function () {
    $gateway = new FakeWhatsAppGateway;
    app()->instance(WhatsAppGateway::class, $gateway);

    $page = visit(route('register'))
        ->fill('#name', 'Browser Student')
        ->fill('#username', 'browser_student')
        ->fill('#phone', '+6281234567896')
        ->fill('#password', 'password')
        ->fill('#password_confirmation', 'password')
        ->press('Kirim kode verifikasi')
        ->wait(0.3)
        ->assertSee('Receipt verifikasi')
        ->assertSee('Anda dapat menempelkan seluruh kode sekaligus.')
        ->assertScript(
            "document.querySelector('#registration-otp')?.getAttribute('autocomplete')",
            'one-time-code',
        )
        ->assertScript(
            "document.querySelector('#registration-otp')?.inputMode",
            'numeric',
        )
        ->assertScript('document.activeElement?.id', 'registration-otp')
        ->screenshot(true, 'i04-auth-register-otp-1366x900');

    $page->fill('#registration-otp', latestWhatsappOtp($gateway))
        ->press('Verifikasi nomor WhatsApp')
        ->wait(0.3)
        ->assertSee('Belum ada kampus yang dapat dipilih')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('recovery moves focus from phone entry to the OTP step', function () {
    visit(route('recover'))
        ->assertScript('document.activeElement?.id', 'phone')
        ->fill('#phone', '+6281234567897')
        ->press('Kirim kode recovery')
        ->wait(0.3)
        ->assertSee('Receipt recovery')
        ->assertScript('document.activeElement?.id', 'recovery-otp')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
