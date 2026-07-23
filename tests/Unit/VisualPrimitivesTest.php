<?php

function visualPrimitivesProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

/**
 * @return array<string, string>
 */
function visualPrimitivesThemeTokens(string $selector): array
{
    $css = visualPrimitivesProjectFile('resources/css/app.css');
    $selectorPattern = preg_quote($selector, '/');

    if (preg_match("/{$selectorPattern}\\s*\\{(?<block>.*?)\\n\\}/s", $css, $match) !== 1) {
        throw new RuntimeException("Unable to find the [{$selector}] theme block.");
    }

    preg_match_all(
        '/--(?<name>[a-z0-9-]+):\s*(?<value>#[0-9a-f]{6});/i',
        $match['block'],
        $tokens,
        PREG_SET_ORDER,
    );

    return array_column($tokens, 'value', 'name');
}

/**
 * @return array{0: float, 1: float, 2: float}
 */
function visualPrimitivesRgb(string $hex): array
{
    return array_map(
        static fn (string $channel): float => hexdec($channel) / 255,
        str_split(ltrim($hex, '#'), 2),
    );
}

function visualPrimitivesLuminance(string $hex): float
{
    [$red, $green, $blue] = array_map(
        static fn (float $channel): float => $channel <= 0.04045
            ? $channel / 12.92
            : (($channel + 0.055) / 1.055) ** 2.4,
        visualPrimitivesRgb($hex),
    );

    return 0.2126 * $red + 0.7152 * $green + 0.0722 * $blue;
}

function visualPrimitivesContrast(string $first, string $second): float
{
    $firstLuminance = visualPrimitivesLuminance($first);
    $secondLuminance = visualPrimitivesLuminance($second);

    return (max($firstLuminance, $secondLuminance) + 0.05)
        / (min($firstLuminance, $secondLuminance) + 0.05);
}

test('defines the SATU visual primitive contract', function () {
    $css = visualPrimitivesProjectFile('resources/css/app.css');
    $viteConfig = visualPrimitivesProjectFile('vite.config.ts');

    expect($css)
        ->toContain('@theme inline')
        ->toContain("'Familjen Grotesk'")
        ->toContain("'Azeret Mono'")
        ->toContain('--font-label:')
        ->toContain('--spacing-density-dense: 0.5rem;')
        ->toContain('--spacing-density-working: 0.75rem;')
        ->toContain('--spacing-density-focused: 1rem;')
        ->toContain('--spacing-control-sm: 2.25rem;')
        ->toContain('--spacing-control-md: 2.5rem;')
        ->toContain('--spacing-control-lg: 2.75rem;')
        ->toContain('--radius-xs: 0.125rem;')
        ->toContain('--radius-lg: 0.5rem;')
        ->toContain('--radius-4xl: 0.5rem;')
        ->toContain('--shadow-xs: 0 0 #0000;')
        ->toContain('--verified-subtle:')
        ->toContain('--pending-subtle:')
        ->toContain('--correction-subtle:')
        ->toContain('--ease-ledger: cubic-bezier(0.2, 0.8, 0.2, 1);')
        ->toContain('outline: 2px solid var(--ring);')
        ->toContain('button:not(:disabled)')
        ->toContain('cursor: pointer;')
        ->toContain('cursor: not-allowed;')
        ->toContain('@media (prefers-reduced-motion: reduce)')
        ->not->toContain("'Instrument Sans'");

    expect($viteConfig)
        ->toContain("bunny('Familjen Grotesk'")
        ->toContain("bunny('Azeret Mono'")
        ->toContain('preload: false')
        ->not->toContain("bunny('Instrument Sans'");
});

test('keeps the pre-CSS theme bootstrap aligned with the canvas tokens', function () {
    $blade = visualPrimitivesProjectFile('resources/views/app.blade.php');

    expect($blade)
        ->toContain('color-scheme: light;')
        ->toContain('background-color: #f7f9fc;')
        ->toContain('color-scheme: dark;')
        ->toContain('background-color: #0d1422;');
});

dataset('visual primitive contrast pairs', [
    'light canvas text' => [':root', 'background', 'foreground', 4.5],
    'light surface text' => [':root', 'card', 'card-foreground', 4.5],
    'light action' => [':root', 'primary', 'primary-foreground', 4.5],
    'light secondary' => [':root', 'secondary', 'secondary-foreground', 4.5],
    'light supporting text' => [':root', 'muted', 'muted-foreground', 4.5],
    'light accent' => [':root', 'accent', 'accent-foreground', 4.5],
    'light destructive' => [':root', 'destructive', 'destructive-foreground', 4.5],
    'light verified' => [':root', 'verified', 'verified-foreground', 4.5],
    'light verified subtle' => [':root', 'verified-subtle', 'verified-subtle-foreground', 4.5],
    'light pending' => [':root', 'pending', 'pending-foreground', 4.5],
    'light pending subtle' => [':root', 'pending-subtle', 'pending-subtle-foreground', 4.5],
    'light correction' => [':root', 'correction', 'correction-foreground', 4.5],
    'light correction subtle' => [':root', 'correction-subtle', 'correction-subtle-foreground', 4.5],
    'light focus' => [':root', 'background', 'ring', 3.0],
    'light input boundary' => [':root', 'background', 'input', 3.0],
    'dark canvas text' => ['.dark', 'background', 'foreground', 4.5],
    'dark surface text' => ['.dark', 'card', 'card-foreground', 4.5],
    'dark action' => ['.dark', 'primary', 'primary-foreground', 4.5],
    'dark secondary' => ['.dark', 'secondary', 'secondary-foreground', 4.5],
    'dark supporting text' => ['.dark', 'muted', 'muted-foreground', 4.5],
    'dark accent' => ['.dark', 'accent', 'accent-foreground', 4.5],
    'dark destructive' => ['.dark', 'destructive', 'destructive-foreground', 4.5],
    'dark verified' => ['.dark', 'verified', 'verified-foreground', 4.5],
    'dark verified subtle' => ['.dark', 'verified-subtle', 'verified-subtle-foreground', 4.5],
    'dark pending' => ['.dark', 'pending', 'pending-foreground', 4.5],
    'dark pending subtle' => ['.dark', 'pending-subtle', 'pending-subtle-foreground', 4.5],
    'dark correction' => ['.dark', 'correction', 'correction-foreground', 4.5],
    'dark correction subtle' => ['.dark', 'correction-subtle', 'correction-subtle-foreground', 4.5],
    'dark focus' => ['.dark', 'background', 'ring', 3.0],
    'dark input boundary' => ['.dark', 'background', 'input', 3.0],
]);

test(
    'meets the minimum contrast for :dataset',
    function (
        string $selector,
        string $backgroundToken,
        string $foregroundToken,
        float $minimumContrast,
    ) {
        $tokens = visualPrimitivesThemeTokens($selector);
        $contrast = visualPrimitivesContrast(
            $tokens[$backgroundToken],
            $tokens[$foregroundToken],
        );

        expect($contrast)->toBeGreaterThanOrEqual($minimumContrast);
    },
)->with('visual primitive contrast pairs');
