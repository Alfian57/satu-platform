<?php

declare(strict_types=1);

namespace App\Http\Requests\Attachment;

use App\Models\Attachment;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class DownloadAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $attachment = $this->route('attachment');

        return $user instanceof User
            && $attachment instanceof Attachment
            && Gate::forUser($user)->allows('view', $attachment);
    }

    /**
     * @return array<string, never>
     */
    public function rules(): array
    {
        return [];
    }
}
