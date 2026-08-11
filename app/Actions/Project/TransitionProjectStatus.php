<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Enums\ProjectStatus;
use App\Exceptions\InvalidProjectTransition;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class TransitionProjectStatus
{
    public function handle(
        User $actor,
        Project $project,
        ProjectStatus $targetStatus,
        ?int $occupiedCapacity = null,
    ): Project {
        Gate::forUser($actor)->authorize('transition', $project);

        return DB::transaction(function () use (
            $actor,
            $project,
            $targetStatus,
            $occupiedCapacity,
        ): Project {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('transition', $lockedProject);

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
                $lockedProject->forceFill(['status' => $targetStatus])->save();
            }

            return $lockedProject->refresh();
        }, attempts: 3);
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
            ProjectStatus::Closed, ProjectStatus::Cancelled => null,
        };

        if ($message !== null) {
            throw ValidationException::withMessages(['status' => $message]);
        }
    }
}
