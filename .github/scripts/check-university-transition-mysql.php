<?php

declare(strict_types=1);

use App\Actions\Contribution\ReviewContribution;
use App\Actions\Institution\ChangeUniversityAdminStatus;
use App\Actions\Institution\MapUniversityAdmin;
use App\Actions\Task\CreateTask;
use App\Enums\ContributionReviewDecision;
use App\Enums\InstitutionMembershipStatus;
use App\Events\ContributionApproved;
use App\Events\WorkspaceTaskChanged;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\Auth\UniversityAdminRevision;
use App\Support\Contribution\ContributionSnapshot;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Psr\Log\NullLogger;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Process\InputStream;
use Symfony\Component\Process\Process;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'FAIL '.$error->getMessage().' at '.$error->getFile().':'.$error->getLine().PHP_EOL);
    exit(1);
});

if (! app()->environment(['local', 'testing']) || app()->configurationIsCached()
    || ! in_array($argv[1] ?? '', ['--run', '--worker'], true)) {
    throw new RuntimeException('U06 hanya untuk local/testing tanpa config cache. Gunakan --run secara eksplisit.');
}
$source = config('database.connections.mysql');
if (! is_array($source) || ($source['driver'] ?? null) !== 'mysql'
    || ! in_array($source['host'] ?? null, ['127.0.0.1', 'localhost', '::1'], true)
    || ! empty($source['url']) || ! empty($source['unix_socket']) || ! empty($source['prefix'])
    || ! empty($source['read']) || ! empty($source['write'])
    || ! ctype_digit((string) ($source['port'] ?? ''))) {
    throw new RuntimeException('U06 memerlukan koneksi MySQL loopback tunggal tanpa URL, socket atau prefix.');
}
$sourceDatabase = $source['database'];
$worker = $argv[1] === '--worker';
$nonce = $worker ? getenv('SATU_U06_OWNER') : bin2hex(random_bytes(10));
if (! is_string($nonce) || preg_match('/^[a-f0-9]{20}$/D', $nonce) !== 1) {
    throw new RuntimeException('Penanda pemilik pengujian tidak sah.');
}
$testDatabase = 'satu_u06_'.$nonce;
$restoreDatabase = $testDatabase.'_restore';
foreach ([$testDatabase, $restoreDatabase] as $name) {
    if (preg_match('/^satu_u06_[a-f0-9]{20}(?:_restore)?$/D', $name) !== 1 || $name === $sourceDatabase) {
        throw new RuntimeException('Target bukan schema sementara milik runner.');
    }
}
$connection = 'university_transition_mysql';
$diskRoot = sys_get_temp_dir().'/satu-u06-'.$nonce;
app()->instance('env', 'testing');
config()->set([
    'database.default' => $connection,
    'database.connections.'.$connection => array_replace($source, ['database' => $testDatabase]),
    'cache.default' => 'array', 'session.driver' => 'array', 'broadcasting.default' => 'null',
    'queue.default' => 'database', 'queue.connections.database.connection' => $connection,
    'queue.failed.driver' => 'null', 'matching.enabled' => false,
    'university.slug' => 'universitas-teknologi-yogyakarta',
    'filesystems.disks.private' => ['driver' => 'local', 'root' => $diskRoot, 'throw' => true],
]);
Storage::forgetDisk('private');
Log::swap(new NullLogger);
Http::preventStrayRequests();
Event::fake([ContributionApproved::class, WorkspaceTaskChanged::class]);

