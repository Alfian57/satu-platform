<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Validation\ValidationException;

final class ContributionRequirements
{
    public function claim(mixed $value): string
    {
        return $this->requiredText($value, 'claim', 160);
    }

    public function summary(mixed $value): string
    {
        return $this->requiredText($value, 'summary', 5000);
    }

    public function declaration(mixed $value): string
    {
        return $this->requiredText($value, 'declaration', 2000);
    }

    public function taskId(mixed $value, Project $project): int
    {
        $taskId = $value instanceof Task
            ? $value->getKey()
            : $this->positiveInteger($value, 'task_id');

        $task = Task::query()
            ->whereKey($taskId)
            ->whereBelongsTo($project)
            ->first();

        if ($task === null) {
            throw ValidationException::withMessages([
                'task_id' => 'Task harus berasal dari project yang sama.',
            ]);
        }

        return (int) $task->getKey();
    }

    /**
     * @return list<int>
     */
    public function evidenceIds(mixed $value, Project $project): array
    {
        if ($value === null) {
            return [];
        }

        if (! is_array($value) || ! array_is_list($value)) {
            throw ValidationException::withMessages([
                'evidence' => 'Evidence harus berupa daftar attachment.',
            ]);
        }

        if (count($value) > 20) {
            throw ValidationException::withMessages([
                'evidence' => 'Maksimal 20 evidence dapat dilampirkan.',
            ]);
        }

        $ids = [];

        foreach ($value as $index => $item) {
            $id = $item instanceof Attachment
                ? $item->getKey()
                : $this->positiveInteger($item, "evidence.{$index}");

            if (in_array($id, $ids, true)) {
                throw ValidationException::withMessages([
                    "evidence.{$index}" => 'Attachment evidence tidak boleh duplikat.',
                ]);
            }

            $ids[] = $id;
        }

        $attachments = Attachment::query()
            ->whereIn('id', $ids)
            ->whereBelongsTo($project)
            ->where('purpose', AttachmentPurpose::Evidence)
            ->get()
            ->keyBy(fn (Attachment $attachment): int => $attachment->getKey());

        foreach ($ids as $index => $id) {
            if (! $attachments->has($id)) {
                throw ValidationException::withMessages([
                    "evidence.{$index}" => 'Evidence harus berasal dari project dan purpose evidence.',
                ]);
            }
        }

        return array_map(static fn (int|string $id): int => (int) $id, $ids);
    }

    private function requiredText(mixed $value, string $field, int $maxLength): string
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

    private function positiveInteger(mixed $value, string $field): int
    {
        $isInteger = is_int($value)
            || (is_string($value) && preg_match('/^\d+$/D', $value) === 1);

        if (! $isInteger || (int) $value < 1) {
            throw ValidationException::withMessages([
                $field => 'Nilai harus berupa ID yang valid.',
            ]);
        }

        return (int) $value;
    }
}
