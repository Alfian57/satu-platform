<?php

declare(strict_types=1);

namespace App\Http\Requests\Campus;

use App\Enums\InclusionHumanConclusion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInclusionReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'human_conclusion' => ['required', 'string', Rule::enum(InclusionHumanConclusion::class)],
            'support_action' => ['nullable', 'string', 'max:255'],
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
