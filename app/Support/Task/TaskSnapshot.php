<?php

declare(strict_types=1);

namespace App\Support\Task;

use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class TaskSnapshot
{
    public static function revision(Task $task): string
    {
        $task->loadMissing('assignments');

        return hash('sha256', json_encode([
            $task->getKey(), $task->project_id, $task->title, $task->description,
            $task->status->value, $task->priority->value,
            $task->due_at?->toIso8601String(), $task->updated_at->toIso8601String(),
            $task->assignments->sortBy('id')->map(
                static fn (TaskAssignment $assignment): array => [$assignment->getKey(), $assignment->user_id],
            )->values()->all(),
        ], JSON_THROW_ON_ERROR));
    }

    public static function ensureFresh(Task $task, mixed $expectedRevision): void
    {
        if (! is_string($expectedRevision) || preg_match('/^[a-f0-9]{64}$/D', $expectedRevision) !== 1) {
            throw ValidationException::withMessages(['expected_revision' => 'Periksa versi tugas sebelum melanjutkan.']);
        }

        if (! hash_equals(self::revision($task), $expectedRevision)) {
            throw new ConflictHttpException('Tugas atau penanggung jawab sudah berubah. Periksa data terbaru sebelum melanjutkan.');
        }
    }
}
