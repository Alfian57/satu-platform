<?php

namespace App\Http\Requests\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ProjectTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('transition', $project);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'occupied_capacity' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
