<?php

declare(strict_types=1);

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $task = $this->route('task');

        return $user instanceof User
            && $task instanceof Task
            && Gate::forUser($user)->allows('update', $task);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
