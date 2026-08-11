<?php

namespace App\Http\Requests\Profile;

use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ReplaceStudentProfileAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->route('studentProfile');

        return $this->user() !== null
            && $profile instanceof StudentProfile
            && Gate::forUser($this->user())->allows('update', $profile);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'windows' => ['present', 'array', 'max:14'],
            'windows.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'windows.*.starts_at' => ['required', 'date_format:H:i,H:i:s'],
            'windows.*.ends_at' => ['required', 'date_format:H:i,H:i:s'],
            'windows.*.timezone' => ['sometimes', 'timezone'],
            'timezone' => ['sometimes', 'timezone'],
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
