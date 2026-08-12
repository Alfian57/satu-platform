<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class ReviseContributionRequest extends FormRequest
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
            'task_id' => [
                'sometimes',
                'integer',
                'min:1',
                Rule::exists((new Task)->getTable(), 'id')
                    ->where('project_id', $projectId),
            ],
            'claim' => ['sometimes', 'string', 'max:160'],
            'summary' => ['sometimes', 'string', 'max:5000'],
            'declaration' => ['sometimes', 'string', 'max:2000'],
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $fields = ['task_id', 'claim', 'summary', 'declaration', 'evidence'];

            $hasChange = collect($fields)->contains(
                fn (string $field): bool => $this->exists($field)
                    && $this->input($field) !== null
                    && $this->input($field) !== [],
            );

            if (! $hasChange) {
                $validator->errors()->add(
                    'revision',
                    'Setidaknya satu field kontribusi harus diisi untuk membuat revisi.',
                );
            }
        });
    }
}
