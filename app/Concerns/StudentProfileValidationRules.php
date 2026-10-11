<?php

namespace App\Concerns;

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
        return [
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'study_program' => ['sometimes', 'nullable', 'string', 'max:255'],
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
