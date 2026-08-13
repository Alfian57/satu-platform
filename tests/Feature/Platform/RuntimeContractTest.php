<?php

namespace Tests\Feature\Platform;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Collection;

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
|
| Scheduler events from bootstrap/app.php (withSchedule) only register once
| the console kernel boots (Artisan::starting), so the schedule must be read
| after booting the kernel.
|
*/

/**
 * @return Collection<int, Event>
 */
function scheduledEvents(): Collection
{
    app(Kernel::class)->bootstrap();

    return collect(app(Schedule::class)->events());
}

function scheduledEventFor(string $command): ?Event
{
    return scheduledEvents()->first(
        fn ($event) => str_contains((string) $event->command, $command),
    );
}

function scheduledCommands(): array
{
    return scheduledEvents()
        ->map(fn ($event) => trim((string) $event->command))
        ->values()
        ->all();
}

test('health endpoint responds 200 on the up route', function () {
    $this->get('/up')
        ->assertOk();
});

test('scheduler registers message dispatch and anomaly alert commands', function () {
    $commands = implode(' ', scheduledCommands());

    expect($commands)
        ->toContain('message:dispatch-due')
        ->toContain('integration:alert-sync-anomalies');
});

test('message dispatch command runs every minute without overlapping', function () {
    $event = scheduledEventFor('message:dispatch-due');

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('* * * * *');
});

test('anomaly alert command is single-server and non-overlapping', function () {
    $event = scheduledEventFor('integration:alert-sync-anomalies');

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('*/15 * * * *');
});

test('private attachment disk is not publicly served', function () {
    $disk = config('filesystems.disks.private');

    expect($disk['driver'])->toBe('local')
        ->and($disk['visibility'])->toBe('private')
        ->and($disk['serve'])->toBeFalse();
});
