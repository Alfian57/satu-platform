<?php

test('public landing communicates the flow and remains responsive', function () {
    $page = visit(route('home'))
        ->resize(390, 844)
        ->assertSee('Kolaborasi yang')
        ->assertScript(
            "document.querySelector('img[src$=\"landing-mascot-accessories.webp\"]') !== null",
            true,
        )
        ->assertSee('Data synthetic')
        ->assertSee('Graf kolaborasi')
        ->assertSee('Dari peluang menjadi bukti')
        ->assertScript(
            "getComputedStyle(document.querySelector('.landing-blue-hero')).backgroundImage.includes('gradient')",
            true,
        )
        ->click('Lihat cara kerja')
        ->assertScript(
            "document.querySelector('#cara-kerja [data-testid=\"landing-flow-ledger\"]') !== null",
            true,
        )
        ->assertSee('Peluang')
        ->click('[data-testid="landing-stage-validation"]')
        ->assertSee('Kontribusi tervalidasi')
        ->click('Lihat batas portofolio')
        ->assertSee('Data yang terlihat punya tujuan.')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'landing-redesign-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    $page
        ->resize(1366, 900)
        ->assertSee('Mulai membangun portofolio')
        ->assertSee('Ledger hubungan')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'landing-redesign-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoAccessibilityIssues();
});
