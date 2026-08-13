<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class StoreContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('create', [Contribution::class, $project]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $project = $this->route('project');
        $projectId = $project instanceof Project ? $project->getKey() : 0;

        return [
            'task_id' => [
                'required',
                'integer',
                'min:1',
                Rule::exists((new Task)->getTable(), 'id')
                    ->where('project_id', $projectId),
            ],
            'claim' => ['required', 'string', 'max:160'],
            'summary' => ['required', 'string', 'max:5000'],
            'declaration' => ['required', 'string', 'max:2000'],
            'evidence' => ['sometimes', 'array', 'max:20'],
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
