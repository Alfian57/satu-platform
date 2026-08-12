<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Attachment\DeleteAttachment;
use App\Actions\Attachment\UploadAttachment;
use App\Enums\AttachmentPurpose;
use App\Http\Requests\Attachment\DeleteAttachmentRequest;
use App\Http\Requests\Attachment\DownloadAttachmentRequest;
use App\Http\Requests\Attachment\StoreAttachmentRequest;
use App\Models\Attachment;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Attachment\AttachmentSerializer;
use App\Support\Attachment\AttachmentStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ProjectAttachmentController extends Controller
{
    public function store(
        StoreAttachmentRequest $request,
        Project $project,
        UploadAttachment $uploadAttachment,
        AttachmentSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'file' => 'File wajib diunggah.',
            ]);
        }

        $message = null;

        if (isset($data['message_id'])) {
            $message = Message::query()
                ->where('project_id', $project->getKey())
                ->whereKey($data['message_id'])
                ->firstOrFail();
        }

        $attachment = $uploadAttachment->handle(
            actor: $user,
            project: $project,
            file: $file,
            message: $message,
            purpose: AttachmentPurpose::from(
                (string) ($data['purpose'] ?? AttachmentPurpose::Attachment->value),
            ),
        );

        return response()->json(['data' => $serializer->attachment($attachment)], 201);
    }

    public function download(
        DownloadAttachmentRequest $request,
        Project $project,
        Attachment $attachment,
        AttachmentStorage $storage,
    ): StreamedResponse {
        if ($attachment->project_id !== $project->getKey()) {
            abort(404);
        }

        return $storage->download($attachment);
    }

    public function preview(
        DownloadAttachmentRequest $request,
        Project $project,
        Attachment $attachment,
        AttachmentStorage $storage,
    ): StreamedResponse {
        if ($attachment->project_id !== $project->getKey()) {
            abort(404);
        }

        return $storage->preview($attachment);
    }

    public function destroy(
        DeleteAttachmentRequest $request,
        Project $project,
        Attachment $attachment,
        DeleteAttachment $deleteAttachment,
    ): JsonResponse {
        if ($attachment->project_id !== $project->getKey()) {
            abort(404);
        }

        /** @var User $user */
        $user = $request->user();
        $attachmentId = $attachment->getKey();
        $deleteAttachment->handle($user, $attachment);

        return response()->json([
            'data' => [
                'deleted' => true,
                'attachment_id' => $attachmentId,
            ],
        ]);
    }
}
