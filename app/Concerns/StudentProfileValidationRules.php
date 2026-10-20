<?php

namespace App\Concerns;

use App\Models\StudentProfile;
use App\Rules\ProfileEvidenceUrl;
use Illuminate\Database\Query\Builder;
use Illuminate\Validation\Rule;

trait StudentProfileValidationRules
{
    /**
     * @return array<string, array<int, mixed>>
     */
    protected function studentProfileRules(): array
    {
        /** @var array<string, list<string>> $faculties */
        $faculties = config('university.faculties', []);
        $profile = $this->route('studentProfile');
        $profile = $profile instanceof StudentProfile ? $profile : null;
        $facultyInput = $this->input('faculty', $profile?->faculty);
        $programInput = $this->input('study_program', $profile?->study_program);
        $faculty = is_string($facultyInput) ? $facultyInput : '';
        $program = is_string($programInput) ? $programInput : '';
        $programs = $faculties[$faculty] ?? [];
        $facultyNames = array_keys($faculties);
        $academicTouched = $this->exists('faculty') || $this->exists('study_program');
        $unchangedLegacy = $profile !== null
            && $faculty === ($profile->faculty ?? '')
            && $program === ($profile->study_program ?? '')
            && ! in_array($program, $programs, true);
        if ($unchangedLegacy) {
            $programs[] = $program;
            $facultyNames[] = $faculty;
        }

        return [
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'faculty' => ['nullable', 'string', 'max:255', Rule::requiredIf($academicTouched && $program !== '' && ! $unchangedLegacy), Rule::in($facultyNames)],
            'study_program' => ['nullable', 'string', 'max:255', Rule::requiredIf($academicTouched && $faculty !== '' && ! $unchangedLegacy), Rule::in($programs)],
            'admission_year' => ['sometimes', 'nullable', 'integer', 'digits:4', 'between:1900,'.now()->year],
            'study_year' => ['sometimes', 'nullable', 'integer', 'between:1,10'],
            'skills' => ['sometimes', 'array', 'max:30'],
            'skills.*' => ['array:taxonomy_id,proficiency,evidence_metadata'],
            'skills.*.taxonomy_id' => [
                'required',
                'integer',
                'distinct',
                $this->verifiedSkillTaxonomyRule(),
            ],
            'skills.*.proficiency' => ['required', 'string', Rule::in([
                'beginner',
                'intermediate',
                'advanced',
                'expert',
            ])],
            'skills.*.evidence_metadata' => ['sometimes', 'nullable', 'array', 'list', 'max:10'],
            'skills.*.evidence_metadata.*' => ['array:title,url'],
            'skills.*.evidence_metadata.*.title' => ['required', 'string', 'max:120'],
            'skills.*.evidence_metadata.*.url' => ['bail', 'required', 'string', 'max:2048', 'url:https', new ProfileEvidenceUrl],
            'interests' => ['sometimes', 'array', 'max:20'],
            'interests.*' => [
                'integer',
                'distinct',
                $this->verifiedInterestTaxonomyRule(),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'faculty.in' => 'Pilih fakultas dari daftar yang tersedia.',
            'faculty.required' => 'Pilih fakultas untuk program studi ini.',
            'study_program.in' => 'Pilih program studi yang sesuai dengan fakultas.',
            'study_program.required' => 'Pilih program studi pada fakultas yang dipilih.',
            'admission_year.integer' => 'Angkatan masuk harus berupa tahun empat digit, misalnya 2023.',
            'admission_year.digits' => 'Angkatan masuk harus berupa tahun empat digit, misalnya 2023.',
            'admission_year.between' => 'Angkatan masuk harus antara 1900 dan tahun berjalan.',
        ];
    }

    private function verifiedSkillTaxonomyRule(): mixed
    {
        return Rule::exists('skill_taxonomies', 'id')->where(
            fn (Builder $query): Builder => $query
                ->where('is_verified', true)
                ->where('category', '!=', 'interest'),
        );
    }

    private function verifiedInterestTaxonomyRule(): mixed
    {
        return Rule::exists('skill_taxonomies', 'id')->where(
            fn (Builder $query): Builder => $query
                ->where('is_verified', true)
                ->where('category', 'interest'),
        );
    }
}
