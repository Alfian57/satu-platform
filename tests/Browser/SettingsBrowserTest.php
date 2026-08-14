<?php

use App\Models\User;

test('student can scan account settings across profile, security, and appearance', function () {
    $user = User::factory()->create([
        'name' => 'Dian Pengaturan',
        'username' => 'dian-pengaturan',
    ]);

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()]);

    $page = visit(route('profile.edit'))
        ->resize(1366, 900)
        ->waitForText('Identitas akun')
        ->assertSee('Kelola akun dengan lebih tenang dan terkendali.')
        ->assertSee('Ruang pribadi')
        ->assertSee('Hapus akun')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'settings-modern-profile-desktop-1366x900');

    $page
        ->resize(390, 844)
        ->assertSee('Identitas akun')
        ->assertSee('Nama pengguna')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'settings-modern-profile-mobile-390x844')
        ->click('@delete-user-button')
        ->waitForText('Yakin ingin menghapus akunmu?')
        ->wait(0.3)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->click('Batal')
        ->wait(0.3);

    $page
        ->click('Keamanan')
        ->waitForText('Password dan keamanan')
        ->assertSee('Perbarui password')
        ->click('Tampilan')
        ->waitForText('Tampilan ruang kerja')
        ->assertSee('Mode terang aktif')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
