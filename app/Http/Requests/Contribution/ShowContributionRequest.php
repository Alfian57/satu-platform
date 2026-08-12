<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Models\Contribution;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class ShowContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $contribution = $this->route('contribution');

        return $user instanceof User
            && $contribution instanceof Contribution
            && Gate::forUser($user)->allows('view', $contribution);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
