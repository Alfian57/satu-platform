<?php

test('auth layout presents the left panel as a focused collaboration canvas', function () {
    $layoutPath = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/layouts/auth/auth-simple-layout.tsx';
    $layout = file_get_contents($layoutPath);

    expect($layout)
        ->not->toBeFalse()
        ->toContain('Left Panel - Collaboration Canvas')
        ->toContain('AKSES PRIVAT')
        ->toContain('BUKU BESAR KOLABORASI')
        ->toContain('landing-mascot-accessories.webp')
        ->toContain('bg-[#eff6ff]')
        ->toContain('[&>img]:size-11')
        ->toContain('border-blue-200/80')
        ->toContain('Right Panel - Form Area')
        ->not->toContain('features.map')
        ->not->toContain('backdrop-blur-sm');
});
