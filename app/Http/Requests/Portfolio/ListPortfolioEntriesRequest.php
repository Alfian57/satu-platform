<?php

declare(strict_types=1);

namespace App\Http\Requests\Portfolio;

use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class ListPortfolioEntriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $profile = $this->route('studentProfile');

        return $user instanceof User
            && $profile instanceof StudentProfile
            && Gate::forUser($user)->allows('viewAny', [PortfolioEntry::class, $profile]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
