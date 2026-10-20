<?php

namespace App\Http\Requests\Team;

use App\Models\TeamJoinRequest;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class WithdrawTeamJoinRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $request = $this->route('teamJoinRequest');

        return $user instanceof User && $request instanceof TeamJoinRequest && Gate::forUser($user)->allows('withdraw', $request);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'expected_revision' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/'],
        ];
    }
}
