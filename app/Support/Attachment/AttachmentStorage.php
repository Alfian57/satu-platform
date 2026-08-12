<?php

declare(strict_types=1);

namespace App\Support\Attachment;

use App\Models\Attachment;
use App\Models\Project;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class AttachmentStorage
{
    public const DISK = 'private';

    public static function directory(Project $project): string
    {
        return sprintf(
            'institutions/%d/projects/%d/attachments',
            $project->institution_id,
            $project->getKey(),
        );
    }

    public function store(Project $project, UploadedFile $file): string
    {
        $directory = self::directory($project);
        $filename = Str::uuid()->toString();
        $path = Storage::disk(self::DISK)->putFileAs($directory, $file, $filename);

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('Attachment could not be stored.');
        }

        return $path;
    }

    public function delete(Attachment $attachment): void
    {
        $this->disk($attachment)->delete($attachment->path);
    }

    public function deletePath(string $path): void
    {
        Storage::disk(self::DISK)->delete($path);
    }

    public function download(Attachment $attachment): StreamedResponse
    {
        $disk = $this->disk($attachment);

        if (! $this->isManagedPath($attachment) || ! $disk->exists($attachment->path)) {
            abort(404);
        }

        return $disk->download(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type,
                'Content-Length' => (string) $attachment->size_bytes,
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    public function preview(Attachment $attachment): StreamedResponse
    {
        $disk = $this->disk($attachment);

        if (! $this->isManagedPath($attachment) || ! $disk->exists($attachment->path)) {
            abort(404);
        }

        return $disk->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type,
                'Content-Length' => (string) $attachment->size_bytes,
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    public function isManagedPath(Attachment $attachment): bool
    {
        $project = $attachment->project;

        return $project instanceof Project
            && $attachment->disk === self::DISK
            && Str::startsWith($attachment->path, self::directory($project).'/');
    }

    private function disk(Attachment $attachment): FilesystemAdapter
    {
        return Storage::disk($attachment->disk);
    }
}
