<?php

namespace App\Console\Commands;

use App\Actions\Institution\UniversityTransitionInventory;
use Illuminate\Console\Command;

final class InspectUniversity extends Command
{
    protected $signature = 'university:inspect {--json : Keluarkan inventaris sebagai JSON}';

    protected $description = 'Periksa konfigurasi universitas dan inventaris transisi tanpa mengubah data';

    public function handle(UniversityTransitionInventory $inventory): int
    {
        $snapshot = $inventory->handle();
        if ($this->option('json')) {
            $this->line(json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
        } else {
            $this->info('Status konfigurasi: '.$snapshot['configuration_state']);
            $this->table(['ID', 'Universitas', 'Status', 'Sasaran', 'Membership', 'Admin', 'Undangan', 'Roster', 'Profil', 'Proyek', 'Kontribusi', 'Karya'], array_map(
                static fn (array $row): array => [$row['id'], $row['name'], $row['status'], $row['is_target'] ? 'Ya' : 'Tidak', $row['memberships'], $row['verified_admins'], $row['pending_invitations'], $row['rosters'], $row['profiles'], $row['projects'], $row['contributions'], $row['portfolios']],
                $snapshot['institutions'],
            ));
            $this->line('ID admin platform lama: '.implode(', ', $snapshot['platform_admin_user_ids']));
            $this->line('ID admin dengan membership lintas institusi: '.implode(', ', $snapshot['multi_institution_admin_user_ids']));
            $this->comment('Inventaris baca-saja. Tidak memetakan akun, memindahkan data atau mengubah konfigurasi.');
        }

        return $snapshot['configuration_state'] === 'ready' ? self::SUCCESS : self::FAILURE;
    }
}
