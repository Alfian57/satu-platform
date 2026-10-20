<?php

namespace App\Http\Requests\InstitutionMemberships;

use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Exceptions\InvalidUniversityConfiguration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RequestInstitutionMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(ResolveConfiguredUniversity $resolveUniversity): array
    {
        try {
            $universityId = $resolveUniversity->handle()->getKey();
        } catch (InvalidUniversityConfiguration) {
            throw ValidationException::withMessages([
                'institution_id' => 'Aktivasi kampus belum tersedia. Isian tetap aman. Hubungi pengelola SATU, lalu periksa status kembali.',
            ]);
        }

        /** @var array<string, list<string>> $faculties */
        $faculties = config('university.faculties', []);
        $facultyInput = $this->input('faculty');
        $faculty = is_string($facultyInput) ? $facultyInput : '';
        $programs = $faculties[$faculty] ?? [];

        return [
            'institution_id' => [
                'bail',
                'sometimes',
                'required',
                'integer',
                Rule::in([$universityId]),
            ],
            'nim' => ['bail', 'required', 'string', 'max:50'],
            'faculty' => [
                'required',
                'string',
                'max:255',
                Rule::in(array_keys($faculties)),
            ],
            'study_program' => [
                'required',
                'string',
                'max:255',
                Rule::in($programs),
            ],
            'admission_year' => [
                'required',
                'integer',
                'digits:4',
                'between:1900,'.now()->year,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'institution_id.required' => 'Konteks universitas tidak valid. Muat ulang status tanpa mengganti isian.',
            'institution_id.integer' => 'Konteks universitas tidak valid.',
            'institution_id.in' => 'Aktivasi hanya tersedia untuk universitas yang ditetapkan server.',
            'nim.required' => 'Masukkan NIM yang terdaftar di kampus.',
            'nim.string' => 'NIM tidak valid.',
            'nim.max' => 'NIM maksimal 50 karakter.',
            'faculty.in' => 'Pilih fakultas dari daftar yang tersedia.',
            'faculty.required' => 'Pilih fakultas untuk program studi ini.',
            'study_program.in' => 'Pilih program studi yang sesuai dengan fakultas.',
            'study_program.required' => 'Pilih program studi pada fakultas yang dipilih.',
            'admission_year.integer' => 'Angkatan masuk harus berupa tahun empat digit, misalnya 2023.',
            'admission_year.required' => 'Isi angkatan masuk, misalnya 2023.',
            'admission_year.digits' => 'Angkatan masuk harus berupa tahun empat digit, misalnya 2023.',
            'admission_year.between' => 'Angkatan masuk harus antara 1900 dan tahun berjalan.',
        ];
    }
}
