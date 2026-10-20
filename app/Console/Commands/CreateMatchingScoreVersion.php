<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Matching\CreateMatchScoreVersion;
use App\Models\MatchScoreVersion;
use App\Models\User;
use App\Support\Matching\MatchingAvailability;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;
use JsonException;

final class CreateMatchingScoreVersion extends Command
{
    protected $signature = 'matching:create-score-version {--actor= : ID Admin Universitas} {--score-version= : Identifier versi baru} {--weights= : JSON empat bobot eksplisit} {--activate : Aktifkan setelah persetujuan kebijakan}';

    protected $description = 'Buat versi immutable kebijakan v2 tanpa mengubah bobot/versi existing';

    public function handle(CreateMatchScoreVersion $create): int
    {
        $actorId = $this->option('actor');
        $version = $this->option('score-version');
        $weightsJson = $this->option('weights');
        if (! is_string($actorId) || ! ctype_digit($actorId) || ! is_string($version) || ! is_string($weightsJson)) {
            $this->error('Tentukan --actor, --score-version dan --weights secara eksplisit.');

            return self::FAILURE;
        }
        $actor = User::query()->find((int) $actorId);
        if ($actor === null || Gate::forUser($actor)->denies('create', MatchScoreVersion::class)) {
            $this->error('Admin berwenang diperlukan.');

            return self::FAILURE;
        }
        try {
            $weights = json_decode($weightsJson, true, flags: JSON_THROW_ON_ERROR);
            if (! is_array($weights)) {
                throw new InvalidArgumentException('Bobot harus berupa object JSON.');
            }
            $created = $create->execute($actor, $version, $weights, ['availability_target_minutes' => 1, 'connectivity_cap' => 1, 'policy' => MatchingAvailability::POLICY], $this->option('activate') ? now() : null, 'Kebijakan v2: jadwal yang belum diketahui dan konektivitas netral. Angka parameter legacy tidak dipakai pada dimensi netral. Aktivasi tetap mengikuti gate produk dan privacy.');
            $this->info('Versi tersimpan: '.$created->version.'. Versi sebelumnya tidak diubah.');

            return self::SUCCESS;
        } catch (InvalidArgumentException|JsonException $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }
    }
}
