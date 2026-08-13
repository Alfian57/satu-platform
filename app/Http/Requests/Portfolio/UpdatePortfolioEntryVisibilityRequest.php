<?php

declare(strict_types=1);

namespace App\Http\Requests\Portfolio;

use App\Enums\PortfolioVisibility;
use App\Models\PortfolioEntry;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class UpdatePortfolioEntryVisibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $entry = $this->route('portfolioEntry');

        return $user instanceof User
            && $entry instanceof PortfolioEntry
            && Gate::forUser($user)->allows('update', $entry);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'visibility' => ['required', Rule::enum(PortfolioVisibility::class)],
            'expected_updated_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
