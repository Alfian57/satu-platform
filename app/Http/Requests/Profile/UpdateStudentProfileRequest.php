<?php

namespace App\Http\Requests\Profile;

use App\Concerns\ProfileAvailabilityValidationRules;
use App\Concerns\StudentProfileValidationRules;
use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateStudentProfileRequest extends FormRequest
{
    use ProfileAvailabilityValidationRules;
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
            ...$this->profileAvailabilityRules(),
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
            'expected_profile_revision' => ['sometimes', 'nullable', 'string', 'regex:/^[a-f0-9]{64}$/'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $profile = $this->route('studentProfile');

            if (! $profile instanceof StudentProfile) {
                return;
            }

            foreach (['faculty', 'study_program', 'admission_year'] as $field) {
                if (! array_key_exists($field, $this->all()) || $validator->errors()->has($field)) {
                    continue;
                }

                $current = $this->normalizeAcademicValue($field, $profile->{$field});

                if (! $this->isAcademicValueSet($current)) {
                    continue;
                }

                $incoming = $this->normalizeAcademicValue($field, $this->input($field));

                if ($incoming !== $current) {
                    $validator->errors()->add($field, 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.');
                }
            }
        }];
    }

    private function normalizeAcademicValue(string $field, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if ($field === 'admission_year') {
            return is_numeric($value) ? (int) $value : $value;
        }

        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function isAcademicValueSet(mixed $value): bool
    {
        return $value !== null && $value !== '';
    }
}
