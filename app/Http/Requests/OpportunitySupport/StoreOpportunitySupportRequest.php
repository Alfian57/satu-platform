<?php

namespace App\Http\Requests\OpportunitySupport;

use App\Models\Institution;
use App\Models\OpportunitySupportRequest;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOpportunitySupportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $institution = $this->route('institution');

        return $user instanceof User && $institution instanceof Institution
            && $user->can('create', [OpportunitySupportRequest::class, $institution]);
    }

    /** @return array<string, mixed> */
    public static function commandRules(): array
    {
        return [
            'command_key' => ['required', 'uuid'],
            'need' => ['required', Rule::in(['find_role', 'beginner_path', 'application_help'])],
            'explanation' => ['nullable', 'string', 'max:1000'],
            'consent' => ['required', 'accepted'],
            'notice_version' => ['required', 'string', 'max:100'],
        ];
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return self::commandRules();
    }
}
