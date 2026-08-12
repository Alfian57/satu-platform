<?php

declare(strict_types=1);

namespace App\Support\Attachment;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;

final class AttachmentRequirements
{
    public const MAX_SIZE_KB = 10240;

    /**
     * @return list<string>
     */
    public static function allowedExtensions(): array
    {
        return [
            'csv',
            'doc',
            'docx',
            'jpg',
            'jpeg',
            'pdf',
            'png',
            'ppt',
            'pptx',
            'txt',
            'webp',
            'xls',
            'xlsx',
        ];
    }

    /**
     * @return list<mixed>
     */
    public static function validationRules(): array
    {
        return [
            'required',
            'file',
            File::types(self::allowedExtensions())->max(self::MAX_SIZE_KB),
        ];
    }

    public static function validate(UploadedFile $file): void
    {
        Validator::validate(['file' => $file], ['file' => self::validationRules()]);
    }

    public static function checksum(UploadedFile $file): string
    {
        $path = $file->getRealPath();
        $checksum = is_string($path) ? hash_file('sha256', $path) : false;

        if (! is_string($checksum)) {
            throw ValidationException::withMessages([
                'file' => 'File tidak dapat dibaca untuk validasi keamanan.',
            ]);
        }

        return $checksum;
    }

    public static function sizeBytes(UploadedFile $file): int
    {
        $size = $file->getSize();

        if (! is_int($size) || $size < 1) {
            throw ValidationException::withMessages([
                'file' => 'Ukuran file tidak valid.',
            ]);
        }

        return $size;
    }

    public static function mimeType(UploadedFile $file): string
    {
        $mimeType = $file->getMimeType();

        if (! is_string($mimeType) || trim($mimeType) === '') {
            throw ValidationException::withMessages([
                'file' => 'Tipe file tidak dapat diverifikasi.',
            ]);
        }

        return $mimeType;
    }

    public static function originalName(UploadedFile $file): string
    {
        $name = Str::of($file->getClientOriginalName())
            ->replace('\\', '/')
            ->afterLast('/')
            ->replaceMatches('/[\x00-\x1F\x7F]/u', '')
            ->replaceMatches('/[^\pL\pN._ -]/u', '_')
            ->squish()
            ->trim()
            ->limit(255, '')
            ->toString();

        return in_array($name, ['', '.', '..'], true) ? 'attachment' : $name;
    }

    public static function deduplicationKey(int $projectId, ?int $messageId, string $checksum): string
    {
        return hash('sha256', implode(':', [
            $projectId,
            $messageId ?? 'project',
            $checksum,
        ]));
    }
}
