<?php

declare(strict_types=1);

namespace App\Http\Requests\Discussion;

use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Discussion\DiscussionFilters;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class IndexDiscussionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user instanceof User
            && $project instanceof Project
            && Gate::forUser($user)->allows('viewAny', [Message::class, $project]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function filters(): DiscussionFilters
    {
        return DiscussionFilters::fromValidated($this->validated());
    }
}
