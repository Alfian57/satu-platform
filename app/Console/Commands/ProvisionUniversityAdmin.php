<?php

namespace App\Console\Commands;

use App\Actions\Institution\ProvisionFirstUniversityAdmin;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Exceptions\UniversityProvisioningConflict;
use Illuminate\Console\Command;

final class ProvisionUniversityAdmin extends Command
{
    protected $signature = 'university:provision-admin {--user= : ID akun dengan nomor WhatsApp terverifikasi} {--reason= : Alasan provisioning} {--apply : Terapkan hasil setelah pemeriksaan}';

    protected $description = 'Siapkan admin pertama universitas. Tanpa --apply hanya dry run';

    public function handle(ProvisionFirstUniversityAdmin $provision): int
    {
        $userId = $this->option('user');
        $reason = $this->option('reason');
        if (! is_string($userId) || preg_match('/^[1-9][0-9]*$/D', $userId) !== 1
            || filter_var($userId, FILTER_VALIDATE_INT) === false || ! is_string($reason)) {
            $this->error('Tentukan --user berupa ID akun dan --reason secara eksplisit.');

            return self::FAILURE;
        }

        try {
            $result = $provision->handle((int) $userId, $reason, (bool) $this->option('apply'));
            $this->info(match ($result['status']) {
                'created' => 'Admin pertama tersimpan beserta audit provisioning.',
                'already_admin' => 'Akun sudah mempunyai akses admin. Tidak ada perubahan atau audit ganda.',
                default => 'Dry run lulus. Tidak ada perubahan; gunakan --apply untuk menerapkan.',
            });

            return self::SUCCESS;
        } catch (InvalidUniversityConfiguration|UniversityProvisioningConflict $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }
    }
}
