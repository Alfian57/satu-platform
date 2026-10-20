<?php

namespace App\Http\Requests\Institution;

use Illuminate\Foundation\Http\FormRequest;

final class ApproveInstitutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
