<?php

declare(strict_types=1);

namespace App\Jobs\Matching;

use App\Actions\Matching\GenerateRecommendationsForStudent;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RefreshStudentRecommendations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public readonly int $userId,
        public readonly int $institutionId,
    ) {}

    public function handle(GenerateRecommendationsForStudent $generateForStudent): void
    {
        $user = User::find($this->userId);
        $institution = Institution::find($this->institutionId);

        if ($user === null || $institution === null) {
            return;
        }

        $generateForStudent->handle($user, $institution);
    }
}