function transitionServer(array $source): PDO
{
    return new PDO('mysql:host='.$source['host'].';port='.$source['port'].';charset=utf8mb4',
        $source['username'], $source['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

function transitionOwned(PDO $server, string $name, string $nonce): bool
{
    $row = $server->query('SELECT owner FROM `'.$name.'`.`u06_test_owner`')->fetchAll(PDO::FETCH_COLUMN);

    return $row === [$nonce];
}

if ($worker) {
    if (! transitionOwned(transitionServer($source), $testDatabase, $nonce)) {
        throw new RuntimeException('Worker menolak schema tanpa penanda pemilik.');
    }
    $command = json_decode((string) getenv('SATU_U06_COMMAND'), true, flags: JSON_THROW_ON_ERROR);
    $actor = User::query()->findOrFail($command['actor']);
    $resource = $command['action'] === 'suspend'
        ? InstitutionMembership::query()->findOrFail($command['resource'])
        : Contribution::query()->findOrFail($command['resource']);
    echo 'READY '.DB::selectOne('SELECT CONNECTION_ID() AS id')->id.PHP_EOL;
    flush();
    if (trim((string) fgets(STDIN)) !== 'GO') {
        throw new RuntimeException('Worker memerlukan sinyal mulai dari runner.');
    }
    try {
        if ($command['action'] === 'suspend') {
            app(ChangeUniversityAdminStatus::class)->handle($actor, $resource, InstitutionMembershipStatus::Suspended, $command['revision'], 'Penangguhan serentak. Data synthetic.');
        } else {
            app(ReviewContribution::class)->handle($resource, $actor, ContributionReviewDecision::Approved, 1, $command['revision']);
        }
        echo 'RESULT accepted'.PHP_EOL;
    } catch (AuthorizationException|ValidationException|ConflictHttpException $error) {
        echo 'RESULT rejected '.get_class($error).PHP_EOL;
    }
    exit(0);
}

$checks = 0;
function transitionCheck(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}

/** @param list<array<string, mixed>> $commands
 * @return list<string>
 */
function transitionRace(PDO $server, string $nonce, string $lockTable, int $lockId, array $commands): array
{
    $processes = [];
    $inputs = [];
    DB::beginTransaction();
    try {
        DB::table($lockTable)->where('id', $lockId)->lockForUpdate()->first();
        foreach ($commands as $command) {
            $input = new InputStream;
            $process = new Process([PHP_BINARY, __FILE__, '--worker'], dirname(__DIR__, 2), [
                'SATU_U06_OWNER' => $nonce, 'SATU_U06_COMMAND' => json_encode($command, JSON_THROW_ON_ERROR),
            ], $input, 25);
            $process->start();
            $processes[] = $process;
            $inputs[] = $input;
        }
        $deadline = microtime(true) + 15;
        $ids = [];
        do {
            $ids = [];
            foreach ($processes as $process) {
                $process->checkTimeout();
                if (preg_match('/^READY (\d+)\r?$/m', $process->getOutput(), $match) === 1) {
                    $ids[] = (int) $match[1];
                } elseif (! $process->isRunning()) {
                    throw new RuntimeException('Worker berhenti sebelum siap: '.$process->getErrorOutput().$process->getOutput());
                }
            }
            if (count($ids) !== 2) {
                usleep(20000);
            }
        } while (count($ids) !== 2 && microtime(true) < $deadline);
        transitionCheck(count($ids) === 2 && count(array_unique($ids)) === 2, 'Dua worker memakai koneksi MySQL terpisah.');
        foreach ($inputs as $input) {
            $input->write("GO\n");
            $input->close();
        }
        $waiters = $server->prepare('SELECT COUNT(DISTINCT t.PROCESSLIST_ID) FROM performance_schema.data_lock_waits w JOIN performance_schema.threads t ON t.THREAD_ID = w.REQUESTING_THREAD_ID WHERE t.PROCESSLIST_ID IN (?, ?)');
        $deadline = microtime(true) + 10;
        do {
            foreach ($processes as $process) {
                $process->isRunning();
                $process->checkTimeout();
            }
            $waiters->execute($ids);
            $waiting = (int) $waiters->fetchColumn();
            if ($waiting !== 2) {
                usleep(20000);
            }
        } while ($waiting !== 2 && microtime(true) < $deadline);
        transitionCheck($waiting === 2, 'Dua command benar-benar menunggu row lock bersamaan, bukan dijalankan bergantian.');
        DB::commit();
        $results = [];
        foreach ($processes as $process) {
            $process->wait();
            if (! $process->isSuccessful() || preg_match('/^RESULT (accepted|rejected)(?: [^\r\n]*)?\r?$/m', $process->getOutput(), $match) !== 1) {
                throw new RuntimeException('Worker gagal: '.$process->getErrorOutput().$process->getOutput());
            }
            $results[] = $match[1];
        }

        return $results;
    } finally {
        if (DB::transactionLevel() > 0) {
            DB::rollBack();
        }
        foreach ($processes as $process) {
            if ($process->isRunning()) {
                $process->stop(1);
            }
        }
    }
}

/** @return array<string, array{sql: string, rows: list<array<string, mixed>>}> */
function transitionSnapshot(PDO $pdo): array
{
    $snapshot = [];
    foreach ($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table) {
        if (preg_match('/^[a-zA-Z0-9_]+$/D', $table) !== 1) {
            throw new RuntimeException('Nama tabel uji tidak sah.');
        }
        $rows = $pdo->query('SELECT * FROM `'.$table.'`')->fetchAll(PDO::FETCH_ASSOC);
        usort($rows, static fn (array $left, array $right): int => strcmp(json_encode($left, JSON_THROW_ON_ERROR), json_encode($right, JSON_THROW_ON_ERROR)));
        $snapshot[$table] = ['sql' => $pdo->query('SHOW CREATE TABLE `'.$table.'`')->fetch(PDO::FETCH_NUM)[1], 'rows' => $rows];
    }
    ksort($snapshot);

    return $snapshot;
}

/** @return array<string, string> */
function transitionTriggers(PDO $pdo): array
{
    $triggers = [];
    foreach ($pdo->query('SHOW TRIGGERS')->fetchAll(PDO::FETCH_ASSOC) as $trigger) {
        $name = $trigger['Trigger'];
        if (preg_match('/^[a-zA-Z0-9_]+$/D', $name) !== 1) {
            throw new RuntimeException('Nama trigger uji tidak sah.');
        }
        $triggers[$name] = $pdo->query('SHOW CREATE TRIGGER `'.$name.'`')->fetch(PDO::FETCH_ASSOC)['SQL Original Statement'];
    }
    ksort($triggers);

    return $triggers;
}

function transitionForeignKeys(PDO $pdo): void
{
    $constraints = $pdo->query('SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION')->fetchAll(PDO::FETCH_ASSOC);
    $groups = [];
    foreach ($constraints as $constraint) {
        $groups[$constraint['TABLE_NAME'].'.'.$constraint['CONSTRAINT_NAME']][] = $constraint;
    }
    foreach ($groups as $parts) {
        $join = [];
        $nonNull = [];
        foreach ($parts as $part) {
            $join[] = 'c.`'.$part['COLUMN_NAME'].'` = p.`'.$part['REFERENCED_COLUMN_NAME'].'`';
            $nonNull[] = 'c.`'.$part['COLUMN_NAME'].'` IS NOT NULL';
        }
        $part = $parts[0];
        $count = $pdo->query('SELECT COUNT(*) FROM `'.$part['TABLE_NAME'].'` c LEFT JOIN `'.$part['REFERENCED_TABLE_NAME'].'` p ON '.implode(' AND ', $join).' WHERE '.implode(' AND ', $nonNull).' AND p.`'.$part['REFERENCED_COLUMN_NAME'].'` IS NULL')->fetchColumn();
        if ((int) $count !== 0) {
            throw new RuntimeException('Restore memiliki referensi yatim: '.$part['CONSTRAINT_NAME']);
        }
    }
}

$server = transitionServer($source);
$serverVersion = (string) $server->query('SELECT VERSION()')->fetchColumn();
if (str_contains(strtolower($serverVersion), 'mariadb') || version_compare($serverVersion, '8.0.0', '<')) {
    throw new RuntimeException('Runner U06 memerlukan MySQL 8 atau lebih baru dengan performance_schema aktif.');
}
$created = [];
try {
    foreach ([$testDatabase, $restoreDatabase] as $name) {
        $exists = $server->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?');
        $exists->execute([$name]);
        if ((int) $exists->fetchColumn() !== 0) {
            throw new RuntimeException('Schema uji sudah ada. Tidak ditimpa atau dihapus.');
        }
        $server->exec('CREATE DATABASE `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $server->exec('CREATE TABLE `'.$name.'`.`u06_test_owner` (owner CHAR(20) NOT NULL PRIMARY KEY) ENGINE=InnoDB');
        $server->prepare('INSERT INTO `'.$name.'`.`u06_test_owner` (owner) VALUES (?)')->execute([$nonce]);
        $created[] = $name;
    }
    transitionCheck(DB::connection()->getDatabaseName() !== $sourceDatabase && transitionOwned($server, $testDatabase, $nonce), 'Migrations hanya menuju schema acak milik runner, bukan database aplikasi.');
    foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
        (require $migration)->up();
    }
    $engine = DB::selectOne("SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND ENGINE <> 'InnoDB'");
    transitionCheck((int) $engine->total === 0, 'Schema hasil migration MySQL seluruhnya memakai InnoDB.');
    $campus = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta', 'name' => 'UTY. Data synthetic']);
    $other = Institution::factory()->active()->create(['name' => 'Kampus pembatas. Data synthetic']);
    $admins = [];
    $memberships = [];
    foreach ([1, 2] as $number) {
        $admin = User::factory()->create(['name' => 'Admin '.$number.'. Data synthetic']);
        PhoneNumber::factory()->create(['user_id' => $admin->id]);
        $admins[] = $admin;
        $memberships[] = InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $campus->id, 'user_id' => $admin->id]);
    }
    $foreign = User::factory()->create(['name' => 'Admin kampus lain. Data synthetic']);
    InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['institution_id' => $other->id, 'user_id' => $foreign->id]);
    $foreignBefore = json_encode([$other->fresh()->getAttributes(), $foreign->institutionMemberships()->first()->getAttributes()], JSON_THROW_ON_ERROR);
    transitionCheck(! $foreign->isUniversityAdmin(), 'Admin fixture institusi lain tidak memperoleh akses UTY.');

    $commands = [];
    foreach ($admins as $index => $admin) {
        $commands[] = ['action' => 'suspend', 'actor' => $admin->id, 'resource' => $memberships[$index]->id, 'revision' => UniversityAdminRevision::make($memberships[$index])];
    }
    $results = transitionRace($server, $nonce, 'institutions', $campus->id, $commands);
    sort($results);
    transitionCheck($results === ['accepted', 'rejected'] && InstitutionMembership::query()->where('institution_id', $campus->id)->where('role', 'campus_admin')->where('status', 'verified')->count() === 1, 'Penangguhan serentak tidak mencabut admin aktif terakhir.');
    transitionCheck(AuditLog::query()->where('operation', 'university.admin.status.changed')->count() === 1, 'Command penangguhan yang ditolak tidak menulis audit sukses.');
    $suspended = InstitutionMembership::query()->where('institution_id', $campus->id)->where('status', 'suspended')->sole();
    $active = InstitutionMembership::query()->where('institution_id', $campus->id)->where('status', 'verified')->sole()->user;
    $cachedActor = $admins[array_search($suspended->user_id, array_column($admins, 'id'), true)];
    Cache::put('u06-snapshot', ['admin' => true]);
    transitionCheck(Cache::get('u06-snapshot')['admin'] && ! $cachedActor->isUniversityAdmin(), 'Snapshot cache atau model lama tidak menggantikan izin admin aktual setelah pencabutan.');
    app(ChangeUniversityAdminStatus::class)->handle($active, $suspended, InstitutionMembershipStatus::Verified, UniversityAdminRevision::make($suspended), 'Pulihkan fixture untuk uji review. Data synthetic.');

    $owner = User::factory()->create(['name' => 'Pemilik karya. Data synthetic']);
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->id, 'user_id' => $owner->id]);
    $project = Project::factory()->open()->create(['institution_id' => $campus->id, 'owner_id' => $owner->id]);
    DB::beginTransaction();
    app(CreateTask::class)->handle($owner, $project, ['title' => 'Tugas batal. Data synthetic.']);
    transitionCheck(Event::dispatched(WorkspaceTaskChanged::class)->isEmpty(), 'MySQL tidak menerbitkan delta tugas sebelum commit luar.');
    DB::rollBack();
    transitionCheck(Task::count() === 0 && Event::dispatched(WorkspaceTaskChanged::class)->isEmpty(), 'Rollback MySQL membatalkan tugas tanpa delta palsu.');
    DB::beginTransaction();
    app(CreateTask::class)->handle($owner, $project, ['title' => 'Tugas tersimpan. Data synthetic.']);
    DB::commit();
    transitionCheck(Event::dispatched(WorkspaceTaskChanged::class)->count() === 1, 'Commit MySQL menerbitkan tepat satu delta tugas.');
    require $app->basePath('routes/channels.php');
    $channel = Broadcast::getChannels()['institutions.{institution}.projects.{project}.workspace'];
    transitionCheck($channel($owner, $campus, $project) && ! $channel($owner, $other, $project) && ! $channel($foreign, $campus, $project), 'Otorisasi channel memeriksa pemilik aktual dan institusi, bukan ID klien.');
    $studentMembership = InstitutionMembership::query()->where('user_id', $owner->id)->sole();
    $studentMembership->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
    transitionCheck(! $channel($owner, $campus, $project), 'Afiliasi yang dicabut menutup otorisasi channel berikutnya meskipun model pengguna masih sama.');
    $studentMembership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
    $contribution = Contribution::factory()->pending()->create(['institution_id' => $campus->id, 'project_id' => $project->id, 'owner_id' => $owner->id]);
    $version = ContributionVersion::factory()->forContribution($contribution)->create();
    $contribution->forceFill(['current_version_id' => $version->id])->save();
    $bytes = 'Bukti individual. Data synthetic.';
    $proof = Attachment::factory()->evidence()->create(['project_id' => $project->id, 'uploaded_by_id' => $owner->id, 'sha256' => hash('sha256', $bytes)]);
    Storage::disk('private')->put($proof->path, $bytes);
    ContributionEvidence::query()->forceCreate(['contribution_version_id' => $version->id, 'attachment_id' => $proof->id, 'source_label' => $proof->original_name]);
    $revision = ContributionSnapshot::revision($contribution->fresh());
    $commands = array_map(fn (User $admin): array => ['action' => 'review', 'actor' => $admin->id, 'resource' => $contribution->id, 'revision' => $revision], $admins);
    $results = transitionRace($server, $nonce, 'projects', $project->id, $commands);
    sort($results);
    transitionCheck($results === ['accepted', 'rejected'] && ContributionReview::count() === 1 && PortfolioEntry::count() === 1, 'Dua admin meninjau versi yang sama menghasilkan tepat satu keputusan dan satu karya.');
    transitionCheck(PortfolioEntry::query()->sole()->visibility->value === 'private' && $contribution->fresh()->status->value === 'approved', 'Approval serentak tetap menghasilkan karya privat dari versi yang disetujui.');
    transitionCheck(AuditLog::query()->where('operation', 'contribution.reviewed')->count() === 1, 'Keputusan stale tidak menambah riwayat review atau audit approval.');
    transitionCheck(DB::table('jobs')->count() === 1 && $owner->notifications()->count() === 0, 'Notifikasi approval belum terkirim sebelum worker antrean dijalankan.');

    $legacy = User::factory()->create(['name' => 'Akun transisi. Data synthetic', 'is_platform_admin' => true]);
    PhoneNumber::factory()->create(['user_id' => $legacy->id]);
    $map = app(MapUniversityAdmin::class);
    $before = [AuditLog::count(), InstitutionMembership::count(), Storage::disk('private')->allFiles()];
    transitionCheck($map->handle($legacy->id, 'Dry run U06. Data synthetic.')['status'] === 'dry_run'
        && $before === [AuditLog::count(), InstitutionMembership::count(), Storage::disk('private')->allFiles()], 'Dry run MySQL tidak menulis grant, audit atau receipt.');
    $mapped = $map->handle($legacy->id, 'Pemetaan U06. Data synthetic.', true);
    transitionCheck($legacy->isUniversityAdmin() && Storage::disk('private')->exists($mapped['receipt']), 'Pemetaan fixture MySQL menyimpan receipt privat sebelum grant.');

    $snapshot = transitionSnapshot(DB::connection()->getPdo());
    $triggers = transitionTriggers(DB::connection()->getPdo());
    $restored = new PDO('mysql:host='.$source['host'].';port='.$source['port'].';dbname='.$restoreDatabase.';charset=utf8mb4', $source['username'], $source['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $restored->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($snapshot as $table => $state) {
        if ($table === 'u06_test_owner') {
            continue;
        }
        $restored->exec($state['sql']);
        foreach ($state['rows'] as $row) {
            $columns = implode(', ', array_map(fn (string $column): string => '`'.$column.'`', array_keys($row)));
            $statement = $restored->prepare('INSERT INTO `'.$table.'` ('.$columns.') VALUES ('.implode(', ', array_fill(0, count($row), '?')).')');
            $statement->execute(array_values($row));
        }
    }
    $restored->exec('SET FOREIGN_KEY_CHECKS = 1');
    foreach ($triggers as $statement) {
        $restored->exec($statement);
    }
    $restoredSnapshot = transitionSnapshot($restored);
    transitionCheck(array_map(fn (array $state): array => $state['rows'], $snapshot) === array_map(fn (array $state): array => $state['rows'], $restoredSnapshot), 'Restore logical MySQL mempertahankan semua baris, termasuk audit, admin, versi dan antrean.');
    foreach (array_keys($snapshot) as $table) {
        $checked = $restored->query('CHECK TABLE `'.$table.'`')->fetchAll(PDO::FETCH_ASSOC);
        if (end($checked)['Msg_text'] !== 'OK') {
            throw new RuntimeException('Integrity tabel restore gagal: '.$table);
        }
    }
    transitionCheck(true, 'Seluruh tabel hasil restore lolos CHECK TABLE MySQL.');
    transitionForeignKeys($restored);
    transitionCheck(true, 'Seluruh foreign key hasil restore diperiksa ulang tanpa referensi yatim.');
    transitionCheck($triggers !== [] && transitionTriggers($restored) === $triggers, 'Restore mempertahankan seluruh trigger append-only, bukan hanya tabel dan baris.');
    Storage::disk('private')->put('restored/'.$proof->path, Storage::disk('private')->get($proof->path));
    transitionCheck(hash('sha256', Storage::disk('private')->get('restored/'.$proof->path)) === $proof->sha256, 'Bukti synthetic dipulihkan terpisah dengan checksum SHA-256 sesuai.');

    DB::purge($connection);
    config()->set('database.connections.'.$connection.'.database', $restoreDatabase);
    transitionCheck(DB::connection()->getDatabaseName() === $restoreDatabase && transitionOwned($server, $restoreDatabase, $nonce), 'Command pemulihan hanya berjalan pada schema restore milik runner.');
    $map->rollback($mapped['receipt'], 'Pemulihan U06. Data synthetic.', true);
    transitionCheck(! $legacy->isUniversityAdmin() && $legacy->fresh()->is_platform_admin
        && AuditLog::query()->where('operation', 'university.admin.mapping.rolled_back')->count() === 1, 'Receipt hasil backup dapat memulihkan pemetaan tanpa bypass admin atau penghapusan riwayat.');
    $auditCount = AuditLog::count();
    transitionCheck($map->rollback($mapped['receipt'], 'Ulang pemulihan U06. Data synthetic.', true)['status'] === 'already_rolled_back' && AuditLog::count() === $auditCount, 'Retry rollback setelah restore idempoten.');
    Artisan::call('queue:work', ['connection' => 'database', '--stop-when-empty' => true, '--sleep' => 0, '--tries' => 1, '--max-jobs' => 10]);
    transitionCheck(DB::table('jobs')->count() === 0 && $owner->notifications()->count() === 1, 'Worker memproses antrean yang dipulihkan menjadi satu notifikasi canonical.');
    Artisan::call('queue:work', ['connection' => 'database', '--stop-when-empty' => true, '--sleep' => 0, '--tries' => 1, '--max-jobs' => 10]);
    transitionCheck($owner->notifications()->count() === 1 && ContributionReview::count() === 1 && PortfolioEntry::count() === 1, 'Worker ulang tidak menggandakan notifikasi, pengakuan atau karya.');
    transitionCheck($foreignBefore === json_encode([$other->fresh()->getAttributes(), $foreign->institutionMemberships()->first()->getAttributes()], JSON_THROW_ON_ERROR), 'Data fixture institusi lain tidak dipindahkan atau ditulis ulang.');
    transitionCheck(Http::recorded()->isEmpty() && config('broadcasting.default') === 'null', 'Tidak ada HTTP provider atau broadcast Reverb nyata.');
} finally {
    DB::purge($connection);
    foreach (array_reverse($created) as $name) {
        if (! transitionOwned($server, $name, $nonce) || $name === $sourceDatabase) {
            throw new RuntimeException('Cleanup ditolak karena penanda kepemilikan berubah.');
        }
        $server->exec('DROP DATABASE `'.$name.'`');
    }
    echo 'Schema sementara milik runner dibersihkan. Database aplikasi tidak dimigrasi/reset.'.PHP_EOL;
}
echo $checks.' pemeriksaan U06 MySQL lokal lulus. Data synthetic. Bukan load test, UAT atau recovery production.'.PHP_EOL;
