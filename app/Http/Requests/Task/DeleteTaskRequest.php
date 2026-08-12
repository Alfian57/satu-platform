<?php

declare(strict_types=1);

namespace App\Http\Requests\Task;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class DeleteTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $task = $this->route('task');

        return $user instanceof User
            && $task instanceof Task
            && Gate::forUser($user)->allows('delete', $task);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [];
    }
}
