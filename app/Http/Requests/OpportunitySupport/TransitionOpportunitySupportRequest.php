<?php

namespace App\Http\Requests\OpportunitySupport;

use App\Models\OpportunitySupportRequest;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionOpportunitySupportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $supportRequest = $this->route('supportRequest');
        if (! $user instanceof User || ! $supportRequest instanceof OpportunitySupportRequest) {
            return false;
        }

        return $user->can(match ($this->input('action')) {
            'withdraw' => 'withdraw',
            'accept', 'decline' => 'respond',
            default => 'review',
        }, $supportRequest);
    }

    /** @return array<string, mixed> */
    public static function commandRules(): array
    {
        return [
            'action' => ['required', Rule::in(['offer', 'accept', 'decline', 'note', 'withdraw'])],
            'expected_revision' => ['required', 'integer', 'min:1'],
            'project_role_id' => ['required_if:action,offer', 'nullable', 'integer', 'min:1'],
            'reason' => ['required_if:action,offer,note', 'nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return self::commandRules();
    }
}
