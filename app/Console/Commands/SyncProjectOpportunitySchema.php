<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

#[Signature('projects:sync-opportunity-schema {--database= : Koneksi target wajib eksplisit} {--apply : Terapkan penambahan kolom} {--force : Konfirmasi target production}')]
#[Description('Periksa atau tambahkan dua kolom peluang T04 tanpa menghapus data existing')]
class SyncProjectOpportunitySchema extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connection = $this->option('database');
        if (! is_string($connection) || $connection === '' || ! is_array(config('database.connections.'.$connection))) {
            $this->error('Tentukan --database dengan nama koneksi yang sudah dikonfigurasi.');

            return self::FAILURE;
        }
        $schema = Schema::connection($connection);
        if (! $schema->hasTable('project_roles')) {
            $this->error('Tabel project_roles belum tersedia. Jalankan migration awal terlebih dahulu.');

            return self::FAILURE;
        }
        $missing = array_values(array_filter(['accepts_beginners', 'selection_criteria'], fn (string $column): bool => ! $schema->hasColumn('project_roles', $column)));
        $this->info('Target: '.$connection.' / '.(string) config('database.connections.'.$connection.'.database'));
        $this->info($missing === [] ? 'Schema T04 sudah sesuai.' : 'Kolom yang belum ada: '.implode(', ', $missing));
        if (! $this->option('apply') || $missing === []) {
            return self::SUCCESS;
        }
        if (app()->isProduction() && ! $this->option('force')) {
            $this->error('Production memerlukan konfirmasi eksplisit --force setelah meninjau target dan backup.');

            return self::FAILURE;
        }
        $schema->table('project_roles', function (Blueprint $table) use ($missing): void {
            if (in_array('accepts_beginners', $missing, true)) {
                $table->boolean('accepts_beginners')->nullable();
            }
            if (in_array('selection_criteria', $missing, true)) {
                $table->text('selection_criteria')->nullable();
            }
        });
        $this->info('Kolom ditambahkan. Data existing dipertahankan dengan nilai null.');

        return self::SUCCESS;
    }
}
