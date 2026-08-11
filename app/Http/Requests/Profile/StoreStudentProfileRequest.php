<?php

namespace App\Http\Requests\Profile;

use App\Concerns\StudentProfileValidationRules;
use App\Enums\InstitutionStatus;
use App\Enums\PortfolioVisibility;
use App\Models\Institution;
use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreStudentProfileRequest extends FormRequest
{
    use StudentProfileValidationRules;

    public function authorize(): bool
    {
        $user = $this->user();
        $institution = Institution::query()->find($this->input('institution_id'));

        return $user !== null
            && $institution instanceof Institution
            && Gate::forUser($user)->allows(
                'create',
                [StudentProfile::class, $institution],
            );
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
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
            'portfolio_visibility' => [
                'sometimes',
                Rule::enum(PortfolioVisibility::class),
            ],
            'recruiter_discoverable' => ['sometimes', 'boolean'],
            'availability_windows' => ['sometimes', 'array', 'max:14'],
            'availability_windows.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'availability_windows.*.starts_at' => ['required', 'date_format:H:i,H:i:s'],
            'availability_windows.*.ends_at' => ['required', 'date_format:H:i,H:i:s'],
            'availability_windows.*.timezone' => ['sometimes', 'timezone'],
            'timezone' => ['sometimes', 'nullable', 'timezone'],
        ], $this->studentProfileRules());
    }
}
