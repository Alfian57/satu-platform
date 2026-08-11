<?php

namespace App\Http\Requests\Affiliations;

use App\Enums\AffiliationMatchResult;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ListAffiliationReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $institution = $this->route('institution');

        return $institution instanceof Institution
            && $this->user() !== null
            && Gate::forUser($this->user())->allows(
                'viewAny',
                [AffiliationRequest::class, $institution],
            );
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'match' => ['nullable', Rule::enum(AffiliationMatchResult::class)],
            'stale' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['oldest', 'newest'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function matchResult(): ?AffiliationMatchResult
    {
        return AffiliationMatchResult::tryFrom((string) $this->validated('match', ''));
    }

    public function stale(): ?bool
    {
        return $this->has('stale') ? $this->boolean('stale') : null;
    }

    public function sort(): string
    {
        return (string) $this->validated('sort', 'oldest');
    }
}
