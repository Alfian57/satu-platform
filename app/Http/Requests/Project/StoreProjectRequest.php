<?php

namespace App\Http\Requests\Project;

use App\Enums\InstitutionStatus;
use App\Enums\ProjectVisibility;
use App\Enums\SkillProficiency;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $institution = Institution::query()->find($this->input('institution_id'));

        return $user instanceof User
            && $institution instanceof Institution
            && Gate::forUser($user)->allows('create', [Project::class, $institution]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'institution_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists('institutions', 'id')->where(
                    fn (Builder $query): Builder => $query->where(
                        'status',
                        InstitutionStatus::Active->value,
                    ),
                ),
            ],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'visibility' => ['required', Rule::enum(ProjectVisibility::class)],
            'capacity' => ['required', 'integer', 'between:1,20'],
            'deadline' => ['required', 'date', 'after:now'],
            'roles' => ['required', 'array', 'min:1', 'max:20'],
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
        ];
    }
}
