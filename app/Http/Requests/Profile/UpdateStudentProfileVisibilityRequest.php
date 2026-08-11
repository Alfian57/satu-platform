<?php

namespace App\Http\Requests\Profile;

use App\Enums\PortfolioVisibility;
use App\Models\StudentProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStudentProfileVisibilityRequest extends FormRequest
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
            'portfolio_visibility' => [
                'sometimes',
                Rule::enum(PortfolioVisibility::class),
            ],
            'recruiter_discoverable' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('portfolio_visibility') && ! $this->has('recruiter_discoverable')) {
                $validator->errors()->add(
                    'profile_visibility',
                    'Kirim setidaknya satu pengaturan visibility profile.',
                );
            }
        });
    }
}
