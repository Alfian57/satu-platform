<?php

use App\Models\NotificationPreference;
use App\Models\User;
use App\Support\Notification\NotificationSerializer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Notification Preferences
|--------------------------------------------------------------------------
*/

test('user can have notification preferences', function () {
    $user = User::factory()->create();

    $pref = NotificationPreference::factory()->create([
        'user_id' => $user->id,
        'purpose' => 'otp',
        'channel' => 'whatsapp',
        'enabled' => true,
    ]);

    expect($pref->user_id)->toBe($user->id)
        ->and($pref->purpose)->toBe('otp')
        ->and($pref->channel)->toBe('whatsapp')
        ->and($pref->enabled)->toBeTrue();
});

test('preferences are unique per user purpose and channel', function () {
    $user = User::factory()->create();

    NotificationPreference::factory()->create([
        'user_id' => $user->id,
        'purpose' => 'otp',
        'channel' => 'whatsapp',
    ]);

    expect(fn () => NotificationPreference::factory()->create([
        'user_id' => $user->id,
        'purpose' => 'otp',
        'channel' => 'whatsapp',
    ]))->toThrow(Exception::class);
});

/*
|--------------------------------------------------------------------------
| Notifications Listing
|--------------------------------------------------------------------------
*/

test('user can view notification index', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('notifications.index'));

    $response->assertOk();
});

test('unread count is included in response', function () {
    $user = User::factory()->create();

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => ['message' => 'Test notification', 'purpose' => 'security'],
    ]);

    $response = $this->actingAs($user)->get(route('notifications.index'));

    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->has('unreadCount')
        ->where('unreadCount', 1)
    );
});

/*
|--------------------------------------------------------------------------
| Mark Read
|--------------------------------------------------------------------------
*/

test('user can mark single notification as read', function () {
    $user = User::factory()->create();

    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => ['message' => 'Test', 'purpose' => 'otp'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('notifications.mark-read', $notification->id));

    $response->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('user can mark all notifications as read', function () {
    $user = User::factory()->create();

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => ['message' => 'Test 1', 'purpose' => 'otp'],
    ]);
    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => ['message' => 'Test 2', 'purpose' => 'security'],
    ]);

    $response = $this->actingAs($user)->post(route('notifications.mark-all-read'));

    $response->assertRedirect();

    expect($user->fresh()->unreadNotifications)->toHaveCount(0);
});

test('cannot mark another users notification as read', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $notification = $other->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => ['message' => 'Test', 'purpose' => 'security'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('notifications.mark-read', $notification->id));

    $response->assertNotFound();
});

/*
|--------------------------------------------------------------------------
| Preferences Update
|--------------------------------------------------------------------------
*/

test('user can update notification preference', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('notification-preferences.update'), [
        'purpose' => 'otp',
        'channel' => 'whatsapp',
        'enabled' => false,
    ]);

    $response->assertRedirect();

    $pref = NotificationPreference::query()
        ->where('user_id', $user->id)
        ->where('purpose', 'otp')
        ->first();

    expect($pref)->not->toBeNull()
        ->and($pref->enabled)->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Notification Serialization - Safe Projection
|--------------------------------------------------------------------------
*/

test('serializer excludes phone and private data', function () {
    $user = User::factory()->create();

    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\Test',
        'data' => [
            'message' => 'Kode OTP Anda: 123456',
            'purpose' => 'otp',
            'action_url' => '/onboarding',
            'phone' => '+6281234567890',
            'token' => 'secret',
        ],
    ]);

    $serialized = NotificationSerializer::toArray($notification);

    expect($serialized)
        ->toHaveKey('id')
        ->toHaveKey('message')
        ->toHaveKey('action_url')
        ->toHaveKey('purpose')
        ->not->toHaveKey('phone')
        ->not->toHaveKey('token')
        ->not->toHaveKey('data');
});
