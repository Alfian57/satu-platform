<?php

namespace App\Support;

use Illuminate\Support\Str;

class AuditDataRedactor
{
    /**
     * Remove sensitive keys recursively while retaining safe summary fields.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function redact(array $data): array
    {
        /** @var array<string, mixed> $redacted */
        $redacted = $this->redactArray($data);

        return $redacted;
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<array-key, mixed>
     */
    private function redactArray(array $data): array
    {
        $redacted = [];

        foreach ($data as $key => $value) {
            if (is_string($key) && $this->isSensitiveKey($key)) {
                continue;
            }

            [$supported, $normalized] = $this->normalizeValue($value);

            if ($supported) {
                $redacted[$key] = $normalized;
            }
        }

        return $redacted;
    }

    /**
     * @return array{bool, mixed}
     */
    private function normalizeValue(mixed $value): array
    {
        if (
            $value === null
            || is_string($value)
            || is_int($value)
            || is_bool($value)
        ) {
            return [true, $value];
        }

        if (is_float($value)) {
            return [is_finite($value), $value];
        }

        if (is_array($value)) {
            return [true, $this->redactArray($value)];
        }

        return [false, null];
    }

    private function isSensitiveKey(string $key): bool
    {
        $normalized = (string) Str::of($key)
            ->snake()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_');

        $segments = explode('_', $normalized);

        if (
            Str::endsWith($normalized, ['_id', '_ids'])
            || $normalized === 'policy_version'
            || Str::endsWith($normalized, '_policy_version')
        ) {
            return false;
        }

        if (array_intersect($segments, [
            'password',
            'secret',
            'token',
            'authorization',
            'cookie',
            'credential',
            'credentials',
            'private',
            'raw',
            'payload',
            'blob',
            'sensitive',
        ]) !== []) {
            return true;
        }

        if (
            in_array('inclusion', $segments, true)
            && in_array('signal', $segments, true)
        ) {
            return true;
        }

        if (
            array_intersect($segments, ['message', 'chat', 'comment', 'evidence']) !== []
        ) {
            return true;
        }

        if (
            in_array('consent', $segments, true)
            && array_intersect($segments, ['body', 'content', 'text']) !== []
        ) {
            return true;
        }

        if (
            in_array('key', $segments, true)
            && array_intersect($segments, ['api', 'private']) !== []
        ) {
            return true;
        }

        return in_array($normalized, [
            'body',
            'consent',
            'content',
            'message',
            'message_body',
            'message_content',
            'evidence',
            'evidence_content',
            'raw_evidence',
            'raw_sensitive_payload',
            'consent_payload',
            'two_factor_recovery_codes',
            'recovery_codes',
            'sensitive_score_factors',
            'inclusion_signal',
            'api_key',
            'private_key',
            'credentials',
            'raw_consent',
            'raw_payload',
            'message_text',
            'chat_message',
            'comment_body',
            'evidence_path',
            'evidence_blob',
            'evidence_payload',
        ], true);
    }
}
