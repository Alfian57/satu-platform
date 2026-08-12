<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class LinkContributionEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $contribution = $this->route('contribution');

        return $user instanceof User
            && $contribution instanceof Contribution
            && Gate::forUser($user)->allows('update', $contribution);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $contribution = $this->route('contribution');
        $projectId = $contribution instanceof Contribution ? $contribution->project_id : 0;

        return [
            'evidence' => ['required', 'array', 'min:1', 'max:20'],
            'evidence.*' => [
                'integer',
                'distinct',
                'min:1',
                Rule::exists((new Attachment)->getTable(), 'id')
                    ->where('project_id', $projectId)
                    ->where('purpose', AttachmentPurpose::Evidence->value)
                    ->whereNull('deleted_at'),
            ],
        ];
    }
}
