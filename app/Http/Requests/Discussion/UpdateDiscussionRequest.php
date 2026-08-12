<?php

declare(strict_types=1);

namespace App\Http\Requests\Discussion;

use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class UpdateDiscussionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $message = $this->route('message');

        return $user instanceof User
            && $message instanceof Message
            && Gate::forUser($user)->allows('update', $message);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
        ];
    }
}
