<?php

use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;

test('critical flows remain usable across viewports', function (int $width, int $height) {
    $gateway = new FakeWhatsAppGateway;
    app()->instance(WhatsAppGateway::class, $gateway);

    $page = visit(route('register'))
        ->resize($width, $height)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->fill('#name', 'Browser Student')
        ->fill('#username', 'browser_student')
        ->fill('#phone', '+6281234567896')
        ->fill('#password', 'password')
        ->fill('#password_confirmation', 'password')
        ->press('Kirim kode verifikasi')
        ->wait(0.3)
        ->fill('#registration-otp', latestWhatsappOtp($gateway))
        ->press('Verifikasi nomor WhatsApp')
        ->wait(0.3);

    if ($width >= 768) {
        $page->press('Lanjut ke profil')
            ->wait(0.3)
            ->assertSee('Nama lengkap')
            ->fill('#name', 'Browser Student')
            ->fill('#email', 'browser.student@example.com')
            ->fill('#phone', '+6281234567896')
            ->press('Simpan dan lanjut')
            ->wait(0.3);
    }

    $page->assertSee('Nama pengguna hanya untuk masuk ke SATU')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, "i75-responsive-{$width}x{$height}");
})->with([
    'mobile 320' => [320, 800],
    'mobile 375' => [375, 812],
    'mobile 414' => [414, 896],
    'tablet 768' => [768, 1024],
    'small laptop 1366' => [1366, 900],
    'desktop 1920' => [1920, 1080],
]);

test('onboarding flow works at mobile and desktop', function () {
    visit(route('onboarding'))
        ->resize(375, 812)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'i75-onboarding-mobile-375x812');

    visit(route('onboarding'))
        ->resize(1366, 900)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'i75-onboarding-desktop-1366x900');
});

test('workspace flow works at mobile and desktop', function () {
    $workspace = visit(route('projects', ['project' => 1]))
        ->press('Buka workspace')
        ->wait(0.5);

    $workspace
        ->resize(375, 812)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'i75-workspace-mobile-375x812');

    $workspace
        ->resize(1366, 900)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'i75-workspace-desktop-1366x900');
});

test('dashboard remains responsive at various viewports', function (int $width, int $height) {
    visit(route('dashboard'))
        ->resize($width, $height)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, "i75-dashboard-{$width}x{$height}");
})->with([
    'mobile 320' => [320, 800],
    'tablet 768' => [768, 1024],
    'small laptop 1366' => [1366, 900],
    'desktop 1920' => [1920, 1080],
]);

test('project discovery works across viewports', function (int $width, int $height) {
    visit(route('projects.index'))
        ->resize($width, $height)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, "i75-project-discovery-{$width}x{$height}");
})->with([
    'mobile 375' => [375, 812],
    'tablet 768' => [768, 1024],
    'desktop 1920' => [1920, 1080],
]);

test('keyboard navigation works across critical flows', function () {
    $page = visit(route('register'))
        ->resize(1366, 900)
        ->assertScript('document.activeElement?.id', 'name')
        ->pressTab()
        ->assertScript('document.activeElement?.id', 'username')
        ->pressTab()
        ->assertScript('document.activeElement?.id', 'phone')
        ->pressTab()
        ->assertScript('document.activeElement?.id', 'password')
        ->pressTab()
        ->assertScript('document.activeElement?.id', 'password_confirmation')
        ->pressTab()
        ->assertScript('document.activeElement?.tagName', 'BUTTON')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();

    visit(route('recover'))
        ->resize(1366, 900)
        ->assertScript('document.activeElement?.id', 'phone')
        ->pressTab()
        ->assertScript('document.activeElement?.tagName', 'BUTTON')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

test('touch targets are adequately sized at mobile', function () {
    visit(route('register'))
        ->resize(375, 812)
        ->assertScript(
            'Array.from(document.querySelectorAll("button, a")).every(el => {
                const rect = el.getBoundingClientRect();
                return rect.width >= 44 && rect.height >= 44;
            })',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

test('no horizontal overflow at any viewport', function (int $width, int $height) {
    visit(route('register'))
        ->resize($width, $height)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with([
    'mobile 320' => [320, 800],
    'mobile 375' => [375, 812],
    'tablet 768' => [768, 1024],
    'small laptop 1024' => [1024, 768],
    'desktop 1920' => [1920, 1080],
]);
