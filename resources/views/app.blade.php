<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Match the design tokens before Vite CSS loads. --}}
        <style>
            html {
                color-scheme: light;
                background-color: #f3f9ff;
            }

            html[data-appearance='dark'] {
                color-scheme: dark;
                background-color: #0d1422;
            }
        </style>

        <link rel="icon" href="/favicon.ico?v=logo-02" type="image/x-icon" sizes="16x16 32x32 48x48">
        <link rel="icon" href="/favicon.png?v=logo-02" type="image/png" sizes="64x64">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=logo-02" sizes="180x180">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
