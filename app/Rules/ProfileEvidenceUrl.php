<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ProfileEvidenceUrl implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::isSafe($value)) {
            $fail('Gunakan tautan HTTPS dengan domain eksternal, tanpa kredensial atau alamat jaringan privat.');
        }
    }

    public static function isSafe(mixed $value): bool
    {
        if (! is_string($value) || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return false;
        }
        $parts = parse_url($value);
        if (! is_array($parts) || strtolower($parts['scheme'] ?? '') !== 'https'
            || isset($parts['user']) || isset($parts['pass']) || ! isset($parts['host'])) {
            return false;
        }
        $host = strtolower($parts['host']);

        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
            foreach (array_keys($query) as $key) {
                if (preg_match('/^(?:token|access_token|password|secret|api_key|key|signature|authorization|auth|x-amz-.+|x-goog-.+)$/i', (string) $key) === 1) {
                    return false;
                }
            }
        }

        return str_contains($host, '.') && ! str_ends_with($host, '.')
            && filter_var(trim($host, '[]'), FILTER_VALIDATE_IP) === false
            && preg_match('/^(?:0x[a-f0-9]+|[0-9]+)(?:\.(?:0x[a-f0-9]+|[0-9]+)){0,3}$/i', $host) !== 1
            && preg_match('/(?:^|\.)(?:localhost|local|internal|lan|test|invalid)$/i', $host) !== 1;
    }
}
