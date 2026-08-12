<?php

use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Jobs\SendWhatsAppMessage;
use App\Models\MessageDelivery;
use App\Models\MessageOutbox;
use App\Models\NotificationPreference;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\WhatsAppGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Scheduled dispatch command
|--------------------------------------------------------------------------
*/

test('dispatch-due submits ready pending messages to the queue', function () {
    Queue::fake();

    MessageOutbox::factory()->otp()->create();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    Queue::assertPushed(SendWhatsAppMessage::class);
});

test('dispatch-due ignores sent, failed, and future messages', function () {
    Queue::fake();

    MessageOutbox::factory()->create(['status' => MessageStatus::Sent]);
    MessageOutbox::factory()->create(['status' => MessageStatus::Failed]);
    MessageOutbox::factory()->create([
        'status' => MessageStatus::Pending,
        'next_attempt_at' => Carbon::now()->addHour(),
    ]);

    $this->artisan('message:dispatch-due')->assertSuccessful();

    Queue::assertNothingPushed();
});

/*
|--------------------------------------------------------------------------
| Queue-down recovery: stale processing reclaim
|--------------------------------------------------------------------------
*/

test('dispatch-due reclaims stale processing outboxes and re-dispatches them', function () {
    Carbon::setTestNow(Carbon::create(2026, 6, 15, 12, 0, 0));

    $stale = MessageOutbox::factory()->otp()->create([
        'status' => MessageStatus::Processing,
        'updated_at' => Carbon::now()->subMinutes(10),
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    $stale->refresh();

    expect($stale->status)->toBe(MessageStatus::Pending)
        ->and($stale->status_history)->toHaveCount(1)
        ->and($stale->status_history[0]['reason'])->toBe('stale_processing_reclaim');

    Queue::assertPushed(SendWhatsAppMessage::class, 1);

    Carbon::setTestNow(null);
});

test('dispatch-due leaves a fresh processing outbox untouched', function () {
    Carbon::setTestNow(Carbon::create(2026, 6, 15, 12, 0, 0));

    $fresh = MessageOutbox::factory()->otp()->create([
        'status' => MessageStatus::Processing,
        'updated_at' => Carbon::now(),
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    expect($fresh->fresh()->status)->toBe(MessageStatus::Processing);

    Queue::assertNothingPushed();
});

test('dispatch-due resolves an exhausted stale processing entry to failed, not pending', function () {
    Carbon::setTestNow(Carbon::create(2026, 6, 15, 12, 0, 0));

    $exhausted = MessageOutbox::factory()->otp()->create([
        'status' => MessageStatus::Processing,
        'attempts' => 3,
        'max_attempts' => 3,
        'updated_at' => Carbon::now()->subMinutes(10),
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    expect($exhausted->fresh()->status)->toBe(MessageStatus::Failed)
        ->and($exhausted->fresh()->status_history)->toHaveCount(1);

    Queue::assertNothingPushed();
});

/*
|--------------------------------------------------------------------------
| Preference boundary
|--------------------------------------------------------------------------
*/

test('critical auth purposes bypass a disabled channel preference', function () {
    $number = '+6281234567890';

    $user = User::factory()->create();

    PhoneNumber::factory()->forNumber($number)->for($user)->create();

    NotificationPreference::create([
        'user_id' => $user->id,
        'purpose' => MessagePurpose::Otp->value,
        'channel' => 'whatsapp',
        'enabled' => false,
    ]);

    MessageOutbox::factory()->otp()->create([
        'purpose' => MessagePurpose::Otp,
        'recipient' => $number,
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    Queue::assertPushed(SendWhatsAppMessage::class, 1);
});

test('non-critical intent is skipped when the recipient disables WhatsApp', function () {
    $number = '+6281234567890';

    $user = User::factory()->create();

    PhoneNumber::factory()->forNumber($number)->for($user)->create();

    NotificationPreference::create([
        'user_id' => $user->id,
        'purpose' => MessagePurpose::Deadline->value,
        'channel' => 'whatsapp',
        'enabled' => false,
    ]);

    MessageOutbox::factory()->create([
        'purpose' => MessagePurpose::Deadline,
        'recipient' => $number,
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    Queue::assertNothingPushed();
});

test('non-critical intent defaults to delivery when no preference exists', function () {
    $number = '+6281234567890';

    User::factory()->create();

    PhoneNumber::factory()->forNumber($number)->create();

    MessageOutbox::factory()->create([
        'purpose' => MessagePurpose::Deadline,
        'recipient' => $number,
    ]);

    Queue::fake();

    $this->artisan('message:dispatch-due')->assertSuccessful();

    Queue::assertPushed(SendWhatsAppMessage::class, 1);
});

/*
|--------------------------------------------------------------------------
| Failed-job handling and idempotency
|--------------------------------------------------------------------------
*/

test('job failed hook marks a stuck outbox failed without a delivery row', function () {
    $outbox = MessageOutbox::factory()->otp()->create([
        'status' => MessageStatus::Processing,
    ]);

    Log::spy();

    $job = new SendWhatsAppMessage($outbox->id);
    $job->failed(new RuntimeException('boom'));

    expect($outbox->fresh()->status)->toBe(MessageStatus::Failed)
        ->and($outbox->fresh()->status_history)->toHaveCount(1);

    expect(MessageDelivery::query()->count())->toBe(0);
});

test('job refuses to resend an outbox that already exhausted its attempts', function () {
    $gateway = new FakeWhatsAppGateway;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create([
        'status' => MessageStatus::Pending,
        'attempts' => 3,
        'max_attempts' => 3,
    ]);

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    expect($outbox->fresh()->status)->toBe(MessageStatus::Failed)
        ->and($gateway->sentMessages())->toBeEmpty()
        ->and(MessageDelivery::query()->count())->toBe(0);
});

test('re-dispatching an already sent outbox does not duplicate delivery', function () {
    $gateway = new FakeWhatsAppGateway;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));
    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    expect(MessageDelivery::query()->where('message_outbox_id', $outbox->id)->count())->toBe(1)
        ->and($gateway->sentMessages())->toHaveCount(1);
});

/*
|--------------------------------------------------------------------------
| Payload privacy
|--------------------------------------------------------------------------
*/

test('provider errors are sanitized before persistence', function () {
    $gateway = new class implements WhatsAppGateway
    {
        public function send(array $payload): array
        {
            return ['success' => false, 'error' => 'rejected target 081234567890'];
        }
    };

    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $delivery = MessageDelivery::query()->where('message_outbox_id', $outbox->id)->first();

    expect($delivery->error_message)->toContain('[PHONE]')
        ->and($delivery->error_message)->not->toContain('081234567890');
});

test('outbox payload is encrypted and never stored in plaintext', function () {
    $outbox = MessageOutbox::factory()->otp()->create();

    $decrypted = Crypt::decryptString($outbox->payload);

    expect($decrypted)->toContain('123456')
        ->and($outbox->getRawOriginal('payload'))->toStartWith('eyJ');
});
