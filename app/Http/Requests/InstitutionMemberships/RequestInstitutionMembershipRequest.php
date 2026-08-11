<?php

namespace App\Http\Requests\InstitutionMemberships;

use App\Enums\InstitutionStatus;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RequestInstitutionMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'institution_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists('institutions', 'id')
                    ->where(
                        fn (Builder $query): Builder => $query->where(
                            'status',
                            InstitutionStatus::Active->value,
                        ),
                    ),
            ],
            'nim' => ['bail', 'required', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'institution_id.required' => 'Pilih kampus sebelum mengirim permintaan.',
            'institution_id.integer' => 'Pilihan kampus tidak valid.',
            'institution_id.exists' => 'Kampus yang dipilih sedang tidak tersedia. Pilih kampus lain.',
            'nim.required' => 'Masukkan NIM yang terdaftar di kampus.',
            'nim.string' => 'NIM tidak valid.',
            'nim.max' => 'NIM maksimal 50 karakter.',
        ];
    }
}
