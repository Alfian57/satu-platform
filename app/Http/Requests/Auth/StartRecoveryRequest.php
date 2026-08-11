<?php

namespace App\Http\Requests\Auth;

use App\Support\PhoneIdentity;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Throwable;

class StartRecoveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');

        if (! is_string($phone) || $phone === '') {
            return;
        }

        try {
            $this->merge(['phone' => PhoneIdentity::normalize($phone)]);
        } catch (Throwable) {
            // The E.164 rule supplies the field-level recovery message.
        }
    }
}
