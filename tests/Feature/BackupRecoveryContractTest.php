<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

test('backup script exists and is executable', function () {
    $scriptPath = base_path('scripts/backup.sh');

    expect(File::exists($scriptPath))->toBeTrue()
        ->and(File::isFile($scriptPath))->toBeTrue()
        ->and(is_executable($scriptPath))->toBeTrue();
});

test('backup documentation covers required procedures', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');

    expect(File::exists($docPath))->toBeTrue();

    $content = File::get($docPath);

    expect($content)
        ->toContain('Backup Schedule')
        ->toContain('Restore Procedures')
        ->toContain('Monitoring dan Alerting')
        ->toContain('Incident Response')
        ->toContain('Privacy Incident Response')
        ->toContain('Recovery Time Objective')
        ->toContain('Recovery Point Objective');
});

test('database connection is configured and reachable', function () {
    expect(fn () => DB::connection()->getPdo())->not->toThrow(Exception::class);

    $result = DB::select('SELECT 1 as test');
    expect($result[0]->test)->toBe(1);
});

test('queue connection is configured', function () {
    $queueConnection = config('queue.default');

    expect($queueConnection)->toBeIn(['sync', 'database', 'redis']);

    $driver = config("queue.connections.{$queueConnection}.driver");
    expect($driver)->not->toBeNull();
});

test('scheduler configuration file exists', function () {
    $consolePath = base_path('routes/console.php');

    expect(File::exists($consolePath))->toBeTrue();

    $content = File::get($consolePath);

    expect($content)->toContain('Schedule::')
        ->and($content)->toContain('message:dispatch-due');
});

test('health check endpoint is available', function () {
    $response = $this->get('/up');

    $response->assertStatus(200);
});

test('storage path for private attachments exists', function () {
    $privatePath = storage_path('app/private');

    if (! File::exists($privatePath)) {
        File::makeDirectory($privatePath, 0755, true);
    }

    expect(File::exists($privatePath))->toBeTrue()
        ->and(File::isDirectory($privatePath))->toBeTrue();
});

test('backup directory can be created if missing', function () {
    $testBackupDir = storage_path('framework/testing/backups');

    if (File::exists($testBackupDir)) {
        File::deleteDirectory($testBackupDir);
    }

    expect(File::exists($testBackupDir))->toBeFalse();

    File::makeDirectory($testBackupDir, 0755, true);

    expect(File::exists($testBackupDir))->toBeTrue()
        ->and(File::isDirectory($testBackupDir))->toBeTrue();

    File::deleteDirectory($testBackupDir);
});

test('environment variables required for backup are documented', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('DB_')
        ->toContain('BACKUP_DIR')
        ->toContain('environment variable');
});

test('incident response procedures are documented', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('Incident Classification')
        ->toContain('Incident Response Procedure')
        ->toContain('Escalation Procedures')
        ->toContain('P1')
        ->toContain('P2');
});

test('privacy incident response is documented', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('Privacy Incident Response')
        ->toContain('unauthorized access')
        ->toContain('Contain')
        ->toContain('Assess')
        ->toContain('Notify')
        ->toContain('Remediate');
});

test('monitoring checks for queue and reverb are documented', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('Queue Failure Monitoring')
        ->toContain('Reverb Health Monitoring')
        ->toContain('Application Error Monitoring');
});

test('recovery objectives RTO and RPO are defined', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('RTO')
        ->toContain('RPO')
        ->toContain('Recovery Time Objective')
        ->toContain('Recovery Point Objective');
});

test('restore drill procedures are documented', function () {
    $docPath = base_path('docs/engineering/BACKUP_RECOVERY.md');
    $content = File::get($docPath);

    expect($content)
        ->toContain('Restore Drill')
        ->toContain('Simulasi database restore')
        ->toContain('Verifikasi data integrity');
});
