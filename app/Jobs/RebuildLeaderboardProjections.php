<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Gamification\RebuildLeaderboardProjections as RebuildLeaderboardProjectionsAction;
use App\Models\Institution;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class RebuildLeaderboardProjections implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 120;

    public int $uniqueFor = 3600;

    /**
     * @var array<int>
     */
    public array $backoff = [60, 300, 900, 1800, 3600];

    public function __construct(
        public readonly int $institutionId,
        public readonly string $semester,
    ) {}

    public function uniqueId(): string
    {
        return $this->institutionId.':'.$this->semester;
    }

    public function handle(RebuildLeaderboardProjectionsAction $rebuild): void
    {
        $institution = Institution::query()->find($this->institutionId);

        if ($institution === null) {
            Log::warning('leaderboard.rebuild_skipped', [
                'institution_id' => $this->institutionId,
                'semester' => $this->semester,
                'reason' => 'institution_not_found',
            ]);

            return;
        }

        $rebuild->handle($institution, $this->semester);
    }

    public function failed(?Throwable $exception = null): void
    {
        Log::error('leaderboard.rebuild_failed', [
            'institution_id' => $this->institutionId,
            'semester' => $this->semester,
            'error_class' => $exception === null ? null : $exception::class,
            'error' => $exception?->getMessage(),
        ]);
    }
}
