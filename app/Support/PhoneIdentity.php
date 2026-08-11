<?php

namespace App\Support;

use InvalidArgumentException;
use Propaganistas\LaravelPhone\PhoneNumber as ParsedPhoneNumber;
use Throwable;

final class PhoneIdentity
{
    public static function normalize(string $phone): string
    {
        try {
            $parsedPhone = new ParsedPhoneNumber(trim($phone), 'ID');

            if (! $parsedPhone->isValid()) {
                throw new InvalidArgumentException;
            }

            return $parsedPhone->formatE164();
        } catch (Throwable) {
            throw new InvalidArgumentException('Phone number must use valid E.164 format.');
        }
    }

    public static function hash(string $phone): string
    {
        return hash_hmac('sha256', self::normalize($phone), (string) config('app.key'));
    }

    public static function mask(string $phone): string
    {
        $normalized = self::normalize($phone);

        return mb_substr($normalized, 0, 3)
            .str_repeat('•', max(mb_strlen($normalized) - 5, 3))
            .mb_substr($normalized, -2);
    }
}
