<?php

namespace App\Http\Requests\Institution;

use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ChangeUniversityAdminStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $membership = $this->route('membership');

        return $membership instanceof InstitutionMembership && $this->user() instanceof User
            && $this->user()->can('manageAdmin', $membership);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:verified,suspended'],
            'expected_revision' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/'],
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
            'role' => ['prohibited'],
            'institution_id' => ['prohibited'],
        ];
    }
}
