<?php

declare(strict_types=1);

namespace App\Http\Requests\Attachment;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Attachment\AttachmentRequirements;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('create', [Attachment::class, $project]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $project = $this->route('project');
        $projectId = $project instanceof Project ? $project->getKey() : 0;

        return [
            'file' => AttachmentRequirements::validationRules(),
            'purpose' => ['sometimes', Rule::enum(AttachmentPurpose::class)],
            'message_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists((new Message)->getTable(), 'id')
                    ->where('project_id', $projectId),
            ],
        ];
    }
}
