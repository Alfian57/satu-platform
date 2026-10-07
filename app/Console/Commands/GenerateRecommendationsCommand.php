<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Matching\GenerateRecommendationsForProject;
use App\Enums\ProjectStatus;
use App\Models\Institution;
use App\Models\Project;
use Illuminate\Console\Command;

/**
 * Batch-generate matching recommendations for all open projects in an institution.
 *
 * Run this command on a schedule (e.g., nightly) to keep recommendations fresh.
 * Usage:
 *   php artisan matching:generate-recommendations
 *   php artisan matching:generate-recommendations --institution=1
 */
final class GenerateRecommendationsCommand extends Command
{
    protected $signature = 'matching:generate-recommendations
                            {--institution= : Limit to a specific institution ID}';

    protected $description = 'Generate matching recommendations for open projects.';

    public function handle(GenerateRecommendationsForProject $generateForProject): int
    {
        $query = Project::query()
            ->whereIn('status', [ProjectStatus::Open->value, ProjectStatus::Forming->value]);

        if ($this->option('institution') !== null) {
            $institutionId = (int) $this->option('institution');

            if (! Institution::query()->whereKey($institutionId)->exists()) {
                $this->error("Institution ID {$institutionId} tidak ditemukan.");

                return self::FAILURE;
            }

            $query->where('institution_id', $institutionId);
        }

        $projects = $query->get();
        $total = 0;

        $this->withProgressBar($projects, function (Project $project) use ($generateForProject, &$total): void {
            $total += $generateForProject->handle($project);
        });

        $this->newLine();
        $this->info("Rekomendasi dihasilkan: {$total} untuk {$projects->count()} project.");

        return self::SUCCESS;
    }
}
