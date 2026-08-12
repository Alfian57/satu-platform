<?php

declare(strict_types=1);

namespace App\Http\Requests\Team;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class RequestToJoinTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('requestJoin', $project);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_role_id' => ['sometimes', 'nullable', 'integer', 'exists:project_roles,id'],
            'message' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
