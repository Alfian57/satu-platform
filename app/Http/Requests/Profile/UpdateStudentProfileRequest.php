<?php

namespace App\Http\Requests\Profile;

use App\Concerns\StudentProfileValidationRules;
use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateStudentProfileRequest extends FormRequest
{
    use StudentProfileValidationRules;

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
            ...$this->studentProfileRules(),
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
