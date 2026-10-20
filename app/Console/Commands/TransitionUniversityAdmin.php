<?php

namespace App\Console\Commands;

use App\Actions\Institution\MapUniversityAdmin;
use Illuminate\Console\Command;
use Throwable;

final class TransitionUniversityAdmin extends Command
{
    protected $signature = 'university:transition-admin {--user= : ID akun lama yang dipilih secara eksplisit} {--reason= : Alasan pemetaan atau pemulihan} {--apply : Terapkan setelah dry run} {--rollback= : Referensi cadangan privat untuk pemulihan}';

    protected $description = 'Petakan akun admin lama ke UTY secara eksplisit, dengan cadangan terenkripsi dan audit';

    /**
     * Execute the console command.
     */
    public function handle(MapUniversityAdmin $map): int
    {
        $userId = $this->option('user');
        $receipt = $this->option('rollback');
        $reason = $this->option('reason');
        if (! is_string($reason) || ($userId !== null && $receipt !== null)
            || ($receipt === null && (! is_string($userId) || preg_match('/^[1-9][0-9]*$/D', $userId) !== 1 || filter_var($userId, FILTER_VALIDATE_INT) === false))) {
            $this->error('Tentukan --user atau --rollback (bukan keduanya), serta --reason. Default hanya dry run.');

            return self::FAILURE;
        }
        try {
            $result = is_string($receipt) ? $map->rollback($receipt, $reason, (bool) $this->option('apply'))
                : $map->handle((int) $userId, $reason, (bool) $this->option('apply'));
            $this->line(json_encode($result, JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        } catch (Throwable $error) {
            $this->error('Pemetaan ditolak. '.$error->getMessage());

            return self::FAILURE;
        }
    }
}
