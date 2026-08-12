<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Enums\TaskPriority;
use App\Models\Project;
use Carbon\CarbonInterface;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Throwable;

final class TaskRequirements
{
    public function requiredText(mixed $value, string $field, int $maxLength): string
    {
        if (! is_string($value)) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa teks.',
            ]);
        }

        $text = trim($value);

        if ($text === '' || mb_strlen($text) > $maxLength) {
            throw ValidationException::withMessages([
                $field => 'Teks wajib diisi dan tidak boleh melebihi batas karakter.',
            ]);
        }

        return $text;
    }

    public function nullableText(mixed $value, string $field, int $maxLength): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa teks.',
            ]);
        }

        $text = trim($value);

        if (mb_strlen($text) > $maxLength) {
            throw ValidationException::withMessages([
                $field => 'Teks melebihi batas karakter.',
            ]);
        }

        return $text === '' ? null : $text;
    }

    public function priority(mixed $value): TaskPriority
    {
        if ($value instanceof TaskPriority) {
            return $value;
        }

        $priority = TaskPriority::tryFrom((string) $value);

        if ($priority === null) {
            throw ValidationException::withMessages([
                'priority' => 'Priority task tidak valid.',
            ]);
        }

        return $priority;
    }

    public function dueAt(mixed $value, Project $project): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            $dueAt = $value instanceof CarbonInterface || $value instanceof DateTimeInterface
                ? Carbon::instance($value)
                : Carbon::parse((string) $value);
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'due_at' => 'Due date harus berupa tanggal dan waktu yang valid.',
            ]);
        }

        if ($dueAt->greaterThan($project->deadline)) {
            throw ValidationException::withMessages([
                'due_at' => 'Due date task tidak boleh melewati deadline project.',
            ]);
        }

        return $dueAt;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function hasDueAt(array $data): bool
    {
        return array_key_exists('due_at', $data) || array_key_exists('due_date', $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function dueAtInput(array $data): mixed
    {
        return array_key_exists('due_at', $data)
            ? $data['due_at']
            : ($data['due_date'] ?? null);
    }
}
