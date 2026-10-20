<?php

declare(strict_types=1);

namespace App\Http\Requests\Institution;

use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class RevokeInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $invitation = $this->route('invitation');

        return $invitation instanceof PrivilegedInvitation && $this->user() instanceof User
            && $this->user()->can('revoke', $invitation);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
