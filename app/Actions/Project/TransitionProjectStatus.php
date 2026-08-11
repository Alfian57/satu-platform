<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ProjectStatus;
use App\Exceptions\InvalidProjectTransition;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class TransitionProjectStatus
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        Project $project,
        ProjectStatus $targetStatus,
        ?int $occupiedCapacity = null,
        ?string $reason = null,
        ?string $operation = null,
        ?string $expectedUpdatedAt = null,
    ): Project {
        Gate::forUser($actor)->authorize('transition', $project);

        return DB::transaction(function () use (
            $actor,
            $project,
            $targetStatus,
            $occupiedCapacity,
            $reason,
            $operation,
            $expectedUpdatedAt,
        ): Project {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('transition', $lockedProject);
            $this->ensureFresh($lockedProject, $expectedUpdatedAt);

            if ($lockedProject->status === $targetStatus && $operation !== null) {
                throw new InvalidProjectTransition(
                    "Project is already in {$targetStatus->value} status.",
                );
            }

            if (! $lockedProject->status->canTransitionTo($targetStatus)) {
                throw new InvalidProjectTransition(
                    "Project cannot transition from {$lockedProject->status->value} to {$targetStatus->value}.",
                );
            }

            if ($targetStatus->isActive() && ! $lockedProject->deadline->isFuture()) {
                throw ValidationException::withMessages([
                    'deadline' => 'Project dengan deadline yang sudah lewat tidak dapat dibuka.',
                ]);
            }

            $this->validateCapacity($lockedProject, $targetStatus, $occupiedCapacity);

            if ($lockedProject->status !== $targetStatus) {
                $before = $this->summary($lockedProject);
                $lockedProject->forceFill(['status' => $targetStatus])->save();

                $this->audit->record(
                    operation: $operation ?? 'project.status_changed',
                    auditable: $lockedProject,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($lockedProject->institution_id),
                    before: $before,
                    after: $this->summary($lockedProject),
                    reason: $reason,
                );
            }

            return $lockedProject->refresh();
        }, attempts: 3);
    }

    /**
     * @return array{project_id: int, status: string}
     */
    private function summary(Project $project): array
    {
        return [
            'project_id' => $project->getKey(),
            'status' => $project->status->value,
        ];
    }

    private function validateCapacity(
        Project $project,
        ProjectStatus $targetStatus,
        ?int $occupiedCapacity,
    ): void {
        if ($occupiedCapacity === null) {
            return;
        }

        if ($occupiedCapacity < 0 || $occupiedCapacity > $project->capacity) {
            throw ValidationException::withMessages([
                'capacity' => 'Jumlah anggota tidak boleh melebihi kapasitas project.',
            ]);
        }

        $message = match ($targetStatus) {
            ProjectStatus::Open => $occupiedCapacity === 0
                ? null
                : 'Project hanya dapat berstatus open sebelum ada anggota.',
            ProjectStatus::Forming => $occupiedCapacity > 0 && $occupiedCapacity < $project->capacity
                ? null
                : 'Project forming harus memiliki anggota dan slot yang masih tersedia.',
            ProjectStatus::Full => $occupiedCapacity === $project->capacity
                ? null
                : 'Project full harus memenuhi seluruh kapasitas.',
            ProjectStatus::Draft, ProjectStatus::Closed, ProjectStatus::Cancelled, ProjectStatus::Archived => null,
        };

        if ($message !== null) {
            throw ValidationException::withMessages(['status' => $message]);
        }
    }

    private function ensureFresh(Project $project, ?string $expectedUpdatedAt): void
    {
        if ($expectedUpdatedAt === null || $expectedUpdatedAt === '') {
            return;
        }

        if ($project->updated_at->equalTo(Carbon::parse($expectedUpdatedAt))) {
            return;
        }

        throw new ConflictHttpException(
            'Project ini sudah berubah di sesi lain. Muat data terbaru sebelum mengubah lifecycle.',
        );
    }
}
