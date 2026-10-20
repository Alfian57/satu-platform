<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Jobs\ReconcileApprovedContributionXp;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('gamification:reconcile-xp')]
#[Description('Pulihkan XP kontribusi approved yang belum tercatat pada universitas terkonfigurasi')]
final class ReconcileContributionXp extends Command
{
    public function handle(ResolveConfiguredUniversity $university): int
    {
        $institution = $university->handle();
        ReconcileApprovedContributionXp::dispatch($institution->getKey());
        $this->info('Rekonsiliasi XP diantrekan. Semester yang belum valid tetap menunggu.');

        return self::SUCCESS;
    }
}
