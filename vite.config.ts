import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isProduction = env.APP_ENV === 'production';

    return {
        server: {
            host: 'localhost',
            port: 5173,
            strictPort: true,
            hmr: {
                host: 'localhost',
            },
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                publicDirectory: isProduction ? '../public_html' : 'public',
                refresh: true,
                fonts: [
                    bunny('Familjen Grotesk', {
                        weights: [400, 500, 600, 700],
                        preload: [
                            { weight: 400, style: 'normal' },
                            { weight: 600, style: 'normal' },
                        ],
                        fallbacks: ['system-ui', 'sans-serif'],
                        optimizedFallbacks: false,
                    }),
                    bunny('Azeret Mono', {
                        weights: [400, 500, 600],
                        preload: false,
                        fallbacks: ['ui-monospace', 'monospace'],
                        optimizedFallbacks: false,
                    }),
                ],
            }),
            inertia(),
            react({
                babel: {
                    plugins: ['babel-plugin-react-compiler'],
                },
            }),
            tailwindcss(),
            wayfinder({
                formVariants: true,
            }),
        ],
        build: {
            emptyOutDir: true,
        },
    };
});
