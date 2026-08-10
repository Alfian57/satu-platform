<?php

use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Jobs\SendWhatsAppMessage;
use App\Models\MessageDelivery;
use App\Models\MessageOutbox;
use App\Support\Notification\FakeWhatsAppGateway;
use App\Support\Notification\FonnteGateway;
use App\Support\Notification\WhatsAppGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Enums
|--------------------------------------------------------------------------
*/

test('MessagePurpose enum has all approved templates', function () {
    $purposes = MessagePurpose::cases();

    $values = array_map(fn (MessagePurpose $p) => $p->value, $purposes);

    expect($values)->toContain('otp', 'invitation', 'deadline', 'revision', 'contact', 'security');
});

test('MessageStatus enum has all required states', function () {
    $statuses = MessageStatus::cases();

    $values = array_map(fn (MessageStatus $s) => $s->value, $statuses);

    expect($values)->toContain('pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled');
});

/*
|--------------------------------------------------------------------------
| WhatsApp Gateway Contract
|--------------------------------------------------------------------------
*/

test('WhatsAppGateway interface defines send method', function () {
    $reflection = new ReflectionClass(WhatsAppGateway::class);

    expect($reflection->hasMethod('send'))->toBeTrue();
});

test('FonnteGateway implements WhatsAppGateway', function () {
    expect(FonnteGateway::class)->toImplement(WhatsAppGateway::class);
});

test('FakeWhatsAppGateway implements WhatsAppGateway', function () {
    expect(FakeWhatsAppGateway::class)->toImplement(WhatsAppGateway::class);
});

/*
|--------------------------------------------------------------------------
| Fake WhatsApp Gateway
|--------------------------------------------------------------------------
*/

test('fake gateway sends message successfully', function () {
    $gateway = new FakeWhatsAppGateway;

    $result = $gateway->send([
        'target' => '+6281234567890',
        'message' => 'Test message',
    ]);

    expect($result['success'])->toBeTrue()
        ->and($result['provider_message_id'])->toStartWith('fake_')
        ->and($gateway->sentMessages())->toHaveCount(1);
});

test('fake gateway can simulate failure', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldFail = true;

    $result = $gateway->send([
        'target' => '+6281234567890',
        'message' => 'Test message',
    ]);

    expect($result['success'])->toBeFalse()
        ->and($result['error'])->toContain('500');
});

test('fake gateway can simulate timeout', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldTimeout = true;

    $result = $gateway->send([
        'target' => '+6281234567890',
        'message' => 'Test message',
    ]);

    expect($result['success'])->toBeFalse()
        ->and($result['error'])->toContain('timeout');
});

test('fake gateway records all sent messages', function () {
    $gateway = new FakeWhatsAppGateway;

    $gateway->send(['target' => '+6281234567890', 'message' => 'First']);
    $gateway->send(['target' => '+6281234567890', 'message' => 'Second']);

    expect($gateway->sentMessages())->toHaveCount(2);
});

