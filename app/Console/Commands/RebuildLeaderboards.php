<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\RebuildLeaderboardProjections;
use App\Models\InstitutionRoster;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

#[Signature('gamification:rebuild-leaderboards {--institution= : Institution ID} {--semester= : Semester yang akan dihitung}')]
#[Description('Dispatch tenant-scoped leaderboard projection rebuild jobs')]
final class RebuildLeaderboards extends Command
{
    public function handle(): int
    {
        $query = InstitutionRoster::query()
            ->active()
            ->with('institution')
            ->orderBy('institution_id')
            ->orderBy('semester');

        if ($institutionId = $this->option('institution')) {
            $query->where('institution_id', (int) $institutionId);
        }

        if ($semester = $this->option('semester')) {
            $query->where('semester', (string) $semester);
        }

        /** @var Collection<int, InstitutionRoster> $rosters */
        $rosters = $query->get();
        $dispatched = [];

        foreach ($rosters as $roster) {
            if ($roster->institution === null) {
                continue;
            }

            $key = $roster->institution_id.':'.$roster->semester;

            if (isset($dispatched[$key])) {
                continue;
            }

            RebuildLeaderboardProjections::dispatch(
                $roster->institution_id,
                $roster->semester,
            );
            $dispatched[$key] = true;
        }

        $this->info(sprintf(
            'Dispatched %d leaderboard rebuild job(s).',
            count($dispatched),
        ));

        return self::SUCCESS;
    }
}
