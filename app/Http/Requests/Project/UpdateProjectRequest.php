<?php

namespace App\Http\Requests\Project;

use App\Enums\ProjectVisibility;
use App\Enums\SkillProficiency;
use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('update', $project);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'visibility' => ['sometimes', Rule::enum(ProjectVisibility::class)],
            'capacity' => ['sometimes', 'integer', 'between:1,20'],
            'deadline' => ['sometimes', 'date', 'after:now'],
            'roles' => ['sometimes', 'array', 'min:1', 'max:20'],
            'roles.*.title' => ['required', 'string', 'max:120'],
            'roles.*.description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'roles.*.capacity' => ['required', 'integer', 'between:1,20'],
            'roles.*.skills' => ['sometimes', 'array'],
            'roles.*.skills.*.taxonomy_id' => [
                'required',
                'integer',
                Rule::exists('skill_taxonomies', 'id'),
            ],
            'roles.*.skills.*.proficiency' => [
                'sometimes',
                Rule::enum(SkillProficiency::class),
            ],
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $fields = ['title', 'description', 'visibility', 'capacity', 'deadline', 'roles'];

            if (collect($fields)->every(fn (string $field): bool => ! $this->exists($field))) {
                $validator->errors()->add('project', 'Setidaknya satu field project harus diubah.');
            }
        });
    }
}
