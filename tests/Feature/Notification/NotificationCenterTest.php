<?php

use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\ContributionSubmittedNotification;
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

test('notification index filters by category and returns only safe fields', function () {
    $user = User::factory()->create();

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ContributionReviewedNotification',
        'data' => [
            'message' => 'Hasil review contribution tersedia.',
            'purpose' => 'contribution_reviewed',
            'category' => 'contribution',
            'reason' => 'Catatan private reviewer.',
            'note' => 'Detail private reviewer.',
        ],
    ]);
    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\SecurityNotification',
        'data' => [
            'message' => 'Aktivitas keamanan baru.',
            'purpose' => 'security',
            'category' => 'security',
        ],
    ]);

    $this->actingAs($user)
        ->get(route('notifications.index', ['category' => 'contribution']))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('category', 'contribution')
            ->has('notifications.data', 1)
            ->where('notifications.data.0.category', 'contribution')
            ->where('notifications.data.0.category_label', 'Contribution')
            ->missing('notifications.data.0.reason')
            ->missing('notifications.data.0.note')
            ->missing('notifications.data.0.data'));
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

test('user can mark only the selected notification category as read', function () {
    $user = User::factory()->create();

    $contributionNotification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ContributionReviewedNotification',
        'data' => [
            'message' => 'Contribution selesai direview.',
            'purpose' => 'contribution_reviewed',
        ],
    ]);
    $securityNotification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\SecurityNotification',
        'data' => [
            'message' => 'Keamanan akun perlu diperhatikan.',
            'purpose' => 'security',
        ],
    ]);

    $this->actingAs($user)
        ->post(route('notifications.mark-all-read'), ['category' => 'contribution'])
        ->assertRedirect();

    expect($contributionNotification->fresh()->read_at)->not->toBeNull()
        ->and($securityNotification->fresh()->read_at)->toBeNull();
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

test('in-app notification history cannot be disabled', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('notification-preferences.update'), [
            'purpose' => 'security',
            'channel' => 'in_app',
            'enabled' => false,
        ]);

    expect($response->getStatusCode())->toBe(302)
        ->and(NotificationPreference::query()->where('user_id', $user->getKey())->exists())
        ->toBeFalse();
});

test('notification navigation does not follow an external action url', function () {
    $user = User::factory()->create();
    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ExternalNotification',
        'data' => [
            'message' => 'Link yang harus dibatasi.',
            'purpose' => 'security',
            'action_url' => 'https://evil.example/phishing',
        ],
    ]);

    $response = $this->actingAs($user)
        ->get(route('notifications.navigate', $notification->id));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->not->toBe('https://evil.example/phishing')
        ->and($notification->fresh()->read_at)->not->toBeNull();
});

test('database notification intent prevents duplicate contribution submissions', function () {
    $user = User::factory()->create();
    $contribution = Contribution::factory()->create(['owner_id' => $user->getKey()]);
    $version = ContributionVersion::factory()->forContribution($contribution)->create();
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    $user->notify(new ContributionSubmittedNotification($contribution->fresh()));
    $user->notify(new ContributionSubmittedNotification($contribution->fresh()));

    expect($user->notifications()
        ->where('type', ContributionSubmittedNotification::class)
        ->count())->toBe(1);
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
            'intent_key' => 'security:1',
            'reason' => 'private reason',
            'note' => 'private note',
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
        ->not->toHaveKey('intent_key')
        ->not->toHaveKey('reason')
        ->not->toHaveKey('note')
        ->not->toHaveKey('data');
});
