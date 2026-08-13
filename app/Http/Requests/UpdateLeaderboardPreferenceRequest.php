<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\LeaderboardScopeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateLeaderboardPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'is_opted_in' => ['required', 'boolean'],
            'semester' => ['nullable', 'string', 'max:100'],
            'scope' => [
                'nullable',
                'string',
                Rule::in(array_map(
                    static fn (LeaderboardScopeType $scope): string => $scope->value,
                    LeaderboardScopeType::cases(),
                )),
            ],
        ];
    }
}
