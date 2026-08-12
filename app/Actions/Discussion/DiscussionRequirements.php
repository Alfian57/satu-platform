<?php

declare(strict_types=1);

namespace App\Actions\Discussion;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class DiscussionRequirements
{
    public function body(mixed $value): string
    {
        if (! is_string($value)) {
            throw ValidationException::withMessages([
                'body' => 'Isi discussion harus berupa teks.',
            ]);
        }

        $body = trim($value);

        if ($body === '' || Str::length($body) > 5000) {
            throw ValidationException::withMessages([
                'body' => 'Isi discussion wajib diisi dan maksimal 5000 karakter.',
            ]);
        }

        return $body;
    }
}
