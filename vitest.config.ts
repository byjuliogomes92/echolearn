import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.d.ts',
                'src/popup/index.ts',
                'src/options/index.ts',
                'src/offscreen/index.ts',
                'src/background/service-worker.ts',
                'src/content/index.ts',
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 70,
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
});