<?php

declare(strict_types=1);

namespace App\Http\Requests\Team;

use App\Models\TeamInvitation;
use App\Models\TeamJoinRequest;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class TeamDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $invitation = $this->route('teamInvitation');
        $joinRequest = $this->route('teamJoinRequest');

        if (! $user instanceof User) {
            return false;
        }

        $ability = match (true) {
            $this->routeIs('team.invitations.accept', 'team.join-requests.accept') => 'accept',
            $this->routeIs('team.invitations.revoke') => 'revoke',
            default => 'reject',
        };

        return $invitation instanceof TeamInvitation
            ? Gate::forUser($user)->allows($ability, $invitation)
            : $joinRequest instanceof TeamJoinRequest
                && Gate::forUser($user)->allows($ability, $joinRequest);
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
