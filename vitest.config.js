import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            'tests/e2e/**'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                '*.config.js',
                'src/vendor/'
            ],
            include: [
                'src/**/*.js'
            ],
            all: true,
            // Report uncovered lines
            reportOnFailure: true,
            // More detailed reporting
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
            // Track per-file coverage
            perFile: true
        }
    }
});
