<?php

declare(strict_types=1);

namespace App\Actions\Project;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ProjectStatus;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon as BaseCarbon;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class UpdateProject
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ProjectRequirements $requirements,
    ) {}

    /**
     * Update draft or open project metadata and, when supplied, its requirements.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Project $project, array $data): Project
    {
        Gate::forUser($actor)->authorize('update', $project);

        return DB::transaction(function () use ($actor, $project, $data): Project {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('update', $lockedProject);

            if (! in_array($lockedProject->status, [ProjectStatus::Draft, ProjectStatus::Open], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Project hanya dapat diubah saat berstatus draft atau open.',
                ]);
            }

            $this->ensureFresh($lockedProject, $data['expected_updated_at'] ?? null);

            $before = $this->summary($lockedProject);
            $capacity = array_key_exists('capacity', $data)
                ? $this->requirements->boundedInteger($data['capacity'], 'capacity', 1, 20)
                : $lockedProject->capacity;
            $roles = array_key_exists('roles', $data)
                ? $this->requirements->normalizeAndValidate($data['roles'], $capacity)
                : null;

            if (
                $roles === null
                && array_key_exists('capacity', $data)
                && $lockedProject->roles()->sum('capacity') > $capacity
            ) {
                throw ValidationException::withMessages([
                    'capacity' => 'Kapasitas project tidak boleh lebih kecil dari total kapasitas role yang sudah ada.',
                ]);
            }

            $changedFields = [];

            if (array_key_exists('title', $data)) {
                $lockedProject->title = $this->requirements->requiredText($data['title'], 'title', 160);
                $changedFields[] = 'title';
            }

            if (array_key_exists('description', $data)) {
                $lockedProject->description = $this->requirements->nullableText(
                    $data['description'],
                    'description',
                    5000,
                );
                $changedFields[] = 'description';
            }

            if (array_key_exists('visibility', $data)) {
                $lockedProject->visibility = $this->requirements->visibility($data['visibility']);
                $changedFields[] = 'visibility';
            }

            if (array_key_exists('capacity', $data)) {
                $lockedProject->capacity = $capacity;
                $changedFields[] = 'capacity';
            }

            if (array_key_exists('deadline', $data)) {
                $lockedProject->deadline = Carbon::instance(
                    $this->requirements->futureDeadline($data['deadline']),
                );
                $changedFields[] = 'deadline';
            }

            if ($lockedProject->isDirty()) {
                $lockedProject->save();
            }

            if ($roles !== null) {
                $this->requirements->persist($lockedProject, $roles);
                $changedFields[] = 'roles';
            }

            $changedFields = array_values(array_unique($changedFields));

            if ($changedFields !== []) {
                $this->audit->record(
                    operation: 'project.updated',
                    auditable: $lockedProject,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($lockedProject->institution_id),
                    before: [...$before, 'fields' => $changedFields],
                    after: [...$this->summary($lockedProject), 'fields' => $changedFields],
                );
            }

            return $lockedProject->refresh()->load(['roles.skills.taxonomy']);
        }, attempts: 3);
    }

    private function ensureFresh(Project $project, mixed $expectedUpdatedAt): void
    {
        if ($expectedUpdatedAt === null || $expectedUpdatedAt === '') {
            return;
        }

        $expected = BaseCarbon::parse((string) $expectedUpdatedAt);

        if ($project->updated_at->equalTo($expected)) {
            return;
        }

        throw new ConflictHttpException(
            'Project ini sudah berubah di sesi lain. Muat data terbaru sebelum menyimpan kembali.',
        );
    }

    /**
     * @return array{project_id: int, status: string, title: string, capacity: int, deadline: string}
     */
    private function summary(Project $project): array
    {
        return [
            'project_id' => $project->getKey(),
            'status' => $project->status->value,
            'title' => $project->title,
            'capacity' => $project->capacity,
            'deadline' => $project->deadline->toIso8601String(),
        ];
    }
}
