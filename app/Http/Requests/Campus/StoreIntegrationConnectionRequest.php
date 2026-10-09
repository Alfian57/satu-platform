<?php

declare(strict_types=1);

namespace App\Http\Requests\Campus;

use App\Enums\IntegrationProviderMode;
use App\Models\IntegrationConnection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreIntegrationConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $institution = $this->route('institution');

        return Gate::allows('create', [IntegrationConnection::class, $institution]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'provider_key' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/i',
            ],
            'mode' => [
                'nullable',
                Rule::enum(IntegrationProviderMode::class),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'provider_key.required' => 'Kunci penyedia wajib diisi.',
            'provider_key.regex' => 'Kunci penyedia hanya boleh berisi huruf, angka, setrip, dan garis bawah.',
        ];
    }
}
