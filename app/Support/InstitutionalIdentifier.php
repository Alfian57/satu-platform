<?php

namespace App\Support;

use Illuminate\Support\Str;
use InvalidArgumentException;

final class InstitutionalIdentifier
{
    public static function normalize(string $identifier): string
    {
        $normalized = (string) Str::of($identifier)->trim()->lower();

        if ($normalized === '' || Str::length($normalized) > 50) {
            throw new InvalidArgumentException('Institutional identifier must be between 1 and 50 characters.');
        }

        return $normalized;
    }

    public static function hash(string $identifier): string
    {
        return hash_hmac(
            'sha256',
            self::normalize($identifier),
            (string) config('app.key'),
        );
    }
}
