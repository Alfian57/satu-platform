<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Enums\ContributionReviewDecision;
use App\Models\Contribution;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class ReviewContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $contribution = $this->route('contribution');

        return $user instanceof User
            && $contribution instanceof Contribution
            && Gate::forUser($user)->allows('review', $contribution);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::enum(ContributionReviewDecision::class)],
            'expected_version' => ['required', 'integer', 'min:1'],
            'reason' => [
                'nullable',
                'string',
                'max:1000',
                Rule::requiredIf(fn (): bool => ContributionReviewDecision::tryFrom(
                    $this->string('decision')->toString(),
                )?->requiresReason() ?? false),
            ],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $decision = ContributionReviewDecision::tryFrom(
                    $this->string('decision')->toString(),
                );

                if (
                    $decision?->requiresReason()
                    && trim((string) $this->input('reason')) === ''
                ) {
                    $validator->errors()->add(
                        'reason',
                        'Alasan wajib diisi untuk request revision atau reject.',
                    );
                }
            },
        ];
    }
}
