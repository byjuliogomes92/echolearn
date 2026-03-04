import { defineConfig } from 'vite';
import { resolve } from 'path';

// Chrome extensions require separate JS bundles per entry point.
// A single bundle won't work because each context (background,
// content, popup, offscreen) runs in a fully isolated environment
// with different APIs available.
export default defineConfig(({ mode }) => ({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: mode === 'development',
        minify: mode === 'production',
        rollupOptions: {
            input: {
                'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
                'content/index': resolve(__dirname, 'src/content/index.ts'),
                'offscreen/index': resolve(__dirname, 'src/offscreen/index.ts'),
                'popup/index': resolve(__dirname, 'src/popup/index.ts'),
                'options/index': resolve(__dirname, 'src/options/index.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'shared/[name]-[hash].js',
                assetFileNames: '[name].[ext]',
            },
        },
    },
    resolve: {
        alias: {
            '@shared': resolve(__dirname, 'src/shared'),
            '@background': resolve(__dirname, 'src/background'),
            '@content': resolve(__dirname, 'src/content'),
            '@offscreen': resolve(__dirname, 'src/offscreen'),
        },
    },
    define: {
        __DEV__: mode === 'development',
        __VERSION__: JSON.stringify(process.env.npm_package_version),
    },
}));