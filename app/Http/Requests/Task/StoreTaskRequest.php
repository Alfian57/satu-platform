<?php

declare(strict_types=1);

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('create', [Task::class, $project]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'due_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
