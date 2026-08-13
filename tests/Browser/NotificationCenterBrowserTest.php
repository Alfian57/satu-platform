<?php

use App\Models\User;
use Illuminate\Support\Str;

test('student can inspect notification history and manage unread state', function () {
    $user = User::factory()->create(['name' => 'Student Browser Notifications']);
    $contributionNotification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ContributionReviewedNotification',
        'data' => [
            'message' => 'Hasil review contribution tersedia.',
            'purpose' => 'contribution_reviewed',
            'category' => 'contribution',
            'action_label' => 'Lihat hasil review',
            'action_url' => route('contributions.index'),
        ],
    ]);
    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\SecurityNotification',
        'data' => [
            'message' => 'Perangkat baru terdeteksi.',
            'purpose' => 'security',
            'category' => 'security',
        ],
    ]);

    $this->actingAs($user);

    $page = visit(route('notifications.index'))
        ->resize(390, 844)
        ->waitForText('Hasil review contribution tersedia.')
        ->assertSee('Belum dibaca')
        ->assertSee('WhatsApp')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p50-notifications-mobile-390x844');

    $page
        ->click("@notification-mark-read-{$contributionNotification->id}")
        ->waitForText('Notifikasi sudah ditandai dibaca.')
        ->click('@notifications-mark-all')
        ->waitForText('Notifikasi yang tampil sudah ditandai dibaca.')
        ->click('@notifications-category-contribution')
        ->waitForText('Hasil review contribution tersedia.')
        ->assertSee('Contribution')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->resize(1366, 900)
        ->screenshot(true, 'p50-notifications-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($contributionNotification->refresh()->read_at)->not->toBeNull();
});

test('notification history empty state remains usable on desktop', function () {
    $user = User::factory()->create(['name' => 'Student Empty Notifications']);

    $this->actingAs($user);

    visit(route('notifications.index'))
        ->resize(1366, 900)
        ->waitForText('Belum ada notifikasi')
        ->assertSee('history canonical')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p50-notifications-empty-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
