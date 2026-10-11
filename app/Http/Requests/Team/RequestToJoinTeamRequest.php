<?php

declare(strict_types=1);

namespace App\Http\Requests\Team;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
        $project = $this->route('project');

        return [
            'project_role_id' => ['sometimes', 'nullable', 'integer', Rule::exists('project_roles', 'id')->where('project_id', $project instanceof Project ? $project->getKey() : null)],
            'interest' => ['required', 'string', 'max:200'],
            'skills' => ['required', 'string', 'max:350'],
            'availability' => ['required', 'string', 'max:250'],
            'message' => ['prohibited'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['interest', 'skills', 'availability'] as $key) {
            if (is_string($this->input($key))) {
                $this->merge([$key => (string) Str::of($this->input($key))->squish()]);
            }
        }
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['interest.required' => 'Tuliskan minat yang ingin kamu bantu.', 'skills.required' => 'Tuliskan kemampuan relevan atau hal yang ingin dipelajari.', 'availability.required' => 'Tuliskan ketersediaan singkat.', 'interest.max' => 'Minat maksimal 200 karakter.', 'skills.max' => 'Kemampuan maksimal 350 karakter.', 'availability.max' => 'Ketersediaan maksimal 250 karakter.'];
    }
}
