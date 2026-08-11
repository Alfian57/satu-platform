<?php

namespace App\Http\Requests\Auth;

use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Throwable;

class StartRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'max:255',
                Rule::unique(User::class, 'username'),
            ],
            'phone' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
            'password' => ['required', 'string', Password::default(), 'confirmed'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => trim(strtolower((string) $this->input('username'))),
        ]);

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $phone = $this->input('phone');

            if (
                is_string($phone)
                && preg_match('/^\+\d{10,15}$/', $phone) === 1
                && PhoneNumber::query()->where('number_hash', PhoneIdentity::hash($phone))->exists()
            ) {
                $validator->errors()->add(
                    'phone',
                    'Nomor WhatsApp ini sudah memiliki akun atau proses verifikasi.',
                );
            }
        });
    }
}
