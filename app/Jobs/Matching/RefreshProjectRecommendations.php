<?php

declare(strict_types=1);

namespace App\Jobs\Matching;

use App\Actions\Matching\GenerateRecommendationsForProject;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RefreshProjectRecommendations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public readonly int $projectId,
    ) {}

    public function handle(GenerateRecommendationsForProject $generateForProject): void
    {
        $project = Project::find($this->projectId);

        if ($project === null) {
            return;
        }

        $generateForProject->handle($project);
    }
}
