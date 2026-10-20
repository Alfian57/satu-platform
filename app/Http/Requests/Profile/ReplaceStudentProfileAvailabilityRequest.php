<?php

namespace App\Http\Requests\Profile;

use App\Concerns\ProfileAvailabilityValidationRules;
use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ReplaceStudentProfileAvailabilityRequest extends FormRequest
{
    use ProfileAvailabilityValidationRules;

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
            ...$this->profileAvailabilityRules('windows', required: true),
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
            'expected_profile_revision' => ['sometimes', 'nullable', 'string', 'regex:/^[a-f0-9]{64}$/'],
        ];
    }
}
