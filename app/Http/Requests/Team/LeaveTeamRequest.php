<?php

declare(strict_types=1);

namespace App\Http\Requests\Team;

use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class LeaveTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $membership = $this->route('teamMembership');

        return $user instanceof User
            && $membership instanceof TeamMembership
            && Gate::forUser($user)->allows('leave', $membership);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
