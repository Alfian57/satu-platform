<?php

function surfaceBriefProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 3).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

/**
 * @return array<string, array{frontmatter: array<string, mixed>, body: string}>
 */
function surfaceBriefFrontmatter(string $path): array
{
    $content = surfaceBriefProjectFile($path);

    if (! str_starts_with($content, '---')) {
        throw new RuntimeException("Missing YAML frontmatter in [{$path}].");
    }

    $end = strpos($content, '---', 3);

    if ($end === false) {
        throw new RuntimeException("Unterminated YAML frontmatter in [{$path}].");
    }

    $yaml = substr($content, 3, $end - 3);
    $body = substr($content, $end + 3);

    $lines = explode("\n", trim($yaml));
    $frontmatter = [];

    foreach ($lines as $line) {
        $colonPos = strpos($line, ':');

        if ($colonPos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $colonPos));
        $value = trim(substr($line, $colonPos + 1));

        if (str_starts_with($value, '[') && str_ends_with($value, ']')) {
            $inner = trim(substr($value, 1, -1));

            if ($inner === '') {
                $frontmatter[$key] = [];
            } else {
                $frontmatter[$key] = array_map(
                    fn (string $item): string => trim(trim($item), "'\""),
                    explode(',', $inner),
                );
            }
        } else {
            $frontmatter[$key] = trim($value, "'\"");
        }
    }

    return ['frontmatter' => $frontmatter, 'body' => $body];
}

describe('route-login', function () {
    $brief = surfaceBriefFrontmatter('.impeccable/surfaces/route-login.md');
    $fm = $brief['frontmatter'];
    $body = $brief['body'];

    test('has required YAML frontmatter fields', function () use ($fm) {
        expect($fm)->toHaveKeys(['version', 'slug', 'primary_target']);
        expect($fm['slug'])->toBe('route-login');
        expect($fm['primary_target'])->toBe('route:/login');
    });

    test('documents job and boundaries', function () use ($body) {
        expect($body)
            ->toContain('## Scope and Boundaries')
            ->toContain('**Job:**')
            ->toContain('**Boundaries:**')
            ->toContain('**Provider boundary:**');
    });

    test('records failure, expiry, cooldown, pending, offline, and privacy states', function () use ($body) {
        expect($body)
            ->toContain('Delivery failed')
            ->toContain('OTP invalid')
            ->toContain('OTP expired')
            ->toContain('OTP replayed')
            ->toContain('Cooldown (resend)')
            ->toContain('Cooldown (rate limit)')
            ->toContain('Delivery queued')
            ->toContain('Offline')
            ->toContain('Privacy')
            ->toContain('nomor dimasking')
            ->toContain('Token tidak mencapai browser');
    });

    test('records keyboard, screen reader, reduced motion, and mobile consequence', function () use ($body) {
        expect($body)
            ->toContain('### Keyboard')
            ->toContain('### Screen Reader')
            ->toContain('### Reduced Motion')
            ->toContain('### Mobile Consequence');
    });

    test('references LOADING_STATES.md in loading contract', function () use ($body) {
        expect($body)
            ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
            ->toContain('aria-busy="true"')
            ->toContain('role="status"');
    });

    test('does not use unicode em dash', function () use ($body) {
        expect($body)->not->toContain("\u{2014}");
    });
});

describe('route-onboarding', function () {
    $brief = surfaceBriefFrontmatter('.impeccable/surfaces/route-onboarding.md');
    $fm = $brief['frontmatter'];
    $body = $brief['body'];

    test('has required YAML frontmatter fields', function () use ($fm) {
        expect($fm)->toHaveKeys(['version', 'slug', 'primary_target']);
        expect($fm['slug'])->toBe('route-onboarding');
        expect($fm['primary_target'])->toBe('route:/onboarding');
    });

    test('documents job and boundaries', function () use ($body) {
        expect($body)
            ->toContain('## Scope and Boundaries')
            ->toContain('**Job:**')
            ->toContain('**Boundaries:**')
            ->toContain('**Provider boundary:**');
    });

    test('records failure, expiry, cooldown, pending, offline, and privacy states', function () use ($body) {
        expect($body)
            ->toContain('Roster ambiguous')
            ->toContain('Manual review pending')
            ->toContain('Manual review rejected')
            ->toContain('Network error')
            ->toContain('Stale session')
            ->toContain('Forbidden')
            ->toContain('Rate limited/cooldown')
            ->toContain('Permission loss')
            ->toContain('Privacy')
            ->toContain('NIM dimasking')
            ->toContain('Nomor WhatsApp dimasking')
            ->toContain('default: tidak dibagikan ke recruiter');
    });

    test('records keyboard, screen reader, reduced motion, and mobile consequence', function () use ($body) {
        expect($body)
            ->toContain('### Keyboard')
            ->toContain('### Screen Reader')
            ->toContain('### Reduced Motion')
            ->toContain('### Mobile Consequence');
    });

    test('references LOADING_STATES.md in loading contract', function () use ($body) {
        expect($body)
            ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
            ->toContain('aria-busy="true"');
    });

    test('does not use unicode em dash', function () use ($body) {
        expect($body)->not->toContain("\u{2014}");
    });
});

describe('route-notifications', function () {
    $brief = surfaceBriefFrontmatter('.impeccable/surfaces/route-notifications.md');
    $fm = $brief['frontmatter'];
    $body = $brief['body'];

    test('has required YAML frontmatter fields', function () use ($fm) {
        expect($fm)->toHaveKeys(['version', 'slug', 'primary_target']);
        expect($fm['slug'])->toBe('route-notifications');
        expect($fm['primary_target'])->toBe('route:/notifications');
    });

    test('documents job and boundaries', function () use ($body) {
        expect($body)
            ->toContain('## Scope and Boundaries')
            ->toContain('**Job:**')
            ->toContain('**Boundaries:**')
            ->toContain('**Provider boundary:**');
    });

    test('records failure, expiry, cooldown, pending, offline, and privacy states', function () use ($body) {
        expect($body)
            ->toContain('Delivery failed')
            ->toContain('Delivery queued')
            ->toContain('Offline')
            ->toContain('Stale data')
            ->toContain('Stale')
            ->toContain('Forbidden')
            ->toContain('Privacy')
            ->toContain('Raw provider payload')
            ->toContain('Nomor WhatsApp penuh')
            ->toContain('Inclusion signal');
    });

    test('records keyboard, screen reader, reduced motion, and mobile consequence', function () use ($body) {
        expect($body)
            ->toContain('### Keyboard')
            ->toContain('### Screen Reader')
            ->toContain('### Reduced Motion')
            ->toContain('### Mobile Consequence');
    });

    test('references LOADING_STATES.md in loading contract', function () use ($body) {
        expect($body)
            ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
            ->toContain('aria-busy="true"');
    });

    test('does not use unicode em dash', function () use ($body) {
        expect($body)->not->toContain("\u{2014}");
    });
});
