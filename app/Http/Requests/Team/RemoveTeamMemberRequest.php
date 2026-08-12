<?php

declare(strict_types=1);

namespace App\Http\Requests\Team;

use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class RemoveTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $membership = $this->route('teamMembership');

        return $user instanceof User
            && $membership instanceof TeamMembership
            && Gate::forUser($user)->allows('remove', $membership);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:1', 'max:1000'],
        ];
    }
}
