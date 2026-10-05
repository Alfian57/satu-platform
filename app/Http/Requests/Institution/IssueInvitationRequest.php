<?php

declare(strict_types=1);

namespace App\Http\Requests\Institution;

use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Foundation\Http\FormRequest;
use Throwable;

final class IssueInvitationRequest extends FormRequest
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
            // The E.164 rule provides the field-level validation message.
        }
    }
}