test('fake gateway reset clears state', function () {
    $gateway = new FakeWhatsAppGateway;

    $gateway->send(['target' => '+6281234567890', 'message' => 'Test']);
    $gateway->reset();

    expect($gateway->sentMessages())->toBeEmpty()
        ->and($gateway->shouldFail)->toBeFalse()
        ->and($gateway->shouldTimeout)->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Message Outbox and Delivery Schema
|--------------------------------------------------------------------------
*/

test('outbox stores message with purpose and recipient', function () {
    $outbox = MessageOutbox::factory()->otp()->create();

    expect($outbox->purpose)->toBe(MessagePurpose::Otp)
        ->and($outbox->recipient)->toStartWith('+628')
        ->and($outbox->status)->toBe(MessageStatus::Pending);
});

test('delivery records provider response', function () {
    $outbox = MessageOutbox::factory()->create();

    $delivery = MessageDelivery::factory()->create([
        'message_outbox_id' => $outbox->id,
        'provider' => 'fonnte',
        'external_id' => 'msg_abc123',
        'status' => MessageStatus::Sent,
    ]);

    expect($delivery->outbox->id)->toBe($outbox->id)
        ->and($delivery->provider)->toBe('fonnte')
        ->and($delivery->external_id)->toBe('msg_abc123');
});

test('delivery records failure with sanitized error', function () {
    $delivery = MessageDelivery::factory()->failed()->create();

    expect($delivery->status)->toBe(MessageStatus::Failed)
        ->and($delivery->error_message)->toContain('500');
});

/*
|--------------------------------------------------------------------------
| Idempotency: Unique Provider + External ID
|--------------------------------------------------------------------------
*/

test('delivery provider and external_id are unique', function () {
    MessageDelivery::factory()->create([
        'provider' => 'fonnte',
        'external_id' => 'msg_abc123',
    ]);

    expect(fn () => MessageDelivery::factory()->create([
        'provider' => 'fonnte',
        'external_id' => 'msg_abc123',
    ]))->toThrow(Exception::class);
});

/*
|--------------------------------------------------------------------------
| Send Job with Fake Gateway
|--------------------------------------------------------------------------
*/

test('job sends message and records delivery on success', function () {
    app()->instance(WhatsAppGateway::class, new FakeWhatsAppGateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();

    expect($outbox->status)->toBe(MessageStatus::Sent)
        ->and($outbox->sent_at)->not->toBeNull()
        ->and($outbox->attempts)->toBe(1);

    $delivery = MessageDelivery::query()->where('message_outbox_id', $outbox->id)->first();

    expect($delivery)->not->toBeNull()
        ->and($delivery->provider)->toBe('fonnte')
        ->and($delivery->status)->toBe(MessageStatus::Sent);
});

test('job retries on failure with backoff', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldFail = true;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();

    expect($outbox->status)->toBe(MessageStatus::Pending)
        ->and($outbox->attempts)->toBe(1)
        ->and($outbox->next_attempt_at)->not->toBeNull();
});

test('job marks as failed after max attempts', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldFail = true;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create([
        'attempts' => 2,
        'max_attempts' => 3,
    ]);

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();

    expect($outbox->status)->toBe(MessageStatus::Failed)
        ->and($outbox->attempts)->toBe(3);
});

test('job skips if status is not pending', function () {
    $gateway = new FakeWhatsAppGateway;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->create([
        'status' => MessageStatus::Sent,
    ]);

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();

    expect($outbox->status)->toBe(MessageStatus::Sent)
        ->and($outbox->attempts)->toBe(0);
});

test('job handles timeout with retry', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldTimeout = true;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $outbox->refresh();

    expect($outbox->status)->toBe(MessageStatus::Pending)
        ->and($outbox->next_attempt_at)->not->toBeNull();

    $delivery = MessageDelivery::query()->where('message_outbox_id', $outbox->id)->first();

    expect($delivery->error_message)->toContain('timeout');
});

/*
|--------------------------------------------------------------------------
| Provider Token Never Exposed
|--------------------------------------------------------------------------
*/

test('FonnteGateway does not expose token in config', function () {
    config(['services.fonnte.token' => 'test-token-here']);

    $gateway = new FonnteGateway(config('services.fonnte.token'));

    $reflection = new ReflectionClass($gateway);
    $property = $reflection->getProperty('token');

    expect($property->isPrivate())->toBeTrue();
});

test('outbox model does not have plain OTP column', function () {
    $outbox = MessageOutbox::factory()->otp()->create();

    $columns = Schema::getColumnListing('message_outboxes');

    expect($columns)->not->toContain('otp', 'otp_code', 'plain_otp', 'secret');
});

test('job records delivery with sanitized error on failure', function () {
    $gateway = new FakeWhatsAppGateway;
    $gateway->shouldTimeout = true;
    app()->instance(WhatsAppGateway::class, $gateway);

    $outbox = MessageOutbox::factory()->otp()->create();

    dispatch_sync(new SendWhatsAppMessage($outbox->id));

    $delivery = MessageDelivery::query()->where('message_outbox_id', $outbox->id)->first();

    expect($delivery)->not->toBeNull()
        ->and($delivery->status)->toBe(MessageStatus::Failed)
        ->and($delivery->error_message)->toContain('timeout');
});

/*
|--------------------------------------------------------------------------
| Scope: Ready to Send
|--------------------------------------------------------------------------
*/

test('readyToSend scope returns messages due for dispatch', function () {
    Carbon::setTestNow(Carbon::create(2026, 6, 15, 12, 0, 0));

    MessageOutbox::factory()->create([
        'status' => MessageStatus::Pending,
        'next_attempt_at' => null,
    ]);
    MessageOutbox::factory()->create([
        'status' => MessageStatus::Pending,
        'next_attempt_at' => Carbon::now()->subMinute(),
    ]);
    MessageOutbox::factory()->create([
        'status' => MessageStatus::Pending,
        'next_attempt_at' => Carbon::now()->addMinute(),
    ]);
    MessageOutbox::factory()->create(['status' => MessageStatus::Sent]);

    $ready = MessageOutbox::query()->readyToSend()->get();

    expect($ready)->toHaveCount(2);

    Carbon::setTestNow(null);
});
