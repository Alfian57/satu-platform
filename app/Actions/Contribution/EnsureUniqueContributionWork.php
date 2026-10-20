<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class EnsureUniqueContributionWork
{
    public function handle(
        Project $project,
        int $ownerId,
        int $taskId,
        string $claim,
        string $summary,
        ?int $exceptId = null,
        bool $approvedOnly = false,
    ): void {
        $candidates = Contribution::query()
            ->whereBelongsTo($project)
            ->where('institution_id', $project->institution_id)
            ->where('owner_id', $ownerId)
            ->when($exceptId !== null, fn (Builder $query) => $query->whereKeyNot($exceptId))
            ->whereHas('currentVersion', fn (Builder $query) => $query->where('task_id', $taskId))
            ->where(function (Builder $query) use ($approvedOnly): void {
                $query->whereIn('status', $approvedOnly
                    ? [ContributionStatus::Approved]
                    : [ContributionStatus::Draft, ContributionStatus::Pending, ContributionStatus::Revision, ContributionStatus::Approved]);
                $query->orWhere(function (Builder $archived): void {
                    $archived->where('status', ContributionStatus::Archived)
                        ->whereHas('currentVersion.reviews', fn (Builder $reviews) => $reviews->where('decision', ContributionReviewDecision::Approved));
                });
            })
            ->with('currentVersion:id,claim,summary')
            ->get();

        foreach ($candidates as $candidate) {
            $version = $candidate->currentVersion;

            if ($version instanceof ContributionVersion
                && $this->normalize($version->claim) === $this->normalize($claim)
                && $this->normalize($version->summary) === $this->normalize($summary)) {
                throw ValidationException::withMessages([
                    'claim' => 'Pekerjaan yang sama pada tugas ini sudah dicatat. Gunakan atau perbaiki catatan sebelumnya, bukan membuat pengajuan ganda.',
                ]);
            }
        }
    }

    private function normalize(string $value): string
    {
        return Str::of($value)->squish()->lower()->toString();
    }
}
