<?php

declare(strict_types=1);

namespace App\Support\Discussion;

use App\Models\Attachment;
use App\Models\Message;
use App\Support\Attachment\AttachmentSerializer;
use Illuminate\Pagination\LengthAwarePaginator;

final class DiscussionSerializer
{
    public function __construct(
        private readonly AttachmentSerializer $attachmentSerializer,
    ) {}

    /**
     * @param  LengthAwarePaginator<int, Message>  $paginator
     * @return array<string, mixed>
     */
    public function page(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => array_map(
                fn (Message $message): array => $this->message($message),
                $paginator->items(),
            ),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function message(Message $message): array
    {
        $message->loadMissing([
            'author:id,name',
            'attachments.uploadedBy:id,name',
        ]);

        return [
            'id' => $message->getKey(),
            'body' => $message->body,
            'author' => [
                'id' => $message->author->getKey(),
                'name' => $message->author->name,
            ],
            'attachments' => $message->attachments
                ->map(fn (Attachment $attachment): array => $this->attachmentSerializer->attachment($attachment))
                ->values()
                ->all(),
            'is_edited' => $message->updated_at->greaterThan($message->created_at),
            'created_at' => $message->created_at->toIso8601String(),
            'updated_at' => $message->updated_at->toIso8601String(),
        ];
    }
}
