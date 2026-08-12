<?php

declare(strict_types=1);

namespace App\Support\Attachment;

use App\Models\Attachment;

final class AttachmentSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function attachment(Attachment $attachment): array
    {
        $attachment->loadMissing('uploadedBy:id,name');

        return [
            'id' => $attachment->getKey(),
            'purpose' => $attachment->purpose->value,
            'message_id' => $attachment->message_id,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
            'uploaded_by' => [
                'id' => $attachment->uploadedBy->getKey(),
                'name' => $attachment->uploadedBy->name,
            ],
            'created_at' => $attachment->created_at->toIso8601String(),
            'updated_at' => $attachment->updated_at->toIso8601String(),
        ];
    }
}
