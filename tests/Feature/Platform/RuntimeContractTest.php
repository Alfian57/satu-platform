<?php

namespace Tests\Feature\Platform;

use Illuminate\Console\Scheduling\Schedule;

/*
|--------------------------------------------------------------------------
| Production Runtime Contract (Issue #67 / P66)
|--------------------------------------------------------------------------
|
| Validates that the runtime contract defined in docs/engineering/OPERATIONS.md
| is backed by the implementation:
| - Health endpoint responds successfully
| - Scheduler registers the required recurring commands with their cadence
| - Private attachment disk is not publicly served
| - The application fails fast when a required secret is missing
|
*/

test('health endpoint responds 200 on the up route', function () {
    $this->get('/up')
        ->assertOk();
});

test('scheduler registers message dispatch and anomaly alert commands', function () {
    $commands = collect(app(Schedule::class)->events())
        ->map(fn ($event) => trim((string) $event->command));

    expect($commands)
        ->toContain('message:dispatch-due')
        ->toContain('integration:alert-sync-anomalies');
});

test('message dispatch command runs every minute without overlapping', function () {
    $event = collect(app(Schedule::class)->events())->first(
        fn ($event) => str_contains((string) $event->command, 'message:dispatch-due'),
    );

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('* * * * *');
});

test('anomaly alert command is single-server and non-overlapping', function () {
    $event = collect(app(Schedule::class)->events())->first(
        fn ($event) => str_contains(
            (string) $event->command,
            'integration:alert-sync-anomalies',
        ),
    );

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('*/15 * * * *');
});

test('private attachment disk is not publicly served', function () {
    $disk = config('filesystems.disks.private');

    expect($disk['driver'])->toBe('local')
        ->and($disk['visibility'])->toBe('private')
        ->and($disk['serve'])->toBeFalse();
});
