<?php

declare(strict_types=1);

namespace App\Actions\Attachment;

use App\Actions\Audit\AuditRecorder;
use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Institution;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Attachment\AttachmentRequirements;
use App\Support\Attachment\AttachmentStorage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Throwable;

final class UploadAttachment
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly AttachmentStorage $storage,
    ) {}

    public function handle(
        User $actor,
        Project $project,
        UploadedFile $file,
        ?Message $message = null,
        AttachmentPurpose $purpose = AttachmentPurpose::Attachment,
    ): Attachment {
        Gate::forUser($actor)->authorize('create', [Attachment::class, $project]);
        AttachmentRequirements::validate($file);

        $checksum = AttachmentRequirements::checksum($file);
        $sizeBytes = AttachmentRequirements::sizeBytes($file);
        $mimeType = AttachmentRequirements::mimeType($file);
        $originalName = AttachmentRequirements::originalName($file);
        $storedPath = $this->storage->store($project, $file);

        try {
            return DB::transaction(function () use (
                $actor,
                $project,
                $message,
                $purpose,
                $checksum,
                $sizeBytes,
                $mimeType,
                $originalName,
                $storedPath,
            ): Attachment {
                $lockedProject = Project::query()
                    ->lockForUpdate()
                    ->whereKey($project->getKey())
                    ->firstOrFail();

                Gate::forUser($actor)->authorize('create', [Attachment::class, $lockedProject]);

                $lockedMessage = null;

                if ($message !== null) {
                    if (
                        ! $message->exists
                        || $message->isDirty([$message->getKeyName(), 'project_id'])
                    ) {
                        throw (new ModelNotFoundException)->setModel(Message::class, [$message->getKey()]);
                    }

                    $lockedMessage = Message::query()
                        ->where('project_id', $lockedProject->getKey())
                        ->whereKey($message->getKey())
                        ->lockForUpdate()
                        ->firstOrFail();
                }

                $duplicateQuery = Attachment::query()
                    ->forProject($lockedProject)
                    ->where('sha256', $checksum)
                    ->whereNull('deleted_at');

                if ($lockedMessage === null) {
                    $duplicateQuery->whereNull('message_id');
                } else {
                    $duplicateQuery->where('message_id', $lockedMessage->getKey());
                }

                if ($duplicateQuery->exists()) {
                    throw ValidationException::withMessages([
                        'file' => 'File yang sama sudah diunggah pada konteks ini.',
                    ]);
                }

                $attachment = Attachment::query()->forceCreate([
                    'project_id' => $lockedProject->getKey(),
                    'message_id' => $lockedMessage?->getKey(),
                    'uploaded_by_id' => $actor->getKey(),
                    'purpose' => $purpose->value,
                    'disk' => AttachmentStorage::DISK,
                    'path' => $storedPath,
                    'original_name' => $originalName,
                    'mime_type' => $mimeType,
                    'size_bytes' => $sizeBytes,
                    'sha256' => $checksum,
                    'deduplication_key' => AttachmentRequirements::deduplicationKey(
                        (int) $lockedProject->getKey(),
                        $lockedMessage?->getKey(),
                        $checksum,
                    ),
                ]);

                $this->audit->record(
                    operation: 'attachment.uploaded',
                    auditable: $attachment,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($lockedProject->institution_id),
                    after: $this->summary($attachment),
                );

                return $attachment->refresh()->load(['project', 'uploadedBy']);
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->storage->deletePath($storedPath);

            throw $exception;
        }
    }

    /**
     * @return array{attachment_id: int, project_id: int, message_id: int|null, purpose: string, mime_type: string, size_bytes: int}
     */
    private function summary(Attachment $attachment): array
    {
        return [
            'attachment_id' => $attachment->getKey(),
            'project_id' => $attachment->project_id,
            'message_id' => $attachment->message_id,
            'purpose' => $attachment->purpose->value,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
        ];
    }
}
