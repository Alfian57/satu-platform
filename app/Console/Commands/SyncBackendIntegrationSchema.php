<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schema;

#[Signature('backend:sync-integration-schema {--database= : Nama koneksi wajib eksplisit} {--apply : Tambahkan kolom yang belum ada} {--dump-tool= : Path executable mysqldump} {--backup= : Path baru untuk cadangan SQL privat}')]
#[Description('Periksa dan sinkronkan dua kolom integrasi backend pada MySQL lokal dengan cadangan wajib')]
final class SyncBackendIntegrationSchema extends Command
{
    public function handle(): int
    {
        $name = $this->option('database');
        if (! is_string($name) || $name === '' || ! is_array($config = config('database.connections.'.$name))) {
            $this->error('Tentukan koneksi yang dikonfigurasi melalui --database.');

            return self::FAILURE;
        }
        $schema = Schema::connection($name);
        foreach (['users', 'inclusion_signals'] as $table) {
            if (! $schema->hasTable($table)) {
                $this->error('Tabel sumber belum tersedia: '.$table);

                return self::FAILURE;
            }
        }
        $missingToken = ! $schema->hasColumn('users', 'remember_token');
        $missingSynthetic = ! $schema->hasColumn('inclusion_signals', 'is_synthetic');
        $this->info('Target: '.$name.' / '.(string) $config['database']);
        $this->info('users.remember_token: '.($missingToken ? 'belum ada' : 'sesuai'));
        $this->info('inclusion_signals.is_synthetic: '.($missingSynthetic ? 'belum ada' : 'sesuai'));
        if (! $this->option('apply') || (! $missingToken && ! $missingSynthetic)) {
            return self::SUCCESS;
        }
        if (! app()->isLocal() || ($config['driver'] ?? null) !== 'mysql' || ! in_array($config['host'] ?? null, ['localhost', '127.0.0.1', '::1'], true)) {
            $this->error('Penerapan hanya tersedia pada MySQL lokal. Production memerlukan prosedur terpisah.');

            return self::FAILURE;
        }
        $tool = $this->option('dump-tool');
        $backup = $this->option('backup');
        if (! is_string($tool) || ! is_file($tool) || ! is_string($backup) || $backup === '' || file_exists($backup) || realpath(dirname($backup)) === false) {
            $this->error('Tentukan executable --dump-tool dan --backup baru di direktori privat yang sudah tersedia.');

            return self::FAILURE;
        }
        $directory = realpath(dirname($backup));
        if ($directory === false) {
            $this->error('Direktori cadangan tidak tersedia. Schema tidak diubah.');

            return self::FAILURE;
        }
        $publicDirectory = realpath(public_path());
        if ($publicDirectory !== false && str_starts_with(strtolower($directory), strtolower($publicDirectory))) {
            $this->error('Cadangan tidak boleh disimpan di direktori publik.');

            return self::FAILURE;
        }
        $connection = DB::connection($name);
        $counts = [];
        foreach ($schema->getTables((string) $config['database']) as $table) {
            $counts[$table['name']] = $connection->table($table['name'])->count();
        }
        $result = Process::timeout(120)->env(['MYSQL_PWD' => (string) ($config['password'] ?? '')])->run([
            $tool, '--host='.(string) $config['host'], '--port='.(string) $config['port'],
            '--user='.(string) $config['username'], '--single-transaction', '--skip-lock-tables',
            '--no-tablespaces', '--routines', '--events', '--triggers', '--hex-blob',
            '--set-gtid-purged=OFF', '--column-statistics=0', '--result-file='.$backup,
            '--databases', (string) $config['database'],
        ]);
        if (! $result->successful() || ! is_file($backup) || filesize($backup) === 0) {
            $this->error('Cadangan belum berhasil. Schema tidak diubah. Periksa dukungan dan izin mysqldump.');

            return self::FAILURE;
        }
        $dump = file_get_contents($backup);
        if ($dump === false || ! str_contains($dump, 'Dump completed')) {
            $this->error('Cadangan belum lengkap. Schema tidak diubah.');

            return self::FAILURE;
        }
        foreach (array_keys($counts) as $table) {
            if (! str_contains($dump, 'CREATE TABLE `'.$table.'`')) {
                $this->error('Cadangan tidak mencakup seluruh tabel. Schema tidak diubah.');

                return self::FAILURE;
            }
        }
        unset($dump);
        $this->info('Cadangan: '.$backup);
        $this->info('SHA-256: '.hash_file('sha256', $backup));
        if ($missingToken) {
            $schema->table('users', function (Blueprint $table): void {
                $table->rememberToken();
            });
        }
        if ($missingSynthetic) {
            $schema->table('inclusion_signals', function (Blueprint $table): void {
                $table->boolean('is_synthetic')->default(false);
            });
        }
        foreach ($counts as $table => $count) {
            if ($connection->table($table)->count() !== $count) {
                $this->error('Jumlah baris berubah selama sinkronisasi. Periksa aktivitas aplikasi dan cadangan.');

                return self::FAILURE;
            }
        }
        if (! $schema->hasColumn('users', 'remember_token') || ! $schema->hasColumn('inclusion_signals', 'is_synthetic')) {
            $this->error('Schema belum lengkap. Cadangan tetap tersedia.');

            return self::FAILURE;
        }
        $this->info('Dua kolom sesuai migration asli. Jumlah baris seluruh tabel tetap sama. Tidak ada data yang dihapus.');

        return self::SUCCESS;
    }
}
