<?php

namespace App\Http\Requests\Institution;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class SuspendInstitutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->is_platform_admin;
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
