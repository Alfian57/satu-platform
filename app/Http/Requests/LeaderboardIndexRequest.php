<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\LeaderboardScopeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class LeaderboardIndexRequest extends FormRequest
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
            'semester' => ['nullable', 'string', 'max:100'],
            'scope' => [
                'nullable',
                'string',
                Rule::in(array_map(
                    static fn (LeaderboardScopeType $scope): string => $scope->value,
                    LeaderboardScopeType::cases(),
                )),
            ],
            'page' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
